// ===== src/app/admin/(protected)/sitemaps/page.tsx =====
"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import { Map, Loader2, Play, CheckCircle, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function SitemapsPage() {
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([]);
  const [failedFiles, setFailedFiles] = useState<string[]>([]);

  const generateSitemapsMutation = useMutation({
    mutationFn: () => axios.post("/api/admin/sitemaps/generate"),
    onSuccess: (response) => {
      toast.success(response.data.message);
      setGeneratedFiles(response.data.generatedFiles || []);
      setFailedFiles(response.data.failedFiles || []);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Sitemap generation failed.");
      setGeneratedFiles([]);
      setFailedFiles([]);
    },
  });

  const handleGenerate = () => {
    if (
      window.confirm(
        "This may take several minutes and will overwrite existing sitemap files. Are you sure?"
      )
    ) {
      setGeneratedFiles([]);
      setFailedFiles([]);
      generateSitemapsMutation.mutate();
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Map size={28} /> Sitemap Generation
        </h1>
      </div>

      <div className="bg-brand-secondary p-6 rounded-lg shadow-xl">
        <h2 className="text-xl font-bold text-white">
          Generate Static Sitemaps
        </h2>
        <p className="text-brand-muted text-sm mt-1 mb-4">
          Click the button below to generate all sitemap files for all active
          languages. The generated files will be saved in the `/public/sitemap`
          directory and served statically. You can view the main sitemap index
          at{" "}
          <Link
            href="/sitemap.xml"
            target="_blank"
            className="text-brand-purple hover:underline"
          >
            /sitemap.xml
          </Link>
          .
        </p>
        <button
          onClick={handleGenerate}
          disabled={generateSitemapsMutation.isPending}
          className="inline-flex items-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-wait"
        >
          {generateSitemapsMutation.isPending ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Play size={20} />
          )}
          <span>
            {generateSitemapsMutation.isPending
              ? "Generating..."
              : "Generate All Sitemaps Now"}
          </span>
        </button>
      </div>

      {(generatedFiles.length > 0 || failedFiles.length > 0) && (
        <div className="bg-brand-secondary p-6 rounded-lg shadow-xl">
          <h3 className="text-lg font-semibold text-white mb-3">
            Generation Report
          </h3>
          {generatedFiles.length > 0 && (
            <div>
              <h4 className="flex items-center gap-2 text-green-400 font-bold mb-2">
                <CheckCircle size={18} /> Succeeded:
              </h4>
              <ul className="text-sm text-brand-light font-mono list-disc list-inside max-h-48 overflow-y-auto custom-scrollbar bg-brand-dark/30 p-2 rounded">
                {generatedFiles.map((file) => (
                  <li key={file}>{file}</li>
                ))}
              </ul>
            </div>
          )}
          {failedFiles.length > 0 && (
            <div className="mt-4">
              <h4 className="flex items-center gap-2 text-red-400 font-bold mb-2">
                <AlertTriangle size={18} /> Failed:
              </h4>
              <ul className="text-sm text-red-300 font-mono list-disc list-inside bg-brand-dark/30 p-2 rounded">
                {failedFiles.map((file) => (
                  <li key={file}>{file}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
