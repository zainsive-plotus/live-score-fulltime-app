"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Link from "@/components/StyledLink";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { IPost } from "@/models/Post";
import toast from "react-hot-toast";
import Image from "next/image"; // <-- NEW IMPORT

// Fetcher function
const fetchPosts = async (): Promise<IPost[]> => {
  const { data } = await axios.get("/api/posts");
  return data;
};

export default function AdminNewsPage() {
  const queryClient = useQueryClient();

  const {
    data: posts,
    isLoading,
    error,
  } = useQuery<IPost[]>({
    queryKey: ["adminPosts"],
    queryFn: fetchPosts,
  });

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => axios.delete(`/api/posts/${postId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPosts"] });
      // BEFORE: alert('Post deleted!');
      toast.success("Post deleted successfully!"); //
    },
    onError: (error: any) => {
      // BEFORE: alert('Error deleting post.');
      const message = error.response?.data?.message || "Error deleting post.";
      toast.error(message); //
    },
  });

  const handleDelete = (postId: string) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      deleteMutation.mutate(postId);
    }
  };

  if (isLoading) return <p className="text-brand-muted">Loading posts...</p>;
  if (error) return <p className="text-red-400">Failed to load posts.</p>;

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
        <table className="w-full text-left text-brand-light">
          <thead className="bg-gray-800/50 text-sm text-brand-muted uppercase">
            <tr>
              <th className="p-4">Preview</th> {/* <-- NEW COLUMN HEADER */}
              <th className="p-4">Title</th>
              <th className="p-4">Status</th>
              <th className="p-4">Type</th>
              <th className="p-4">Created At</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {posts?.map((post) => (
              <tr
                key={post._id as string}
                className="border-t border-gray-700/50"
              >
                {/* --- NEW COLUMN CONTENT --- */}
                <td className="p-4">
                  {post.featuredImage ? (
                    <Image
                      src={post.featuredImage}
                      alt={post.title}
                      width={100} // Adjust width as needed for preview
                      height={56} // Maintain aspect ratio for common image sizes (16:9)
                      objectFit="cover" // Cover the area, cropping if necessary
                      className="rounded-md bg-gray-700"
                    />
                  ) : (
                    <div className="w-[100px] h-[56px] bg-gray-700 rounded-md flex items-center justify-center text-xs text-brand-muted">
                      No Image
                    </div>
                  )}
                </td>
                <td className="p-4 font-medium">{post.title}</td>
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
                <td className="p-4">
                  {post.isAIGenerated && (
                    <span className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400">
                      <Lightbulb size={12} /> AI
                    </span>
                  )}
                  {!post.isAIGenerated && (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-600/20 text-gray-400">
                      Manual
                    </span>
                  )}
                </td>
                <td className="p-4 text-brand-muted">
                  {format(new Date(post.createdAt), "dd MMM yyyy")}
                </td>
                <td className="p-4 flex gap-3">
                  <Link
                    href={`/admin/news/edit/${post._id}`}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <Edit size={18} />
                  </Link>
                  <button
                    onClick={() => handleDelete(post._id as string)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Optional: Message if no posts found */}
        {posts?.length === 0 && (
          <p className="text-center p-8 text-brand-muted">
            No news posts found. Create one manually or process an external
            article using the Automated News Engine.
          </p>
        )}
      </div>
    </div>
  );
}
