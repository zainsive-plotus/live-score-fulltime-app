// ===== src/components/admin/TranslationGroupRow.tsx =====

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { IPost } from "@/models/Post";
import { ILanguage } from "@/models/Language";
import {
  Edit,
  Trash2,
  Languages,
  Loader2,
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { analyzeSeo } from "@/lib/seo-analyzer"; // ADDED

interface TranslationGroupRowProps {
  group: IPost[];
  languageMap: Map<string, ILanguage>;
  onDelete: (postId: string, title: string) => void;
}

const getScoreBadge = (score: number) => {
  if (score >= 80)
    return (
      <div className="flex items-center gap-1.5 text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
        <CheckCircle size={14} /> {score}
      </div>
    );
  if (score >= 50)
    return (
      <div className="flex items-center gap-1.5 text-xs font-bold text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-full">
        <AlertTriangle size={14} /> {score}
      </div>
    );
  return (
    <div className="flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-full">
      <XCircle size={14} /> {score}
    </div>
  );
};

export default function TranslationGroupRow({
  group,
  languageMap,
  onDelete,
}: TranslationGroupRowProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEngine, setSelectedEngine] = useState<"gpt" | "gemini">("gpt");

  // Find the primary English post to use as the source of truth for SEO analysis
  const primaryPost = group.find((p) => p.language === "en") || group[0];
  const seoResult = analyzeSeo(primaryPost, primaryPost.focusKeyword || "");

  const translateAllMutation = useMutation({
    mutationFn: (payload: {
      translationGroupId: string;
      engine: "gpt" | "gemini";
    }) => axios.post("/api/admin/posts/auto-translate", payload),
    onSuccess: (response) => {
      toast.success(response.data.message || "Translation process completed!");
      queryClient.invalidateQueries({ queryKey: ["adminPosts"] });
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.error || "Failed to start translation process."
      );
    },
  });

  const handleDeleteAll = () => {
    if (
      window.confirm(
        `Are you sure you want to delete "${primaryPost.title}" and all its translations?`
      )
    ) {
      group.forEach((post) => {
        onDelete(post._id as string, post.title);
      });
    }
  };

  const handleTranslateAll = () => {
    const sourceEnglishPost = group.find((p) => p.language === "en");
    if (!sourceEnglishPost) {
      toast.error(
        "An English version of this post is required to act as the source for translation."
      );
      return;
    }
    if (
      window.confirm(
        `This will auto-translate this post into all missing languages using the ${selectedEngine.toUpperCase()} engine. Proceed?`
      )
    ) {
      translateAllMutation.mutate({
        translationGroupId: primaryPost.translationGroupId.toString(),
        engine: selectedEngine,
      });
    }
  };

  const hasAllTranslations =
    group.length >=
    Array.from(languageMap.values()).filter((l) => l.isActive).length;

  return (
    <div className="bg-brand-secondary rounded-lg border-t-2 border-gray-800">
      {/* --- Main Accordion Button --- */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center p-4 text-left"
      >
        <div className="w-[120px] flex-shrink-0 mr-4">
          {primaryPost.featuredImage ? (
            <Image
              src={primaryPost.featuredImage}
              alt={primaryPost.title}
              width={120}
              height={67}
              objectFit="cover"
              className="rounded-md bg-gray-700"
            />
          ) : (
            <div className="w-[120px] h-[67px] bg-gray-700 rounded-md flex items-center justify-center text-xs text-brand-muted">
              No Image
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white text-base">
            {primaryPost.title}
          </h3>
          <p className="text-sm text-brand-muted mt-1">
            Focus Keyword:{" "}
            <span className="font-semibold text-brand-light">
              {primaryPost.focusKeyword || "Not Set"}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-4 mx-4">
          <div className="text-center">
            <span className="text-xs text-brand-muted font-semibold">
              SEO Score
            </span>
            {getScoreBadge(seoResult.score)}
          </div>
          <div className="text-center">
            <span className="text-xs text-brand-muted font-semibold">
              Status
            </span>
            <p
              className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
                primaryPost.status === "published"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-yellow-500/20 text-yellow-400"
              }`}
            >
              {primaryPost.status}
            </p>
          </div>
        </div>
        <ChevronDown
          size={24}
          className={`text-brand-muted transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* --- Collapsible Content --- */}
      {isOpen && (
        <div className="px-4 pb-4">
          <div className="border-t border-gray-700/50 pt-4 flex flex-col gap-3">
            <h4 className="text-sm font-bold text-brand-muted uppercase">
              Translations
            </h4>
            {group.map((post) => {
              const lang = languageMap.get(post.language);
              const postSeoResult = analyzeSeo(post, post.focusKeyword || "");
              return (
                <div
                  key={post._id as string}
                  className="flex items-center justify-between p-2 rounded-md bg-brand-dark/50"
                >
                  <div className="flex items-center gap-3">
                    {lang?.flagUrl && (
                      <Image
                        src={lang.flagUrl}
                        alt={lang.name}
                        width={20}
                        height={15}
                        className="rounded-sm"
                      />
                    )}
                    <span className="font-semibold text-white">
                      {post.title}
                    </span>
                    {getScoreBadge(postSeoResult.score)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/news/edit/${post._id}`}
                      className="p-2 text-blue-400 hover:bg-gray-700 rounded-full"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </Link>
                    <button
                      onClick={() => onDelete(post._id as string, post.title)}
                      className="p-2 text-red-400 hover:bg-gray-700 rounded-full"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="flex justify-end items-center gap-3 pt-3 border-t border-gray-700/50 mt-2">
              <button
                onClick={handleTranslateAll}
                disabled={translateAllMutation.isPending || hasAllTranslations}
                className="flex items-center gap-2 text-sm bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 font-semibold px-3 py-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {translateAllMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Languages size={16} />
                )}
                <span>Translate All</span>
              </button>
              <button
                onClick={handleDeleteAll}
                className="flex items-center gap-2 text-sm bg-red-800/80 text-white hover:bg-red-700 font-semibold px-3 py-1.5 rounded-md transition-colors"
              >
                <Trash2 size={16} />
                <span>Delete Group</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
