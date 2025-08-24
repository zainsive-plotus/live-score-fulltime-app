// ===== src/app/admin/curated-news/page.tsx =====

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { IPost } from "@/models/Post";
import toast from "react-hot-toast";
import { useMemo } from "react";
import { ILanguage } from "@/models/Language";
import TranslationGroupRow from "@/components/admin/TranslationGroupRow";
import { Bot } from "lucide-react";

// --- Start of Change ---
// Fetches only the posts that were curated by the AI with the 'recent' newsType.
const fetchCuratedPosts = async (): Promise<IPost[]> => {
  const { data } = await axios.get("/api/admin/posts?newsType=recent");
  return data;
};
// --- End of Change ---

const fetchLanguages = async (): Promise<ILanguage[]> => {
  const { data } = await axios.get("/api/admin/languages");
  return data;
};

export default function AdminCuratedNewsPage() {
  const queryClient = useQueryClient();

  const {
    data: posts,
    isLoading: isLoadingPosts,
    error: postsError,
  } = useQuery<IPost[]>({
    queryKey: ["adminCuratedPosts"],
    queryFn: fetchCuratedPosts,
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

  const groupedPosts = useMemo(() => {
    if (!posts) return [];
    const groups: Record<string, IPost[]> = {};
    posts.forEach((post) => {
      const groupId = (post.translationGroupId || post._id).toString();
      if (!groups[groupId]) {
        groups[groupId] = [];
      }
      groups[groupId].push(post);
    });

    return Object.values(groups).sort((a, b) => {
      const dateA = new Date(a[0].createdAt).getTime();
      const dateB = new Date(b[0].createdAt).getTime();
      return dateB - dateA;
    });
  }, [posts]);

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => axios.delete(`/api/posts/${postId}`),
    onSuccess: (_, postId) => {
      queryClient.setQueryData(["adminCuratedPosts"], (oldData: IPost[] | undefined) =>
        oldData ? oldData.filter((post) => post._id !== postId) : []
      );
      toast.success("Post deleted successfully!");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Error deleting post.";
      toast.error(message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCuratedPosts"] });
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

  if (isLoading) return <p className="text-brand-muted">Loading curated news...</p>;
  if (postsError) return <p className="text-red-400">Failed to load curated news.</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Bot size={28} /> AI Curated News
        </h1>
      </div>

      <div className="bg-brand-secondary rounded-lg overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-800/50 text-sm text-brand-muted uppercase">
            <tr>
              <th className="p-4 w-[140px]">Image</th>
              <th className="p-4">Title & Translations</th>
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

        {posts?.length === 0 && (
          <p className="text-center p-8 text-brand-muted">
            No AI-curated news articles found.
          </p>
        )}
      </div>
    </div>
  );
}