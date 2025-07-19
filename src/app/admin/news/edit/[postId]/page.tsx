"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "@/components/StyledLink";
import Image from "next/image";
import {
  UploadCloud,
  XCircle,
  Loader2,
  CheckCircle,
  Link2,
  Type,
  Tag,
  Languages,
  Save,
} from "lucide-react";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { IPost, SportsCategory, NewsType } from "@/models/Post";
import TranslationsWidget from "@/components/admin/TranslationsWidget";
import slugify from "slugify";

const availableSportsCategories: { id: SportsCategory; label: string }[] = [
  { id: "football", label: "Football" },
  { id: "basketball", label: "Basketball" },
  { id: "tennis", label: "Tennis" },
  { id: "general", label: "General" },
];

const availableNewsTypes: { id: NewsType; label: string }[] = [
  { id: "news", label: "General News" },
  { id: "highlights", label: "Highlights" },
  { id: "reviews", label: "Match Review" },
  { id: "prediction", label: "Prediction/Analysis" },
];

const fetchPost = async (postId: string): Promise<IPost> => {
  const { data } = await axios.get(`/api/posts/${postId}`);
  return data;
};

export default function EditNewsPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.postId as string;

  // States
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(true); // Default to true on edit page
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageTitle, setImageTitle] = useState("");
  const [imageAltText, setImageAltText] = useState("");
  const [selectedSportsCategories, setSelectedSportsCategories] = useState<
    SportsCategory[]
  >([]);
  const [newsType, setNewsType] = useState<NewsType>("news");
  const [linkedFixtureId, setLinkedFixtureId] = useState("");
  const [linkedLeagueId, setLinkedLeagueId] = useState("");
  const [linkedTeamId, setLinkedTeamId] = useState("");
  const [language, setLanguage] = useState("");
  const [translationGroupId, setTranslationGroupId] = useState("");

  const {
    data: postData,
    isLoading,
    isError,
  } = useQuery<IPost>({
    queryKey: ["post", postId],
    queryFn: () => fetchPost(postId),
    enabled: !!postId,
  });

  useEffect(() => {
    if (postData) {
      setTitle(postData.title);
      setSlug(postData.slug);
      setContent(postData.content);
      setStatus(postData.status);
      setMetaTitle(postData.metaTitle || "");
      setMetaDescription(postData.metaDescription || "");
      setFeaturedImage(postData.featuredImage || null);
      setImageTitle(postData.featuredImageTitle || "");
      setImageAltText(postData.featuredImageAltText || "");
      setSelectedSportsCategories(
        Array.isArray(postData.sportsCategory) &&
          postData.sportsCategory.length > 0
          ? postData.sportsCategory
          : ["general"]
      );
      setNewsType(postData.newsType || "news");
      setLinkedFixtureId(postData.linkedFixtureId?.toString() || "");
      setLinkedLeagueId(postData.linkedLeagueId?.toString() || "");
      setLinkedTeamId(postData.linkedTeamId?.toString() || "");
      setLanguage(postData.language);
      setTranslationGroupId(postData.translationGroupId.toString());
      setIsSlugManuallyEdited(true); // Always allow manual edits on the edit page
    }
  }, [postData]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!isSlugManuallyEdited) {
      setSlug(
        slugify(newTitle, {
          lower: true,
          strict: true,
          remove: /[*+~.()'"!:@]/g,
        })
      );
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSlugManuallyEdited(true);
    setSlug(e.target.value);
  };

  const handleSportsCategoryChange = (category: SportsCategory) => {
    setSelectedSportsCategories((prev) => {
      if (prev.includes(category)) {
        return prev.length > 1 ? prev.filter((c) => c !== category) : prev;
      }
      return [...prev, category];
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
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

  const updatePostMutation = useMutation({
    mutationFn: (updatedPost: Partial<IPost> & { slug?: string }) =>
      axios.put(`/api/posts/${postId}`, updatedPost),
    onSuccess: () => {
      toast.success("Post updated successfully!");
      router.push("/admin/news");
      router.refresh();
    },
    onError: (error: any) =>
      toast.error(error.response?.data?.error || "Failed to update post."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content cannot be empty.");
      return;
    }
    updatePostMutation.mutate({
      title,
      slug,
      content,
      status,
      featuredImage,
      metaTitle,
      metaDescription,
      featuredImageTitle: imageTitle,
      featuredImageAltText: imageAltText,
      sportsCategory: selectedSportsCategories,
      newsType,
      linkedFixtureId: linkedFixtureId ? Number(linkedFixtureId) : undefined,
      linkedLeagueId: linkedLeagueId ? Number(linkedLeagueId) : undefined,
      linkedTeamId: linkedTeamId ? Number(linkedTeamId) : undefined,
    });
  };

  if (isLoading)
    return <p className="text-brand-muted">Loading post data...</p>;
  if (isError) return <p className="text-red-400">Failed to load post data.</p>;

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Edit Post</h1>
        <div className="flex gap-4">
          <Link
            href="/admin/news"
            className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={updatePostMutation.isPending || isUploading}
            className="bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            {updatePostMutation.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {updatePostMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-brand-secondary p-6 rounded-lg space-y-6">
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
                onChange={handleTitleChange}
                required
                className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
            <div>
              <label
                htmlFor="slug"
                className="block text-sm font-medium text-brand-light mb-2"
              >
                URL Slug
              </label>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={handleSlugChange}
                required
                className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
              />
            </div>
          </div>
          <div className="bg-brand-secondary rounded-lg">
            <div className="p-6 border-b border-gray-700 sticky top-0 bg-brand-secondary z-10">
              <label className="text-lg font-semibold text-white">
                Content
              </label>
            </div>
            <div className="p-6">
              {postData && (
                <RichTextEditor value={content} onChange={setContent} />
              )}
            </div>
          </div>
        </div>

        {/* Sticky Settings Sidebar */}
        <aside className="lg:col-span-1 space-y-6 lg:sticky top-8">
          <div className="bg-brand-secondary p-4 rounded-lg space-y-4">
            <h3 className="text-lg font-semibold text-white">Publishing</h3>
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
                onChange={(e) =>
                  setStatus(e.target.value as "draft" | "published")
                }
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-light mb-2">
                Language
              </label>
              <input
                type="text"
                value={language.toUpperCase()}
                readOnly
                disabled
                className="w-full p-2 rounded bg-gray-700/50 text-brand-muted border border-gray-600 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="bg-brand-secondary p-4 rounded-lg space-y-4">
            <h3 className="text-lg font-semibold text-white">Categorization</h3>
            <div>
              <label className="block text-sm font-medium text-brand-light mb-2">
                Sports Categories
              </label>
              <div className="space-y-2">
                {availableSportsCategories.map((category) => (
                  <div key={category.id} className="flex items-center">
                    <input
                      id={`category-${category.id}`}
                      type="checkbox"
                      checked={selectedSportsCategories.includes(category.id)}
                      onChange={() => handleSportsCategoryChange(category.id)}
                      className="w-4 h-4 text-brand-purple bg-gray-700 border-gray-600 rounded"
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
            </div>
            <div>
              <label
                htmlFor="newsType"
                className="block text-sm font-medium text-brand-light mb-2"
              >
                News Type
              </label>
              <select
                id="newsType"
                value={newsType}
                onChange={(e) => setNewsType(e.target.value as NewsType)}
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              >
                {availableNewsTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-brand-secondary p-4 rounded-lg space-y-4">
            <h3 className="text-lg font-semibold text-white">Featured Image</h3>
            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-600 px-4 py-6">
              {featuredImage ? (
                <div className="relative group w-full h-32">
                  <Image
                    src={featuredImage}
                    alt="Featured preview"
                    layout="fill"
                    objectFit="contain"
                  />
                  <button
                    type="button"
                    onClick={() => setFeaturedImage(null)}
                    className="absolute top-1 right-1 bg-red-600 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <UploadCloud className="mx-auto h-10 w-10 text-gray-500" />
                  <div className="mt-2 flex text-sm text-gray-400">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-semibold text-brand-purple hover:text-brand-purple/80"
                    >
                      <span>{isUploading ? "Uploading..." : "Upload"}</span>
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
                    <p className="pl-1">or drag & drop</p>
                  </div>
                </div>
              )}
            </div>
            {featuredImage && (
              <div className="space-y-2">
                <div>
                  <label
                    htmlFor="imageTitle"
                    className="block text-xs font-medium text-brand-light mb-1"
                  >
                    Image Title
                  </label>
                  <input
                    id="imageTitle"
                    type="text"
                    value={imageTitle}
                    onChange={(e) => setImageTitle(e.target.value)}
                    className="w-full p-2 text-sm rounded bg-gray-700 text-white border border-gray-600"
                  />
                </div>
                <div>
                  <label
                    htmlFor="imageAltText"
                    className="block text-xs font-medium text-brand-light mb-1"
                  >
                    Image Alt Text
                  </label>
                  <input
                    id="imageAltText"
                    type="text"
                    value={imageAltText}
                    onChange={(e) => setImageAltText(e.target.value)}
                    className="w-full p-2 text-sm rounded bg-gray-700 text-white border border-gray-600"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-brand-secondary p-4 rounded-lg space-y-4">
            <h3 className="text-lg font-semibold text-white">SEO & Linking</h3>
            <div>
              <label
                htmlFor="metaTitle"
                className="block text-sm font-medium text-brand-light mb-1"
              >
                Meta Title
              </label>
              <input
                id="metaTitle"
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              />
            </div>
            <div>
              <label
                htmlFor="metaDescription"
                className="block text-sm font-medium text-brand-light mb-1"
              >
                Meta Description
              </label>
              <textarea
                id="metaDescription"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={3}
                className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
              ></textarea>
            </div>
            <div className="grid grid-cols-1 gap-2 pt-2 border-t border-gray-700/50">
              <div>
                <label
                  htmlFor="linkedFixtureId"
                  className="block text-xs font-medium text-brand-light mb-1"
                >
                  Linked Fixture ID
                </label>
                <input
                  id="linkedFixtureId"
                  type="number"
                  value={linkedFixtureId}
                  onChange={(e) => setLinkedFixtureId(e.target.value)}
                  className="w-full p-2 text-sm rounded bg-gray-700 text-white border border-gray-600"
                />
              </div>
              <div>
                <label
                  htmlFor="linkedLeagueId"
                  className="block text-xs font-medium text-brand-light mb-1"
                >
                  Linked League ID
                </label>
                <input
                  id="linkedLeagueId"
                  type="number"
                  value={linkedLeagueId}
                  onChange={(e) => setLinkedLeagueId(e.target.value)}
                  className="w-full p-2 text-sm rounded bg-gray-700 text-white border border-gray-600"
                />
              </div>
              <div>
                <label
                  htmlFor="linkedTeamId"
                  className="block text-xs font-medium text-brand-light mb-1"
                >
                  Linked Team ID
                </label>
                <input
                  id="linkedTeamId"
                  type="number"
                  value={linkedTeamId}
                  onChange={(e) => setLinkedTeamId(e.target.value)}
                  className="w-full p-2 text-sm rounded bg-gray-700 text-white border border-gray-600"
                />
              </div>
            </div>
          </div>

          {translationGroupId && (
            <TranslationsWidget
              translationGroupId={translationGroupId}
              currentPostLanguage={language}
              currentPostTitle={title}
            />
          )}
        </aside>
      </div>
    </form>
  );
}
