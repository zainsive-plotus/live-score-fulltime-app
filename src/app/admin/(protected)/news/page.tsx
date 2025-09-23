// ===== src/app/admin/(protected)/news/page.tsx =====
"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Link from "@/components/StyledLink";
import { PlusCircle, Search, SearchX } from "lucide-react"; // Import Search icons
import { IPost } from "@/models/Post";
import toast from "react-hot-toast";
import { ILanguage } from "@/models/Language";
import TranslationGroupRow from "@/components/admin/TranslationGroupRow";
import AdminPagination from "@/components/admin/AdminPagination";
import { useDebounce } from "@/hooks/useDebounce"; // Import the debounce hook

interface PaginatedNewsResponse {
  groups: IPost[][];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  };
}

// --- MODIFICATION: Add searchQuery parameter ---
const fetchAdminPosts = async (
  page: number,
  searchQuery: string
): Promise<PaginatedNewsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    search: searchQuery,
  });
  const { data } = await axios.get(`/api/admin/posts?${params.toString()}`);
  return data;
};

const fetchLanguages = async (): Promise<ILanguage[]> => {
  const { data } = await axios.get("/api/admin/languages");
  return data;
};

export default function AdminNewsPage() {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState(""); // State for the search input
  const debouncedSearchTerm = useDebounce(searchTerm, 500); // Debounce user input

  const {
    data: postsData,
    isLoading: isLoadingPosts,
    error: postsError,
  } = useQuery<PaginatedNewsResponse>({
    // --- MODIFICATION: Add debounced search term to queryKey ---
    queryKey: ["adminPosts", currentPage, debouncedSearchTerm],
    queryFn: () => fetchAdminPosts(currentPage, debouncedSearchTerm),
    keepPreviousData: true,
  });

  // --- NEW: Reset to page 1 when search term changes ---
  useEffect(() => {
    if (debouncedSearchTerm) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm]);

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

  const groupedPosts = postsData?.groups || [];

  const deleteMutation = useMutation({
    mutationFn: (postId: string) => axios.delete(`/api/posts/${postId}`),
    onSuccess: (_, postId) => {
      toast.success("Post deleted successfully!");
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
          className="flex items-center gap-2 bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90"
        >
          <PlusCircle size={20} />
          <span>New Post</span>
        </Link>
      </div>

      {/* --- NEW: Search Bar UI --- */}
      <div className="bg-brand-secondary p-4 rounded-lg mb-6">
        <div className="relative">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-muted"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by Post Title, Team, or League Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-brand-dark border border-gray-600 rounded-lg p-3 pl-12 text-white placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-purple"
          />
        </div>
      </div>

      <div className="space-y-4">
        {isLoading && !postsData ? (
          <p className="text-center p-8 text-brand-muted bg-brand-secondary rounded-lg">
            Loading posts...
          </p>
        ) : groupedPosts.length > 0 ? (
          groupedPosts.map((group) => (
            <TranslationGroupRow
              key={
                group[0].translationGroupId?.toString() ||
                group[0]._id.toString()
              }
              group={group}
              languageMap={languageMap}
              onDelete={handleDeletePost}
            />
          ))
        ) : (
          <div className="text-center p-8 text-brand-muted bg-brand-secondary rounded-lg">
            <SearchX size={32} className="mx-auto mb-3" />
            <p className="font-semibold text-white">No Posts Found</p>
            {debouncedSearchTerm && (
              <p>
                Your search for "{debouncedSearchTerm}" did not match any posts.
              </p>
            )}
          </div>
        )}
      </div>

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
