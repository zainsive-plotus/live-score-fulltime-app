"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "@/components/StyledLink";
import Image from "next/image";
import {
  UploadCloud,
  XCircle,
  Link2,
  Type,
  Tag,
  Languages,
} from "lucide-react";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { SportsCategory, NewsType } from "@/models/Post";
import { ILanguage } from "@/models/Language";

const fetchActiveLanguages = async (): Promise<ILanguage[]> => {
  const { data } = await axios.get("/api/admin/languages?active=true");
  return data;
};

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

export default function CreateNewsPostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [language, setLanguage] = useState("");
  const [translationGroupId, setTranslationGroupId] = useState<
    string | undefined
  >(undefined);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageTitle, setImageTitle] = useState("");
  const [imageAltText, setImageAltText] = useState("");

  // --- REVERTED TO ARRAY STATE ---
  const [selectedSportsCategories, setSelectedSportsCategories] = useState<
    SportsCategory[]
  >(["general"]);

  const [newsType, setNewsType] = useState<NewsType>("news");
  const [linkedFixtureId, setLinkedFixtureId] = useState("");
  const [linkedLeagueId, setLinkedLeagueId] = useState("");
  const [linkedTeamId, setLinkedTeamId] = useState("");

  const { data: languages, isLoading: isLoadingLanguages } = useQuery<
    ILanguage[]
  >({
    queryKey: ["activeLanguages"],
    queryFn: fetchActiveLanguages,
  });

  useEffect(() => {
    const fromGroupId = searchParams.get("from");
    const langCode = searchParams.get("lang");
    const fromTitle = searchParams.get("title");

    if (fromGroupId && langCode && fromTitle) {
      setTranslationGroupId(fromGroupId);
      setLanguage(langCode);
      setTitle(fromTitle);
      toast.success(`Creating new translation for "${langCode.toUpperCase()}"`);
    }
  }, [searchParams]);

  // --- REVERTED TO CHECKBOX HANDLER ---
  const handleSportsCategoryChange = (category: SportsCategory) => {
    setSelectedSportsCategories((prev) => {
      if (prev.includes(category)) {
        // Prevent removing the last category
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

  const createPostMutation = useMutation({
    mutationFn: (newPost: any) => {
      return axios.post("/api/posts", newPost);
    },
    onSuccess: () => {
      toast.success("Post created successfully!");
      router.push("/admin/news");
      router.refresh();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Failed to create post.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !language) {
      toast.error("Title, Content, and Language are required.");
      return;
    }
    createPostMutation.mutate({
      title,
      content,
      status,
      featuredImage,
      metaTitle,
      metaDescription,
      featuredImageTitle: imageTitle,
      featuredImageAltText: imageAltText,
      sportsCategory: selectedSportsCategories, // Pass the array
      newsType,
      linkedFixtureId: linkedFixtureId ? Number(linkedFixtureId) : undefined,
      linkedLeagueId: linkedLeagueId ? Number(linkedLeagueId) : undefined,
      linkedTeamId: linkedTeamId ? Number(linkedTeamId) : undefined,
      language,
      translationGroupId,
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">
          {translationGroupId ? "Create New Translation" : "Create New Post"}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-brand-secondary p-6 rounded-lg space-y-6"
      >
        {/* Language, Title, Content sections are correct */}
        <div>
          <label
            htmlFor="language"
            className="block text-sm font-medium text-brand-light mb-2 flex items-center gap-2"
          >
            <Languages size={16} /> Language
          </label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            required
            disabled={isLoadingLanguages || !!translationGroupId}
            className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple disabled:bg-gray-700/50 disabled:cursor-not-allowed"
          >
            <option value="" disabled>
              {isLoadingLanguages
                ? "Loading languages..."
                : "Select a language..."}
            </option>
            {languages?.map((lang) => (
              <option key={lang._id} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
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
            required
            className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-light mb-2">
            Content
          </label>
          <RichTextEditor value={content} onChange={setContent} />
        </div>

        <div className="space-y-6 p-4 border border-gray-600 rounded-lg">
          <h3 className="text-lg font-semibold text-white">Content Details</h3>

          {/* --- REVERTED TO CHECKBOXES --- */}
          <div>
            <label className="block text-sm font-medium text-brand-light mb-3 flex items-center gap-2">
              <Tag size={16} /> Sports Categories
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {availableSportsCategories.map((category) => (
                <div key={category.id} className="flex items-center">
                  <input
                    id={`category-${category.id}`}
                    type="checkbox"
                    checked={selectedSportsCategories.includes(category.id)}
                    onChange={() => handleSportsCategoryChange(category.id)}
                    className="w-4 h-4 text-brand-purple bg-gray-700 border-gray-600 rounded focus:ring-brand-purple"
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
              Note: Articles tagged with 'Football' will only appear in the
              Football News section.
            </p>
          </div>

          <div>
            <label
              htmlFor="newsType"
              className="block text-sm font-medium text-brand-light mb-2 flex items-center gap-2"
            >
              <Type size={16} /> News Type
            </label>
            <select
              id="newsType"
              value={newsType}
              onChange={(e) => setNewsType(e.target.value as NewsType)}
              className="w-full p-3 rounded bg-gray-800 text-white border border-gray-600"
            >
              {availableNewsTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-700/50">
            <div>
              <label
                htmlFor="linkedFixtureId"
                className="block text-sm font-medium text-brand-light mb-2 flex items-center gap-2"
              >
                <Link2 size={16} /> Linked Fixture ID (Optional)
              </label>
              <input
                id="linkedFixtureId"
                type="number"
                value={linkedFixtureId}
                onChange={(e) => setLinkedFixtureId(e.target.value)}
                placeholder="e.g., 123456"
                className="w-full p-3 rounded bg-gray-800 text-white border border-gray-600"
              />
            </div>
            <div>
              <label
                htmlFor="linkedLeagueId"
                className="block text-sm font-medium text-brand-light mb-2 flex items-center gap-2"
              >
                <Link2 size={16} /> Linked League ID (Optional)
              </label>
              <input
                id="linkedLeagueId"
                type="number"
                value={linkedLeagueId}
                onChange={(e) => setLinkedLeagueId(e.target.value)}
                placeholder="e.g., 39"
                className="w-full p-3 rounded bg-gray-800 text-white border border-gray-600"
              />
            </div>
            <div>
              <label
                htmlFor="linkedTeamId"
                className="block text-sm font-medium text-brand-light mb-2 flex items-center gap-2"
              >
                <Link2 size={16} /> Linked Team ID (Optional)
              </label>
              <input
                id="linkedTeamId"
                type="number"
                value={linkedTeamId}
                onChange={(e) => setLinkedTeamId(e.target.value)}
                placeholder="e.g., 33"
                className="w-full p-3 rounded bg-gray-800 text-white border border-gray-600"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 border border-gray-600 rounded-lg">
            <label className="block text-sm font-medium text-brand-light mb-2">
              Featured Image
            </label>
            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-600 px-6 py-10">
              {featuredImage ? (
                <div className="relative group w-full h-48">
                  <Image
                    src={featuredImage}
                    alt={imageAltText || "Featured preview"}
                    layout="fill"
                    objectFit="contain"
                  />
                  <button
                    type="button"
                    onClick={() => setFeaturedImage(null)}
                    className="absolute top-2 right-2 bg-red-600 rounded-full p-1 text-white opacity-0 group-hover:opacity-100"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-500" />
                  <div className="mt-4 flex text-sm text-gray-400">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-semibold text-brand-purple hover:text-brand-purple/80"
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
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB
                  </p>
                </div>
              )}
            </div>
            {featuredImage && (
              <div className="space-y-4 mt-4">
                <div>
                  <label
                    htmlFor="imageTitle"
                    className="block text-sm font-medium text-brand-light mb-1"
                  >
                    Image Title
                  </label>
                  <input
                    id="imageTitle"
                    type="text"
                    value={imageTitle}
                    onChange={(e) => setImageTitle(e.target.value)}
                    className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
                  />
                </div>
                <div>
                  <label
                    htmlFor="imageAltText"
                    className="block text-sm font-medium text-brand-light mb-1"
                  >
                    Image Alt Text
                  </label>
                  <input
                    id="imageAltText"
                    type="text"
                    value={imageAltText}
                    onChange={(e) => setImageAltText(e.target.value)}
                    className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
                  />
                </div>
              </div>
            )}
          </div>
          <div className="space-y-6 p-4 border border-gray-600 rounded-lg">
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
                className="w-full p-3 rounded bg-gray-800 text-white border border-gray-600"
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
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={4}
                className="w-full p-3 rounded bg-gray-800 text-white border border-gray-600"
              ></textarea>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-600">
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
              className="p-3 rounded bg-gray-700 text-white border border-gray-600"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
          <div className="flex gap-4">
            <Link
              href="/admin/news"
              className="bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={createPostMutation.isPending || isUploading}
              className="bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {createPostMutation.isPending ? "Saving..." : "Save Post"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
