// ===== src/app/admin/(protected)/news/page.tsx =====

"use client";

import { useState, useMemo } from "react"; // ADDED useState
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Link from "@/components/StyledLink";
import { PlusCircle } from "lucide-react";
import { IPost } from "@/models/Post";
import toast from "react-hot-toast";
import { ILanguage } from "@/models/Language";
import TranslationGroupRow from "@/components/admin/TranslationGroupRow";
import AdminPagination from "@/components/admin/AdminPagination"; // ADDED

interface PaginatedNewsResponse {
  groups: IPost[][];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
}

const fetchAdminPosts = async (
  page: number
): Promise<PaginatedNewsResponse> => {
  const { data } = await axios.get(`/api/admin/posts?page=${page}`);
  return data;
};

const fetchLanguages = async (): Promise<ILanguage[]> => {
  const { data } = await axios.get("/api/admin/languages");
  return data;
};

export default function AdminNewsPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1); // ADDED state for pagination

  // MODIFIED: This query now fetches paginated groups
  const {
    data: postsData,
    isLoading: isLoadingPosts,
    error: postsError,
  } = useQuery<PaginatedNewsResponse>({
    queryKey: ["adminPosts", currentPage],
    queryFn: () => fetchAdminPosts(currentPage),
    keepPreviousData: true, // For a smooth pagination experience
  });

  const { data: languages, isLoading: isLoadingLanguages } = useQuery<
    ILanguage[]
  >({
    queryKey: ["allLanguages"],
    queryFn: fetchLanguages,
  });

  const languageMap = useMemo(() => {
    if (!languages) return new Map<string, ILanguage>();
    return new Map(languages.map((lang) => [lang.code, lang]));
  }, [languages]);

  // MODIFIED: Use the `groups` array from the API response
  const groupedPosts = postsData?.groups || [];

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => axios.delete(`/api/posts/${postId}`),
    onSuccess: (_, postId) => {
      toast.success("Post deleted successfully!");
      // Invalidate the query to refetch the current page of data
      queryClient.invalidateQueries({ queryKey: ["adminPosts", currentPage] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Error deleting post.";
      toast.error(message);
    },
  });

  const handleDeletePost = (postId: string, title: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete the post "${title}"? This cannot be undone.`
      )
    ) {
      deleteMutation.mutate(postId);
    }
  };

  const isLoading = isLoadingPosts || isLoadingLanguages;

  if (isLoading && !postsData)
    return <p className="text-brand-muted">Loading posts...</p>;
  if (postsError) return <p className="text-red-400">Failed to load posts.</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Manage News</h1>
        <Link
          href="/admin/news/create"
          className="flex items-center gap-2 bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
        >
          <PlusCircle size={20} />
          <span>New Post</span>
        </Link>
      </div>

      <div className="bg-brand-secondary rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-800/50 text-sm text-brand-muted uppercase">
            <tr>
              <th className="p-4 w-[140px]">Preview</th>
              <th className="p-4">Title & Language</th>
              <th className="p-4">Status</th>
              <th className="p-4">Created At</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {groupedPosts.map((group) => (
              <TranslationGroupRow
                key={
                  group[0].translationGroupId?.toString() ||
                  group[0]._id.toString()
                }
                group={group}
                languageMap={languageMap}
                onDelete={handleDeletePost}
              />
            ))}
          </tbody>
        </table>

        {groupedPosts.length === 0 && (
          <p className="text-center p-8 text-brand-muted">
            No news posts found.
          </p>
        )}
      </div>

      {/* ADDED: Pagination controls */}
      {postsData?.pagination && postsData.pagination.totalPages > 1 && (
        <div className="mt-6">
          <AdminPagination
            currentPage={currentPage}
            totalPages={postsData.pagination.totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
