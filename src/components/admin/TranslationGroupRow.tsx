"use client";

import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { IPost } from "@/models/Post";
import { ILanguage } from "@/models/Language";
import { Edit, Plus, Trash2 } from "lucide-react";

interface TranslationGroupRowProps {
  group: IPost[];
  languageMap: Map<string, ILanguage>;
  onDelete: (postId: string) => void;
}

export default function TranslationGroupRow({
  group,
  languageMap,
  onDelete,
}: TranslationGroupRowProps) {
  const sortedGroup = [...group].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const masterPost = sortedGroup[0];
  const existingTranslationsMap = new Map(
    sortedGroup.map((p) => [p.language, p])
  );
  const allActiveLanguages = Array.from(languageMap.values())
    .filter((lang) => lang.isActive)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    // --- START OF FIX: Use a single <tr> for the entire group ---
    <tr className="border-t-2 border-gray-800 bg-brand-secondary hover:bg-gray-800/50 transition-colors">
      {/* Column 1: Image */}
      <td className="p-4 w-[140px]">
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

      {/* Column 2: Main Info (Title + Pills) */}
      <td className="p-4" colSpan={2}>
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
                <Link
                  key={lang.code}
                  href={linkHref}
                  title={linkTitle}
                  className="flex-shrink-0"
                >
                  <span
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
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
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </td>

      {/* Column 3: Status & Date */}
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

      {/* Column 4: Actions (Delete entire group) */}
      <td className="p-4 align-middle">
        <button
          onClick={() => {
            if (
              window.confirm(
                "Are you sure you want to delete this post AND all its translations? This action cannot be undone."
              )
            ) {
              // This is a placeholder for a future "delete all" function.
              // For now, we only allow deleting individual posts.
              toast.error(
                "Group deletion not yet implemented. Please delete translations individually."
              );
            }
          }}
          className="text-gray-500 hover:text-red-400 transition-colors"
          title="Delete entire translation group (coming soon)"
        >
          <Trash2 size={18} />
        </button>
      </td>
    </tr>
    // --- END OF FIX ---
  );
}
