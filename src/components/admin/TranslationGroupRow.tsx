// ===== src/components/admin/TranslationGroupRow.tsx (Corrected) =====

"use client";

import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { IPost } from "@/models/Post";
import { ILanguage } from "@/models/Language";
import { Edit, Plus, Trash2, Globe } from "lucide-react";

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
  // Sort by creation date to ensure the "master" is always the first one created
  const sortedGroup = [...group].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const masterPost = sortedGroup[0];
  const existingTranslationsMap = new Map(
    sortedGroup.map((p) => [p.language, p])
  );

  // Get all active languages to determine what translations can be added
  const allActiveLanguages = Array.from(languageMap.values())
    .filter((lang) => lang.isActive)
    .sort((a, b) => a.name.localeCompare(b.name));

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

  return (
    <tr className="border-t-2 border-gray-800 bg-brand-secondary hover:bg-gray-800/50 transition-colors">
      {/* Preview Image Column */}
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

      {/* Title & Language Column */}
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
                  {/* INDIVIDUAL DELETE BUTTON */}
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

      {/* Status & Date Column */}
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

      {/* Group Actions Column */}
      <td className="p-4 align-middle text-center">
        <button
          onClick={handleDeleteAll}
          className="text-gray-500 hover:text-red-400 transition-colors"
          title="Delete entire translation group"
        >
          <Trash2 size={18} />
        </button>
      </td>
    </tr>
  );
}
