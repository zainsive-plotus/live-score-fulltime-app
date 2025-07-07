// src/app/admin/file-manager/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  UploadCloud,
  CheckCircle,
  XCircle,
  Loader2,
  Link as LinkIcon,
  FileText,
  Download,
  Copy,
  Trash2,
  RefreshCw,
} from "lucide-react"; // Add Trash2
import Image from "next/image";

// Type for a simplified uploaded file representation
interface UploadedFile {
  name: string; // Original file name (or name used on S3) - this is the S3 Key
  url: string; // Public URL
  type: string; // Mime type
  size: number; // Size in bytes
}

// Fetcher function for listing files from S3
const fetchUploadedFiles = async (): Promise<UploadedFile[]> => {
  const { data } = await axios.get("/api/upload"); // Call the new GET endpoint
  return data;
};

export default function AdminFileManagerPage() {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloadFileName, setDownloadFileName] = useState("");

  console.log("process.env.NEXT_PUBLIC_R2_PUBLIC_BUCKET_URL");

  console.log(process.env.NEXT_PUBLIC_R2_PUBLIC_BUCKET_URL);

  const {
    data: existingFiles,
    isLoading: isLoadingFiles,
    error: filesError,
    refetch: refetchFiles,
  } = useQuery<UploadedFile[]>({
    queryKey: ["uploadedFiles"],
    queryFn: fetchUploadedFiles,
    staleTime: 1000 * 60 * 5,
  });

  const [currentUploadedFiles, setCurrentUploadedFiles] = useState<
    UploadedFile[]
  >([]);

  useEffect(() => {
    if (existingFiles) {
      setCurrentUploadedFiles(existingFiles);
    }
  }, [existingFiles]);

  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => axios.post("/api/upload", formData),
    onSuccess: (data) => {
      toast.success("File uploaded successfully!");
      setCurrentUploadedFiles((prev) => [
        {
          name: data.data.name || selectedFile?.name || "Unknown File",
          url: data.data.url,
          type:
            data.data.type || selectedFile?.type || "application/octet-stream",
          size: data.data.size || selectedFile?.size || 0,
        },
        ...prev.filter((f) => f.url !== data.data.url),
      ]);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      queryClient.invalidateQueries({ queryKey: ["uploadedFiles"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to upload file.");
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
  });

  const downloadFromUrlMutation = useMutation({
    mutationFn: (payload: { url: string; fileName?: string }) =>
      axios.post("/api/admin/file-manager/download-from-url", payload),
    onSuccess: (data) => {
      toast.success("File downloaded from URL and uploaded!");
      setCurrentUploadedFiles((prev) => [
        {
          name: data.data.name,
          url: data.data.url,
          type: data.data.type,
          size: data.data.size,
        },
        ...prev.filter((f) => f.url !== data.data.url),
      ]);
      setDownloadUrl("");
      setDownloadFileName("");
      queryClient.invalidateQueries({ queryKey: ["uploadedFiles"] });
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.error || "Failed to download file from URL."
      );
    },
  });

  // --- NEW: Delete mutation ---
  const deleteFileMutation = useMutation({
    mutationFn: (fileKey: string) => axios.delete(`/api/upload?key=${fileKey}`),
    onSuccess: (_, fileKey) => {
      toast.success("File deleted successfully!");
      // Optimistically update the list
      setCurrentUploadedFiles((prev) => prev.filter((f) => f.name !== fileKey));
      queryClient.invalidateQueries({ queryKey: ["uploadedFiles"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete file.");
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a file to upload.");
      return;
    }
    const formData = new FormData();
    formData.append("file", selectedFile);
    uploadMutation.mutate(formData);
  };

  const handleDownloadFromUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!downloadUrl.trim()) {
      toast.error("Please enter a URL.");
      return;
    }
    downloadFromUrlMutation.mutate({
      url: downloadUrl,
      fileName: downloadFileName.trim() || undefined,
    });
  };

  const handleDeleteFile = (fileKey: string, fileName: string) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${fileName}"? This action cannot be undone.`
      )
    ) {
      deleteFileMutation.mutate(fileKey);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("URL copied to clipboard!");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isUploading =
    uploadMutation.isPending || downloadFromUrlMutation.isPending;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <FileText size={28} /> File Manager
        </h1>
      </div>

      {/* File Upload Section */}
      <div className="bg-brand-secondary p-6 rounded-lg mb-8 shadow-xl">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
          <UploadCloud size={24} /> Upload New File
        </h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label
              htmlFor="file-upload"
              className="block text-sm font-medium text-brand-light mb-2"
            >
              Select File
            </label>
            <input
              id="file-upload"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="w-full text-brand-light bg-gray-700 border border-gray-600 rounded-lg p-3 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-purple file:text-white hover:file:opacity-90 cursor-pointer"
              disabled={isUploading}
            />
            {selectedFile && (
              <p className="mt-2 text-sm text-brand-muted">
                Selected: {selectedFile.name} (
                {formatFileSize(selectedFile.size)})
              </p>
            )}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={!selectedFile || isUploading}
            >
              {uploadMutation.isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <CheckCircle size={18} />
              )}
              {uploadMutation.isPending ? "Uploading..." : "Upload File"}
            </button>
          </div>
        </form>
      </div>

      {/* Download from URL Section */}
      <div className="bg-brand-secondary p-6 rounded-lg mb-8 shadow-xl">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
          <Download size={24} /> Download from URL
        </h2>
        <form onSubmit={handleDownloadFromUrl} className="space-y-4">
          <div>
            <label
              htmlFor="download-url"
              className="block text-sm font-medium text-brand-light mb-1"
            >
              File URL
            </label>
            <input
              id="download-url"
              type="url"
              value={downloadUrl}
              onChange={(e) => setDownloadUrl(e.target.value)}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
              placeholder="e.g., https://example.com/image.jpg"
              required
              disabled={isUploading}
            />
          </div>
          <div>
            <label
              htmlFor="download-filename"
              className="block text-sm font-medium text-brand-light mb-1"
            >
              Optional File Name (on S3)
            </label>
            <input
              id="download-filename"
              type="text"
              value={downloadFileName}
              onChange={(e) => setDownloadFileName(e.target.value)}
              className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
              placeholder="e.g., my-custom-image (extension will be added automatically)"
              disabled={isUploading}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={!downloadUrl.trim() || isUploading}
            >
              {downloadFromUrlMutation.isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Download size={18} />
              )}
              {downloadFromUrlMutation.isPending
                ? "Downloading..."
                : "Download & Upload"}
            </button>
          </div>
        </form>
      </div>

      {/* Uploaded Files List */}
      <div className="bg-brand-secondary rounded-lg overflow-hidden shadow-xl">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-4">
            <LinkIcon size={24} /> Uploaded Files
            <button
              onClick={() => refetchFiles()}
              className="ml-auto text-brand-muted hover:text-white flex items-center gap-1 text-sm"
              disabled={isLoadingFiles || deleteFileMutation.isPending}
            >
              <RefreshCw
                size={16}
                className={isLoadingFiles ? "animate-spin" : ""}
              />{" "}
              Refresh
            </button>
          </h2>
        </div>

        {isLoadingFiles ? (
          <p className="text-center p-8 text-brand-muted">
            Loading files from S3...
          </p>
        ) : filesError ? (
          <p className="text-center p-8 text-red-400">
            Failed to load files from S3: {filesError.message}
          </p>
        ) : currentUploadedFiles.length === 0 ? (
          <p className="text-center p-8 text-brand-muted">
            No files uploaded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-brand-light">
              <thead className="bg-gray-800/50 text-sm text-brand-muted uppercase">
                <tr>
                  <th className="p-4">Preview</th>
                  <th className="p-4">File Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Size</th>
                  <th className="p-4">Public URL</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUploadedFiles.map(
                  (
                    file // Removed 'index' as key, using file.url
                  ) => (
                    <tr key={file.url} className="border-t border-gray-700/50">
                      <td className="p-4">
                        {file.type.startsWith("image/") ? (
                          <Image
                            src={file.url}
                            alt={file.name}
                            width={80}
                            height={45}
                            objectFit="contain"
                            className="rounded-md bg-gray-700"
                          />
                        ) : (
                          <div className="w-20 h-10 bg-gray-700 flex items-center justify-center text-xs text-brand-muted rounded-md">
                            File
                          </div>
                        )}
                      </td>
                      <td
                        className="p-4 font-medium max-w-xs truncate"
                        title={file.name}
                      >
                        {file.name}
                      </td>
                      <td className="p-4 text-brand-muted text-sm">
                        {file.type.split("/")[1] || file.type}
                      </td>
                      <td className="p-4 text-brand-muted text-sm">
                        {formatFileSize(file.size)}
                      </td>
                      <td className="p-4 max-w-sm truncate">
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline text-sm"
                          title={file.url}
                        >
                          {file.url}
                        </a>
                      </td>
                      <td className="p-4 flex gap-2 items-center">
                        <button
                          onClick={() => copyToClipboard(file.url)}
                          className="text-brand-purple hover:text-brand-purple/80 p-1 rounded-full bg-brand-dark"
                          title="Copy URL"
                        >
                          <Copy size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteFile(file.name, file.name)} // Pass file.name (which is the S3 Key) for deletion
                          className="text-red-400 hover:text-red-300 p-1 rounded-full bg-brand-dark"
                          title="Delete File"
                          disabled={
                            deleteFileMutation.isPending &&
                            deleteFileMutation.variables === file.name
                          } // Disable if this specific file is pending deletion
                        >
                          {deleteFileMutation.isPending &&
                          deleteFileMutation.variables === file.name ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
