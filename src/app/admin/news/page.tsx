"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Link from "@/components/StyledLink";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { IPost } from "@/models/Post";
import toast from "react-hot-toast";
import Image from "next/image";
import { useMemo } from "react";
import { ILanguage } from "@/models/Language";

const fetchPosts = async (): Promise<IPost[]> => {
  const { data } = await axios.get("/api/posts");
  return data;
};

const fetchLanguages = async (): Promise<ILanguage[]> => {
  const { data } = await axios.get("/api/admin/languages");
  return data;
};

// A sub-component for rendering a single post row within a translation group
const TranslationRow = ({
  post,
  language,
  isMaster,
}: {
  post: IPost;
  language?: ILanguage;
  isMaster: boolean;
}) => {
  return (
    <tr
      className={`border-gray-700/50 ${
        isMaster ? "border-t-2 border-gray-600" : "border-t"
      }`}
    >
      <td className={`p-4 ${!isMaster ? "pl-8" : ""}`}>
        {/* Only show the image for the master row in a group */}
        {isMaster &&
          (post.featuredImage ? (
            <Image
              src={post.featuredImage}
              alt={post.title}
              width={100}
              height={56}
              objectFit="cover"
              className="rounded-md bg-gray-700"
            />
          ) : (
            <div className="w-[100px] h-[56px] bg-gray-700 rounded-md flex items-center justify-center text-xs text-brand-muted">
              No Image
            </div>
          ))}
      </td>
      <td className={`p-4 ${!isMaster ? "pl-12" : ""}`}>
        <div className="flex items-center gap-3">
          {language?.flagUrl && (
            <Image
              src={language.flagUrl}
              alt={language.name}
              width={24}
              height={18}
              className="rounded-sm flex-shrink-0"
            />
          )}
          <span
            className={`font-medium ${
              isMaster ? "text-white" : "text-brand-light"
            }`}
          >
            {post.title}
          </span>
        </div>
      </td>
      <td className="p-4">
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            post.status === "published"
              ? "bg-green-500/20 text-green-400"
              : "bg-yellow-500/20 text-yellow-400"
          }`}
        >
          {post.status}
        </span>
      </td>
      <td className="p-4 text-brand-muted">
        {format(new Date(post.createdAt), "dd MMM yyyy")}
      </td>
      <td className="p-4 flex gap-3">
        <Link
          href={`/admin/news/edit/${post._id}`}
          className="text-blue-400 hover:text-blue-300"
          title="Edit"
        >
          <Edit size={18} />
        </Link>
        <button
          onClick={() => {
            if (
              window.confirm(
                "Are you sure you want to delete this specific translation?"
              )
            ) {
              (window as any).deletePost(post._id);
            }
          }}
          className="text-red-400 hover:text-red-300"
          title="Delete"
        >
          <Trash2 size={18} />
        </button>
      </td>
    </tr>
  );
};

export default function AdminNewsPage() {
  const queryClient = useQueryClient();

  const {
    data: posts,
    isLoading: isLoadingPosts,
    error: postsError,
  } = useQuery<IPost[]>({
    queryKey: ["adminPosts"],
    queryFn: fetchPosts,
  });

  const { data: languages, isLoading: isLoadingLanguages } = useQuery<
    ILanguage[]
  >({
    queryKey: ["allLanguages"],
    queryFn: fetchLanguages,
  });

  const languageMap = useMemo(() => {
    if (!languages) return new Map();
    return new Map(languages.map((lang) => [lang.code, lang]));
  }, [languages]);

  const groupedPosts = useMemo(() => {
    if (!posts) return [];
    const groups: Record<string, IPost[]> = {};
    posts.forEach((post) => {
      // Fallback to post._id for older posts without a translationGroupId
      const groupId = (post.translationGroupId || post._id).toString();
      if (!groups[groupId]) {
        groups[groupId] = [];
      }
      groups[groupId].push(post);
    });

    // Sort groups by the most recent post within each group
    return Object.values(groups).sort((a, b) => {
      const lastDateA = new Date(a[0].createdAt).getTime();
      const lastDateB = new Date(b[0].createdAt).getTime();
      return lastDateB - lastDateA;
    });
  }, [posts]);

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => axios.delete(`/api/posts/${postId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPosts"] });
      toast.success("Post deleted successfully!");
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Error deleting post.";
      toast.error(message);
    },
  });

  // Expose delete function to window for the child component to call
  if (typeof window !== "undefined") {
    (window as any).deletePost = (postId: string) =>
      deleteMutation.mutate(postId);
  }

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
              <th className="p-4">Preview</th>
              <th className="p-4">Title & Language</th>
              <th className="p-4">Status</th>
              <th className="p-4">Created At</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {groupedPosts.map((group) =>
              group.map((post, postIndex) => (
                <TranslationRow
                  key={post._id}
                  post={post}
                  language={languageMap.get(post.language)}
                  isMaster={postIndex === 0}
                />
              ))
            )}
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
