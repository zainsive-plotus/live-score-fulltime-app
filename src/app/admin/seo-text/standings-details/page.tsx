"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { Loader2, Play, FileText, Info } from "lucide-react";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { ILanguage } from "@/models/Language";

const fetchLanguages = async (): Promise<ILanguage[]> => {
  const { data } = await axios.get("/api/admin/languages?active=true");
  return data;
};

export default function StandingsSeoRunnerPage() {
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [content, setContent] = useState("");

  const { data: languages, isLoading: isLoadingLanguages } = useQuery<
    ILanguage[]
  >({
    queryKey: ["activeLanguages"],
    queryFn: fetchLanguages,
  });

  useEffect(() => {
    if (languages && !selectedLanguage) {
      setSelectedLanguage(languages[0]?.code || "");
    }
  }, [languages, selectedLanguage]);

  const mutation = useMutation({
    mutationFn: (data: { language: string; template: string }) =>
      axios.post(`/api/admin/seo-runner/league-standings`, data),
    onSuccess: (response) => {
      toast.success(response.data.message || "Runner completed successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to run the generator.");
    },
  });

  const handleRunGenerator = () => {
    if (!content.trim() || !selectedLanguage) {
      toast.error("Template content and a language must be selected.");
      return;
    }
    if (
      !window.confirm(
        "This will overwrite existing SEO text for all standings pages in this language. Are you sure?"
      )
    ) {
      return;
    }
    mutation.mutate({ language: selectedLanguage, template: content });
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <FileText size={28} /> Standings Page SEO Text Runner
        </h1>
        <div className="flex items-center gap-4">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            disabled={isLoadingLanguages || mutation.isPending}
            className="p-2 rounded bg-gray-700 text-white border border-gray-600"
          >
            {languages?.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleRunGenerator}
            disabled={mutation.isPending}
            className="flex items-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Play size={20} />
            )}
            <span>
              {mutation.isPending
                ? `Processing for ${selectedLanguage.toUpperCase()}...`
                : "Run Generator"}
            </span>
          </button>
        </div>
      </div>

      <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-lg flex items-start gap-4 mb-6">
        <Info size={24} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-200 leading-relaxed font-semibold">
            Enter your master template below. The runner will generate unique
            content for every league.
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mt-2 font-mono text-blue-300">
            <code>{`{leagueName}`}</code>
            <code>{`{season}`}</code>
            <code>{`{club1}`}</code>
            <code>{`{club2}`}</code>
            <code>{`{club3}`}</code>
          </div>
        </div>
      </div>

      <div className="bg-brand-secondary p-6 rounded-lg">
        <RichTextEditor value={content} onChange={setContent} />
      </div>
    </div>
  );
}
