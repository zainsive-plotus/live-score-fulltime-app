// ===== src/components/admin/TranslationGroupRow.tsx =====

"use client";

import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { IPost } from "@/models/Post";
import { ILanguage } from "@/models/Language";
import {
  Edit,
  Plus,
  Trash2,
  Languages,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { useState } from "react"; // ADDED
import { Menu, Transition } from "@headlessui/react"; // ADDED
import { Fragment } from "react"; // ADDED

interface TranslationGroupRowProps {
  group: IPost[];
  languageMap: Map<string, ILanguage>;
  onDelete: (postId: string, title: string) => void;
}

export default function TranslationGroupRow({
  group,
  languageMap,
  onDelete,
}: TranslationGroupRowProps) {
  const queryClient = useQueryClient();
  // ADDED: State to manage the selected translation engine
  const [selectedEngine, setSelectedEngine] = useState<"gpt" | "gemini">("gpt");

  const sortedGroup = [...group].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const masterPost = sortedGroup[0];
  const existingTranslationsMap = new Map(
    sortedGroup.map((p) => [p.language, p])
  );

  const allActiveLanguages = Array.from(languageMap.values())
    .filter((lang) => lang.isActive)
    .sort((a, b) => a.name.localeCompare(b.name));

  const translateAllMutation = useMutation({
    // MODIFIED: Mutation now sends the selected engine
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
        `Are you sure you want to delete the post "${
          masterPost.title
        }" AND all of its ${
          group.length - 1
        } translations? This action cannot be undone.`
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
        translationGroupId: masterPost.translationGroupId.toString(),
        engine: selectedEngine,
      });
    }
  };

  const hasAllTranslations =
    existingTranslationsMap.size >= allActiveLanguages.length;

  return (
    <tr className="border-t-2 border-gray-800 bg-brand-secondary hover:bg-gray-800/50 transition-colors">
      <td className="p-4 w-[140px] align-top">
        {masterPost.featuredImage ? (
          <Image
            src={masterPost.featuredImage}
            alt={masterPost.title}
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
      </td>
      <td className="p-4 align-top" colSpan={2}>
        <div className="flex flex-col gap-3">
          <Link href={`/admin/news/edit/${masterPost._id}`}>
            <h3 className="font-bold text-white text-base hover:text-brand-purple transition-colors">
              {masterPost.title}
            </h3>
          </Link>
          <div className="flex flex-wrap gap-2">
            {allActiveLanguages.map((lang) => {
              const translation = existingTranslationsMap.get(lang.code);
              const isAvailable = !!translation;

              const linkHref = isAvailable
                ? `/admin/news/edit/${translation._id}`
                : {
                    pathname: "/admin/news/create",
                    query: {
                      from: masterPost.translationGroupId.toString(),
                      lang: lang.code,
                      title: `[${lang.code.toUpperCase()}] ${masterPost.title}`,
                      image: masterPost.featuredImage || "",
                      categories: masterPost.sportsCategory.join(","),
                    },
                  };

              const linkTitle = isAvailable
                ? `Edit ${lang.name} translation`
                : `Add ${lang.name} translation`;

              return (
                <div key={lang.code} className="relative group/item">
                  <Link
                    href={linkHref}
                    title={linkTitle}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                      isAvailable
                        ? "bg-blue-500/10 text-blue-300 border-blue-500/30 hover:bg-blue-500/20"
                        : "bg-gray-700/50 text-gray-400 border-gray-600/50 hover:bg-gray-700"
                    }`}
                  >
                    {lang.flagUrl && (
                      <Image
                        src={lang.flagUrl}
                        alt={lang.name}
                        width={16}
                        height={12}
                        className="rounded-sm"
                      />
                    )}
                    <span className="hidden sm:inline">{lang.name}</span>
                    <span className="sm:hidden">{lang.code.toUpperCase()}</span>
                    {isAvailable ? <Edit size={12} /> : <Plus size={12} />}
                  </Link>
                  {isAvailable && (
                    <button
                      onClick={() =>
                        onDelete(translation._id as string, translation.title)
                      }
                      className="absolute -top-2 -right-2 z-10 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity hover:bg-red-500"
                      title={`Delete ${lang.name} translation`}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </td>
      <td className="p-4 align-middle text-sm text-center">
        <div>
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${
              masterPost.status === "published"
                ? "bg-green-500/20 text-green-400"
                : "bg-yellow-500/20 text-yellow-400"
            }`}
          >
            {masterPost.status}
          </span>
          <p className="text-brand-muted text-xs mt-2">
            {format(new Date(masterPost.createdAt), "dd MMM yyyy")}
          </p>
        </div>
      </td>
      <td className="p-4 align-middle text-center space-y-2">
        {/* MODIFIED: The Translate button is now part of a dropdown group */}
        <div className="flex rounded-md shadow-sm">
          <button
            onClick={handleTranslateAll}
            disabled={translateAllMutation.isPending || hasAllTranslations}
            className="relative inline-flex items-center justify-center gap-2 flex-grow text-sm bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 font-semibold px-3 py-1.5 rounded-l-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              hasAllTranslations
                ? "All languages are already translated"
                : "Auto-translate into all missing languages"
            }
          >
            {translateAllMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Languages size={16} />
            )}
            <span>Translate All</span>
          </button>
          <Menu as="div" className="relative -ml-px block">
            <Menu.Button className="relative inline-flex items-center h-full px-2 py-1.5 rounded-r-md border-l border-indigo-500/30 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30">
              <span className="sr-only">Open options</span>
              <ChevronDown className="h-5 w-5" aria-hidden="true" />
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-32 origin-top-right rounded-md bg-brand-dark shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setSelectedEngine("gpt")}
                        className={`${
                          active
                            ? "bg-brand-secondary text-white"
                            : "text-gray-300"
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        GPT-4o
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => setSelectedEngine("gemini")}
                        className={`${
                          active
                            ? "bg-brand-secondary text-white"
                            : "text-gray-300"
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        Gemini
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
        <p className="text-xs text-brand-muted">
          Using:{" "}
          <span className="font-semibold text-white">
            {selectedEngine.toUpperCase()}
          </span>
        </p>

        <button
          onClick={handleDeleteAll}
          className="text-gray-500 hover:text-red-400 transition-colors p-1"
          title="Delete entire translation group"
        >
          <Trash2 size={18} />
        </button>
      </td>
    </tr>
  );
}
