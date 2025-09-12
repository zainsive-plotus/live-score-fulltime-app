// ===== src/app/api/admin/referrer-rules/[id]/stats/route.ts =====

import { NextResponse, NextRequest } from "next/server";
import dbConnect from "@/lib/dbConnect";
import ReferrerRule from "@/models/ReferrerRule";

interface Params {
  params: { id: string };
}

const statsHandler = async (request: NextRequest, { params }: Params) => {
  const { id } = params;
  const { searchParams } = new URL(request.url);
  const logPage = parseInt(searchParams.get("logPage") || "1");
  const logLimit = 25;
  const logSkip = (logPage - 1) * logLimit;

  try {
    await dbConnect();
    const rule = await ReferrerRule.findById(id).lean();

    if (!rule) {
      return NextResponse.json(
        { error: "Referrer rule not found." },
        { status: 404 }
      );
    }

    const sortedAnalytics = (rule.analytics || []).sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const paginatedLog = sortedAnalytics.slice(logSkip, logSkip + logLimit);
    const totalLogCount = rule.hitCount || 0;
    const totalLogPages = Math.ceil(totalLogCount / logLimit);

    const { analytics, ...ruleDetails } = rule;

    return NextResponse.json({
      rule: ruleDetails,
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
    console.error(`[API/referrer-rules/stats] Error for ID ${id}:`, error);
    return NextResponse.json(
      { error: "Server error fetching rule statistics." },
      { status: 500 }
    );
  }
};

export const GET = statsHandler;
