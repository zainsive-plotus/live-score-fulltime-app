// ===== src/app/admin/(protected)/referrer-tracker/page.tsx =====

"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { IReferrerRule } from "@/models/ReferrerRule";
import {
  Send,
  PlusCircle,
  Edit,
  Trash2,
  ExternalLink,
  BarChart2,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import AdminPagination from "@/components/admin/AdminPagination";
import ReferrerRuleFormModal from "@/components/admin/ReferrerRuleFormModal";
import { useRouter } from "next/navigation";

interface PaginatedRulesResponse {
  rules: IReferrerRule[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
}

const fetchReferrerRules = async (
  page: number
): Promise<PaginatedRulesResponse> => {
  const { data } = await axios.get(`/api/admin/referrer-rules?page=${page}`);
  return data;
};

export default function AdminReferrerTrackerPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<IReferrerRule | null>(null);

  const {
    data: rulesData,
    isLoading,
    isError,
  } = useQuery<PaginatedRulesResponse>({
    queryKey: ["referrerRules", currentPage],
    queryFn: () => fetchReferrerRules(currentPage),
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: (ruleId: string) =>
      axios.delete(`/api/admin/referrer-rules/${ruleId}`),
    onSuccess: () => {
      toast.success("Referrer rule deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["referrerRules"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete rule.");
    },
  });

  const handleOpenCreateModal = () => {
    setEditingRule(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (rule: IReferrerRule) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  const handleDelete = (rule: IReferrerRule) => {
    if (
      window.confirm(
        `Are you sure you want to delete the rule for "${rule.description}"? This action cannot be undone.`
      )
    ) {
      deleteMutation.mutate(rule._id);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Send size={28} /> Referrer Tracker
        </h1>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90"
        >
          <PlusCircle size={20} />
          <span>New Rule</span>
        </button>
      </div>

      <div className="bg-brand-secondary rounded-lg overflow-x-auto">
        <table className="w-full text-left text-brand-light">
          <thead className="bg-gray-800/50 text-sm text-brand-muted uppercase">
            <tr>
              <th className="p-4">Description</th>
              <th className="p-4">Source URL / Domain</th>
              <th className="p-4 text-center">Hits</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-brand-muted">
                  Loading rules...
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-red-400">
                  Failed to load rules.
                </td>
              </tr>
            ) : (
              rulesData?.rules.map((rule) => (
                <tr key={rule._id} className="border-t border-gray-700/50">
                  <td className="p-4 font-medium">{rule.description}</td>
                  <td className="p-4 text-sm max-w-xs truncate">
                    <a
                      href={rule.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline flex items-center gap-1.5"
                      title={rule.sourceUrl}
                    >
                      <span className="truncate">{rule.sourceUrl}</span>
                      <ExternalLink size={14} />
                    </a>
                  </td>
                  <td className="p-4 text-center text-lg font-bold">
                    {rule.hitCount}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`p-2 rounded-full ${
                        rule.isActive ? "text-green-400" : "text-red-400"
                      }`}
                      title={rule.isActive ? "Active" : "Inactive"}
                    >
                      {rule.isActive ? (
                        <CheckCircle size={20} />
                      ) : (
                        <XCircle size={20} />
                      )}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() =>
                          router.push(
                            `/admin/referrer-tracker/${rule._id}/stats`
                          )
                        }
                        className="text-brand-muted hover:text-white"
                        title="View Stats"
                      >
                        <BarChart2 size={18} />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(rule)}
                        className="text-brand-muted hover:text-white"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(rule)}
                        className="text-brand-muted hover:text-red-400"
                        title="Delete"
                        disabled={
                          deleteMutation.isPending &&
                          deleteMutation.variables === rule._id
                        }
                      >
                        {deleteMutation.isPending &&
                        deleteMutation.variables === rule._id ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {rulesData?.rules.length === 0 && !isLoading && (
          <p className="text-center p-8 text-brand-muted">
            No referrer rules created yet. Click "New Rule" to get started.
          </p>
        )}
      </div>

      {rulesData && rulesData.pagination.totalPages > 1 && (
        <div className="mt-6">
          <AdminPagination
            currentPage={currentPage}
            totalPages={rulesData.pagination.totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <ReferrerRuleFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        rule={editingRule}
      />
    </div>
  );
}
