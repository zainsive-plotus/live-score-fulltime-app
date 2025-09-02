// ===== src/app/admin/(protected)/link-tracker/[id]/page.tsx =====

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart2,
  Link as LinkIcon,
  Calendar,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { ITrackedLink } from "@/models/TrackedLink";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import AdminPagination from "@/components/admin/AdminPagination"; // ADDED

interface TimeSeriesData {
  date: string;
  clicks: number;
}

// MODIFIED: Updated the data structure to match the new API response
interface LinkStatsData {
  link: ITrackedLink;
  timeSeries: {
    last7Days: TimeSeriesData[];
    last30Days: TimeSeriesData[];
  };
  clicksLog: {
    entries: any[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
    };
  };
}

// MODIFIED: fetch function now accepts the log page number
const fetchLinkStats = async (
  linkId: string,
  logPage: number
): Promise<LinkStatsData | null> => {
  if (!linkId) return null;
  const { data } = await axios.get(
    `/api/admin/tracked-links/${linkId}/stats?logPage=${logPage}`
  );
  return data;
};

const StatCard = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
}) => (
  <div className="bg-brand-dark/50 p-4 rounded-lg flex items-start gap-4">
    <div className="bg-brand-purple/20 text-brand-purple p-3 rounded-md">
      <Icon size={24} />
    </div>
    <div>
      <p className="text-sm text-brand-muted">{label}</p>
      <p
        className="text-2xl font-bold text-white truncate"
        title={typeof value === "string" ? value : ""}
      >
        {value}
      </p>
    </div>
  </div>
);

export default function LinkStatsPage() {
  const router = useRouter();
  const params = useParams();
  const linkId = params.id as string;
  const [timeframe, setTimeframe] = useState<"last7Days" | "last30Days">(
    "last7Days"
  );
  // ADDED: State for the clicks log pagination
  const [logCurrentPage, setLogCurrentPage] = useState(1);

  const {
    data: statsData,
    isLoading,
    isError,
  } = useQuery<LinkStatsData | null>({
    // MODIFIED: Query key now includes logCurrentPage to trigger refetches
    queryKey: ["linkStats", linkId, logCurrentPage],
    queryFn: () => fetchLinkStats(linkId, logCurrentPage),
    enabled: !!linkId,
    keepPreviousData: true, // For smooth pagination
  });

  const chartData = statsData?.timeSeries[timeframe];
  const clicksLog = statsData?.clicksLog;

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-semibold text-brand-muted hover:text-white mb-6"
      >
        <ArrowLeft size={16} />
        Back to All Links
      </button>

      {isLoading && !statsData ? ( // Show skeleton only on initial load
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-3/4 bg-gray-700 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-brand-dark/50 rounded-lg"></div>
            <div className="h-24 bg-brand-dark/50 rounded-lg"></div>
            <div className="h-24 bg-brand-dark/50 rounded-lg"></div>
          </div>
          <div className="h-96 bg-brand-secondary rounded-lg"></div>
        </div>
      ) : isError || !statsData?.link ? (
        <div className="text-center py-20 text-red-400">
          <Info size={40} className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white">
            Could Not Load Link Data
          </h2>
          <p>The link may have been deleted or an error occurred.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <BarChart2 size={28} />
              Statistics for:{" "}
              <span className="text-brand-purple">
                {statsData.link.description}
              </span>
            </h1>
            <a
              href={statsData.link.fullShortLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:underline mt-1"
            >
              {statsData.link.fullShortLink}
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Total Clicks"
              value={statsData.link.clickCount}
              icon={BarChart2}
            />
            <StatCard
              label="Destination URL"
              value={statsData.link.originalUrl.substring(0, 30) + "..."}
              icon={LinkIcon}
            />
            <StatCard
              label="Date Created"
              value={format(new Date(statsData.link.createdAt), "dd MMM yyyy")}
              icon={Calendar}
            />
          </div>

          <div className="bg-brand-secondary rounded-lg">
            <div className="p-4 flex justify-between items-center border-b border-gray-700/50">
              <h3 className="font-bold text-white">Clicks Over Time</h3>
              <div className="flex items-center gap-1 bg-brand-dark p-1 rounded-md">
                <button
                  onClick={() => setTimeframe("last7Days")}
                  className={`px-3 py-1 text-xs font-semibold rounded ${
                    timeframe === "last7Days"
                      ? "bg-brand-purple text-white"
                      : "text-brand-muted hover:bg-gray-700"
                  }`}
                >
                  7 Days
                </button>
                <button
                  onClick={() => setTimeframe("last30Days")}
                  className={`px-3 py-1 text-xs font-semibold rounded ${
                    timeframe === "last30Days"
                      ? "bg-brand-purple text-white"
                      : "text-brand-muted hover:bg-gray-700"
                  }`}
                >
                  30 Days
                </button>
              </div>
            </div>
            <div className="p-4 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#252837" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(tick) => format(new Date(tick), "dd MMM")}
                    stroke="#9e9e9e"
                    fontSize={12}
                  />
                  <YAxis allowDecimals={false} stroke="#9e9e9e" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f1d2b",
                      border: "1px solid #4a5568",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-brand-secondary rounded-lg">
            <h3 className="p-4 font-bold text-white border-b border-gray-700/50">
              Clicks Log ({clicksLog?.pagination.totalCount})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-brand-muted uppercase">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Source</th>
                    <th className="p-3">Medium</th>
                    <th className="p-3">Campaign</th>
                    <th className="p-3">Referrer</th>
                    <th className="p-3">User Agent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {clicksLog?.entries.map((click, index) => (
                    <tr key={index}>
                      <td className="p-3 whitespace-nowrap">
                        {format(
                          new Date(click.timestamp),
                          "dd MMM yyyy, HH:mm:ss"
                        )}
                      </td>
                      <td className="p-3 text-brand-light font-semibold">
                        {statsData.link.utmSource || "-"}
                      </td>
                      <td className="p-3 text-brand-light font-semibold">
                        {statsData.link.utmMedium || "-"}
                      </td>
                      <td className="p-3 text-brand-light font-semibold">
                        {statsData.link.utmCampaign || "-"}
                      </td>
                      <td
                        className="p-3 text-blue-400 max-w-[200px] truncate"
                        title={click.referrer}
                      >
                        {click.referrer || "Direct"}
                      </td>
                      <td
                        className="p-3 text-brand-light max-w-[200px] truncate"
                        title={click.userAgent}
                      >
                        {click.userAgent}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {clicksLog?.entries.length === 0 && (
                <p className="p-8 text-center text-brand-muted">
                  No clicks have been recorded for this link yet.
                </p>
              )}
            </div>
            {clicksLog && clicksLog.pagination.totalPages > 1 && (
              <div className="p-4 border-t border-gray-700/50">
                <AdminPagination
                  currentPage={logCurrentPage}
                  totalPages={clicksLog.pagination.totalPages}
                  onPageChange={setLogCurrentPage}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
