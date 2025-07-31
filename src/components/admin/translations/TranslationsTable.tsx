// ===== src/components/admin/translations/TranslationsTable.tsx =====

import { ITranslation } from "@/models/Translation";
import { ILanguage } from "@/models/Language";
import TranslationRow from "./TranslationRow";
import { Loader2, AlertTriangle } from "lucide-react";

interface TranslationsTableProps {
  translations: ITranslation[];
  languages: ILanguage[];
  isLoading: boolean;
  error: Error | null;
}

export default function TranslationsTable({
  translations,
  languages,
  isLoading,
  error,
}: TranslationsTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 size={32} className="animate-spin text-brand-muted" />
        <span className="ml-4 text-lg text-brand-muted">
          Loading translations...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-red-400">
        <AlertTriangle size={32} className="mb-4" />
        <p className="text-lg font-semibold">Failed to load translations.</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1200px] text-left text-brand-light">
        <thead className="bg-gray-800/50 text-sm text-brand-muted uppercase sticky top-0 z-10">
          <tr>
            <th className="p-4 w-1/5">Key & Group</th>
            {languages.map((lang) => (
              <th key={lang.code} className="p-4 w-1/5">
                {lang.name} ({lang.code.toUpperCase()})
              </th>
            ))}
            <th className="p-4 w-[100px] text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {translations.length > 0 ? (
            translations.map((translation) => (
              <TranslationRow
                key={translation._id.toString()}
                translation={translation}
                languages={languages}
              />
            ))
          ) : (
            <tr>
              <td
                colSpan={languages.length + 2}
                className="text-center p-8 text-brand-muted"
              >
                No translations found matching your criteria.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
