// ===== src/app/admin/news/page.tsx (Corrected) =====

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Link from "@/components/StyledLink";
import { PlusCircle } from "lucide-react";
import { IPost } from "@/models/Post";
import toast from "react-hot-toast";
import { useMemo } from "react";
import { ILanguage } from "@/models/Language";
import TranslationGroupRow from "@/components/admin/TranslationGroupRow";

const fetchAdminPosts = async (): Promise<IPost[]> => {
  const { data } = await axios.get("/api/admin/posts");
  return data;
};

const fetchLanguages = async (): Promise<ILanguage[]> => {
  const { data } = await axios.get("/api/admin/languages");
  return data;
};

export default function AdminNewsPage() {
  const queryClient = useQueryClient();

  const {
    data: posts,
    isLoading: isLoadingPosts,
    error: postsError,
  } = useQuery<IPost[]>({
    queryKey: ["adminPosts"],
    queryFn: fetchAdminPosts,
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
      const dateA = new Date(
        a.sort(
          (x, y) =>
            new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime()
        )[0].createdAt
      ).getTime();
      const dateB = new Date(
        b.sort(
          (x, y) =>
            new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime()
        )[0].createdAt
      ).getTime();
      return dateB - dateA;
    });
  }, [posts]);

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => axios.delete(`/api/posts/${postId}`),
    onSuccess: (_, postId) => {
      // Optimistically update the UI before refetching
      queryClient.setQueryData(["adminPosts"], (oldData: IPost[] | undefined) =>
        oldData ? oldData.filter((post) => post._id !== postId) : []
      );
      toast.success("Post deleted successfully!");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Error deleting post.";
      toast.error(message);
    },
    onSettled: () => {
      // Refetch to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["adminPosts"] });
    },
  });

  // This handler is now passed to the child component
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

  if (isLoading) return <p className="text-brand-muted">Loading posts...</p>;
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
                onDelete={handleDeletePost} // Pass the handler here
              />
            ))}
          </tbody>
        </table>

        {posts?.length === 0 && (
          <p className="text-center p-8 text-brand-muted">
            No news posts found.
          </p>
        )}
      </div>
    </div>
  );
}
