// src/app/admin/news/edit/[postId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "@/components/StyledLink";
import Image from "next/image";
import { UploadCloud, XCircle, Loader2, CheckCircle } from "lucide-react";

import RichTextEditor from "@/components/admin/RichTextEditor";
import { IPost, PostCategory } from "@/models/Post";

// Define available categories for the UI, consistent with the create page
const availableCategories: { id: PostCategory; label: string }[] = [
  { id: "football", label: "Football News" },
  { id: "basketball", label: "Basketball News" },
  { id: "tennis", label: "Tennis News" },
  { id: "general", label: "General Sports News" },
  { id: "prediction", label: "Prediction" },
  { id: "match_reports", label: "Match Reports" },
];

// Fetcher function for a single post
const fetchPost = async (postId: string): Promise<IPost> => {
  const { data } = await axios.get(`/api/posts/${postId}`);
  return data;
};

export default function EditNewsPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.postId as string;

  // --- STATE MANAGEMENT ---
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageTitle, setImageTitle] = useState("");
  const [imageAltText, setImageAltText] = useState("");
  // --- MODIFIED: State for multiple categories ---
  const [selectedCategories, setSelectedCategories] = useState<PostCategory[]>(
    []
  );

  // Fetch the existing post data
  const {
    data: postData,
    isLoading,
    isError,
  } = useQuery<IPost>({
    queryKey: ["post", postId],
    queryFn: () => fetchPost(postId),
    enabled: !!postId,
  });

  // Pre-fill the form once data is fetched
  useEffect(() => {
    if (postData) {
      setTitle(postData.title);
      setContent(postData.content);
      setStatus(postData.status);
      setMetaTitle(postData.metaTitle || "");
      setMetaDescription(postData.metaDescription || "");
      setFeaturedImage(postData.featuredImage || null);
      setImageTitle(postData.featuredImageTitle || "");
      setImageAltText(postData.featuredImageAltText || "");
      // --- MODIFIED: Ensure `sport` is always an array ---
      setSelectedCategories(
        Array.isArray(postData.sport) && postData.sport.length > 0
          ? postData.sport
          : ["general"]
      );
    }
  }, [postData]);

  // --- MODIFIED: Handler for checkbox changes ---
  const handleCategoryChange = (category: PostCategory) => {
    setSelectedCategories((prev) => {
      const isSelected = prev.includes(category);
      if (isSelected) {
        const newCategories = prev.filter((c) => c !== category);
        return newCategories.length > 0 ? newCategories : prev;
      } else {
        return [...prev, category];
      }
    });
  };

  // --- IMAGE UPLOAD HANDLER ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("uploadType", "newsFeaturedImage");

    try {
      const { data } = await axios.post("/api/upload", formData);
      setFeaturedImage(data.url);
      toast.success("Image uploaded!");
    } catch (error) {
      toast.error("Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  // Mutation to update the post
  const updatePostMutation = useMutation({
    mutationFn: (updatedPost: Partial<IPost>) => {
      return axios.put(`/api/posts/${postId}`, updatedPost);
    },
    onSuccess: () => {
      toast.success("Post updated successfully!");
      router.push("/admin/news");
      router.refresh();
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.error || "Failed to update post.";
      toast.error(errorMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content cannot be empty.");
      return;
    }
    updatePostMutation.mutate({
      title,
      content,
      status,
      featuredImage,
      metaTitle,
      metaDescription,
      featuredImageTitle: imageTitle,
      featuredImageAltText: imageAltText,
      sport: selectedCategories, // Pass the array of selected categories
    });
  };

  if (isLoading)
    return <p className="text-brand-muted">Loading post data...</p>;
  if (isError) return <p className="text-red-400">Failed to load post data.</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Edit Post</h1>
        <Link
          href="/admin/news"
          className="text-sm text-brand-muted hover:text-white"
        >
          ← Back to News List
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-brand-secondary p-6 rounded-lg space-y-6"
      >
        {/* --- FEATURED IMAGE SECTION (UNCHANGED) --- */}
        <div className="p-4 border border-gray-600 rounded-lg">
          <label className="block text-sm font-medium text-brand-light mb-2">
            Featured Image
          </label>
          <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-600 px-6 py-10">
            {featuredImage ? (
              <div className="relative group w-full h-64">
                <Image
                  src={featuredImage}
                  alt={imageAltText || "Featured preview"}
                  layout="fill"
                  objectFit="contain"
                />
                <button
                  type="button"
                  onClick={() => setFeaturedImage(null)}
                  className="absolute top-2 right-2 bg-red-600 rounded-full p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XCircle size={20} />
                </button>
              </div>
            ) : (
              <div className="text-center">
                <UploadCloud className="mx-auto h-12 w-12 text-gray-500" />
                <div className="mt-4 flex text-sm leading-6 text-gray-400">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md font-semibold text-brand-purple focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-purple focus-within:ring-offset-2 focus-within:ring-offset-brand-dark hover:text-brand-purple/80"
                  >
                    <span>
                      {isUploading ? "Uploading..." : "Upload a file"}
                    </span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      className="sr-only"
                      onChange={handleImageUpload}
                      disabled={isUploading}
                      accept="image/*"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-gray-500">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            )}
          </div>
        </div>

        {featuredImage && (
          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="imageTitle"
                className="block text-sm font-medium text-brand-light mb-2"
              >
                Image Title (Tooltip)
              </label>
              <input
                id="imageTitle"
                type="text"
                value={imageTitle}
                onChange={(e) => setImageTitle(e.target.value)}
                placeholder="e.g., Team celebrating a goal"
                className="w-full p-3 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
            <div>
              <label
                htmlFor="imageAltText"
                className="block text-sm font-medium text-brand-light mb-2"
              >
                Image Alt Text (Accessibility & SEO)
              </label>
              <input
                id="imageAltText"
                type="text"
                value={imageAltText}
                onChange={(e) => setImageAltText(e.target.value)}
                placeholder="e.g., Player in red jersey kicking a football"
                className="w-full p-3 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
              <p className="text-xs text-brand-muted mt-1">
                Describe the image for screen readers and search engines.
              </p>
            </div>
          </div>
        )}

        {/* Title Field (UNCHANGED) */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-brand-light mb-2"
          >
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
            required
          />
        </div>

        {/* Content Field (UNCHANGED) */}
        <div>
          <label className="block text-sm font-medium text-brand-light mb-2">
            Content
          </label>
          {content && <RichTextEditor value={content} onChange={setContent} />}
        </div>

        {/* SEO & META FIELDS SECTION (UNCHANGED) */}
        <div className="space-y-4 p-4 border border-gray-600 rounded-lg">
          <h3 className="text-lg font-semibold text-white">SEO Settings</h3>
          <div>
            <label
              htmlFor="metaTitle"
              className="block text-sm font-medium text-brand-light mb-2"
            >
              Meta Title
            </label>
            <input
              id="metaTitle"
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="e.g., Ultimate Guide to Sunday's Match"
              className="w-full p-3 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
          <div>
            <label
              htmlFor="metaDescription"
              className="block text-sm font-medium text-brand-light mb-2"
            >
              Meta Description
            </label>
            <textarea
              id="metaDescription"
              rows={3}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="A brief summary for search engines..."
              className="w-full p-3 rounded bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
            />
          </div>
        </div>

        {/* Status Field (UNCHANGED) */}
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-brand-light mb-2"
          >
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as "draft" | "published")}
            className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        {/* --- MODIFIED: Content Category - Now Checkboxes --- */}
        <div className="p-4 border border-gray-600 rounded-lg">
          <label className="block text-sm font-medium text-brand-light mb-3">
            Content Categories
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {availableCategories.map((category) => (
              <div key={category.id} className="flex items-center">
                <input
                  id={`category-${category.id}`}
                  type="checkbox"
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => handleCategoryChange(category.id)}
                  className="w-4 h-4 text-brand-purple bg-gray-700 border-gray-600 rounded focus:ring-brand-purple focus:ring-offset-brand-secondary"
                />
                <label
                  htmlFor={`category-${category.id}`}
                  className="ml-3 text-sm font-medium text-brand-light"
                >
                  {category.label}
                </label>
              </div>
            ))}
          </div>
          <p className="text-xs text-brand-muted mt-3">
            Select one or more relevant categories for this post.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Link
            href="/admin/news"
            className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={updatePostMutation.isPending || isUploading}
            className="bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {updatePostMutation.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <CheckCircle size={18} />
            )}
            {updatePostMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
