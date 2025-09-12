// ===== src/app/admin/(protected)/referrer-tracker/[id]/stats/page.tsx =====

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart2,
  Globe,
  Calendar,
  Info,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import { IReferrerRule } from "@/models/ReferrerRule";
import AdminPagination from "@/components/admin/AdminPagination";

interface ClicksLog {
  entries: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
}
interface RuleStatsData {
  rule: IReferrerRule;
  clicksLog: ClicksLog;
}

const fetchRuleStats = async (
  ruleId: string,
  logPage: number
): Promise<RuleStatsData | null> => {
  if (!ruleId) return null;
  const { data } = await axios.get(
    `/api/admin/referrer-rules/${ruleId}/stats?logPage=${logPage}`
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

export default function ReferrerRuleStatsPage() {
  const router = useRouter();
  const params = useParams();
  const ruleId = params.id as string;

  const [logCurrentPage, setLogCurrentPage] = useState(1);

  const {
    data: statsData,
    isLoading,
    isError,
  } = useQuery<RuleStatsData | null>({
    queryKey: ["ruleStats", ruleId, logCurrentPage],
    queryFn: () => fetchRuleStats(ruleId, logCurrentPage),
    enabled: !!ruleId,
    keepPreviousData: true,
  });

  const rule = statsData?.rule;
  const clicksLog = statsData?.clicksLog;

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-semibold text-brand-muted hover:text-white mb-6"
      >
        <ArrowLeft size={16} />
        Back to All Rules
      </button>

      {isLoading && !statsData ? (
        <div className="animate-pulse space-y-6">
          <div className="h-10 w-3/4 bg-gray-700 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-brand-dark/50 rounded-lg"></div>
            <div className="h-24 bg-brand-dark/50 rounded-lg"></div>
            <div className="h-24 bg-brand-dark/50 rounded-lg"></div>
          </div>
          <div className="h-96 bg-brand-secondary rounded-lg"></div>
        </div>
      ) : isError || !rule ? (
        <div className="text-center py-20 text-red-400">
          <Info size={40} className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white">
            Could Not Load Rule Data
          </h2>
          <p>The rule may have been deleted or an error occurred.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <BarChart2 size={28} />
              Stats for:{" "}
              <span className="text-brand-purple">{rule.description}</span>
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Hits"
              value={rule.hitCount}
              icon={BarChart2}
            />
            <StatCard
              label="Source URL / Domain"
              value={rule.sourceUrl.substring(0, 30) + "..."}
              icon={Globe}
            />
            <StatCard
              label="Date Created"
              value={format(new Date(rule.createdAt), "dd MMM yyyy")}
              icon={Calendar}
            />
            <div className="bg-brand-dark/50 p-4 rounded-lg flex items-center gap-4">
              <div
                className={`p-3 rounded-md ${
                  rule.isActive
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {rule.isActive ? (
                  <CheckCircle size={24} />
                ) : (
                  <XCircle size={24} />
                )}
              </div>
              <div>
                <p className="text-sm text-brand-muted">Status</p>
                <p className="text-2xl font-bold text-white">
                  {rule.isActive ? "Active" : "Inactive"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-brand-secondary rounded-lg">
            <h3 className="p-4 font-bold text-white border-b border-gray-700/50">
              Recent Hits Log ({clicksLog?.pagination.totalCount})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-brand-muted uppercase">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Landing Page</th>
                    <th className="p-3">User Agent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50 text-brand-light">
                  {clicksLog?.entries.map((click, index) => (
                    <tr key={index}>
                      <td className="p-3 whitespace-nowrap">
                        {format(
                          new Date(click.timestamp),
                          "dd MMM yyyy, HH:mm:ss"
                        )}
                      </td>
                      <td
                        className="p-3 text-blue-400 max-w-[200px] truncate"
                        title={click.landingPage}
                      >
                        {click.landingPage}
                      </td>
                      <td
                        className="p-3 text-brand-light max-w-[300px] truncate"
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
                  No hits have been recorded for this rule yet.
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
