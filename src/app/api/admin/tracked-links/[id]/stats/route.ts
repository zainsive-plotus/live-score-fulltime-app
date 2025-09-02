// ===== src/app/api/admin/tracked-links/[id]/stats/route.ts =====

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/dbConnect";
import TrackedLink from "@/models/TrackedLink";
import {
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  format,
  subDays,
} from "date-fns";

interface Params {
  params: { id: string };
}

const aggregateClicksByDay = (analytics: any[], days: number) => {
  const endDate = endOfDay(new Date());
  const startDate = startOfDay(subDays(endDate, days - 1));
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  const clicksMap = new Map<string, number>();
  dateRange.forEach((date) => {
    clicksMap.set(format(date, "yyyy-MM-dd"), 0);
  });

  analytics.forEach((click) => {
    const clickDate = format(new Date(click.timestamp), "yyyy-MM-dd");
    if (clicksMap.has(clickDate)) {
      clicksMap.set(clickDate, (clicksMap.get(clickDate) || 0) + 1);
    }
  });

  return Array.from(clicksMap.entries()).map(([date, count]) => ({
    date,
    clicks: count,
  }));
};

export async function GET(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    // NEW: Get pagination parameters for the click log
    const logPage = parseInt(searchParams.get("logPage") || "1");
    const logLimit = 20; // Set a fixed limit for the log entries per page
    const logSkip = (logPage - 1) * logLimit;

    // Fetch the main link data, which includes the total click count
    const link = await TrackedLink.findById(id).select("-analytics").lean();

    if (!link) {
      return NextResponse.json({ error: "Link not found." }, { status: 404 });
    }

    // NEW: Fetch a paginated slice of the analytics sub-document array
    // This is much more efficient than fetching the entire array every time.
    const linkWithAnalytics = await TrackedLink.findById(id)
      .select({ analytics: { $slice: [-10000, 10000] } }) // Get the full array for chart aggregation
      .lean();

    const allAnalytics = linkWithAnalytics?.analytics || [];

    // Sort all clicks descending by timestamp
    allAnalytics.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Paginate the sorted clicks
    const paginatedLog = allAnalytics.slice(logSkip, logSkip + logLimit);
    const totalLogCount = link.clickCount;
    const totalLogPages = Math.ceil(totalLogCount / logLimit);

    // Aggregate data for charts using the full (but capped) analytics array
    const clicksLast7Days = aggregateClicksByDay(allAnalytics, 7);
    const clicksLast30Days = aggregateClicksByDay(allAnalytics, 30);

    return NextResponse.json({
      link,
      timeSeries: {
        last7Days: clicksLast7Days,
        last30Days: clicksLast30Days,
      },
      clicksLog: {
        entries: paginatedLog,
        pagination: {
          currentPage: logPage,
          totalPages: totalLogPages,
          totalCount: totalLogCount,
        },
      },
    });
  } catch (error) {
    console.error(`[API/tracked-links/stats] GET Error for ID ${id}:`, error);
    return NextResponse.json(
      { error: "Server error fetching link statistics." },
      { status: 500 }
    );
  }
}
