// src/app/admin/pages/author/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { Loader2, Save, UserCircle } from "lucide-react"; // Using a user-centric icon
import RichTextEditor from "@/components/admin/RichTextEditor";

// The unique slug for this specific page
const PAGE_SLUG = "author";

interface PageContentData {
  title: string;
  content: string;
}

const fetchPageContent = async (slug: string): Promise<PageContentData> => {
  const { data } = await axios.get(`/api/admin/pages/${slug}`);
  return data;
};

export default function EditAuthorPage() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const { data, isLoading, error } = useQuery<PageContentData>({
    queryKey: ["pageContent", PAGE_SLUG],
    queryFn: () => fetchPageContent(PAGE_SLUG),
  });

  useEffect(() => {
    if (data) {
      setTitle(data.title || "About the Author"); // Default title
      setContent(data.content || "");
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (pageData: PageContentData) =>
      axios.post(`/api/admin/pages/${PAGE_SLUG}`, pageData),
    onSuccess: () => {
      toast.success("Author page content saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["pageContent", PAGE_SLUG] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to save content.");
    },
  });

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and Content cannot be empty.");
      return;
    }
    mutation.mutate({ title, content });
  };

  if (isLoading)
    return <p className="text-brand-muted">Loading page content...</p>;
  if (error) return <p className="text-red-400">Failed to load content.</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <UserCircle size={28} /> Edit 'Author' Page
        </h1>
        <button
          onClick={handleSave}
          disabled={mutation.isPending}
          className="flex items-center gap-2 bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {mutation.isPending ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Save size={20} />
          )}
          <span>{mutation.isPending ? "Saving..." : "Save Changes"}</span>
        </button>
      </div>

      <div className="bg-brand-secondary p-6 rounded-lg space-y-6">
        <div>
          <label
            htmlFor="pageTitle"
            className="block text-sm font-medium text-brand-light mb-2"
          >
            Page Title
          </label>
          <input
            id="pageTitle"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-light mb-2">
            Page Content
          </label>
          {data && <RichTextEditor value={content} onChange={setContent} />}
        </div>
      </div>
    </div>
  );
}
