// ===== src/components/admin/AIPromptDisplayCard.tsx =====

"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  BrainCircuit,
  FileText,
  Type,
  Info,
  AlertTriangle,
  Edit,
  Save,
  X,
  Loader2,
} from "lucide-react";

interface IAIPrompt {
  _id: string;
  name: string;
  prompt: string;
  description?: string;
  type: "title" | "content" | "prediction_content";
}

interface AIPromptDisplayCardProps {
  promptName: string;
  promptType: "title" | "content" | "prediction_content";
}

const fetchAIPrompt = async (
  name: string,
  type: "title" | "content" | "prediction_content"
): Promise<IAIPrompt> => {
  const { data } = await axios.get(
    `/api/admin/ai-prompt?name=${encodeURIComponent(name)}&type=${type}`
  );
  return data;
};

const CardSkeleton = () => (
  <div className="bg-brand-secondary p-6 rounded-lg shadow-xl animate-pulse h-[350px]"></div>
);

export default function AIPromptDisplayCard({
  promptName,
  promptType,
}: AIPromptDisplayCardProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState("");
  const [promptContent, setPromptContent] = useState("");

  const {
    data: prompt,
    isLoading,
    isError,
    error,
  } = useQuery<IAIPrompt>({
    queryKey: ["aiPrompt", promptName, promptType],
    queryFn: () => fetchAIPrompt(promptName, promptType),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (prompt) {
      setDescription(prompt.description || "");
      setPromptContent(prompt.prompt);
    }
  }, [prompt]);

  const updateMutation = useMutation({
    mutationFn: (updatedPrompt: {
      id: string;
      description?: string;
      prompt: string;
    }) => axios.put("/api/admin/ai-prompt", updatedPrompt),
    onSuccess: (updatedData) => {
      toast.success("Prompt updated successfully!");
      queryClient.setQueryData(
        ["aiPrompt", promptName, promptType],
        updatedData.data
      );
      setIsEditing(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to update prompt.");
    },
  });

  const handleSave = () => {
    if (!prompt) return;
    if (promptContent.trim() === "") {
      toast.error("Prompt content cannot be empty.");
      return;
    }
    updateMutation.mutate({
      id: prompt._id,
      description,
      prompt: promptContent,
    });
  };

  const handleCancel = () => {
    if (prompt) {
      setDescription(prompt.description || "");
      setPromptContent(prompt.prompt);
    }
    setIsEditing(false);
  };

  if (isLoading) return <CardSkeleton />;

  if (isError) {
    return (
      <div className="bg-red-900/50 border border-red-500/50 p-6 rounded-lg text-red-300">
        <h3 className="font-bold text-lg text-white">{promptName}</h3>
        <p className="text-sm">Error: Prompt not found or server error.</p>
      </div>
    );
  }

  return (
    <div className="bg-brand-secondary p-6 rounded-lg shadow-xl flex flex-col h-full min-h-[350px]">
      <div className="flex justify-between items-start gap-4 mb-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 bg-brand-purple/20 text-brand-purple p-3 rounded-lg">
            {promptType === "title" ? (
              <Type size={24} />
            ) : (
              <FileText size={24} />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{prompt?.name}</h3>
            {isEditing ? (
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a short description..."
                className="w-full mt-1 p-1 text-sm rounded bg-gray-700 text-white border border-gray-600"
              />
            ) : (
              <p className="text-sm text-brand-muted">
                {prompt?.description || "No description."}
              </p>
            )}
          </div>
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex-shrink-0 p-2 text-brand-muted hover:text-white hover:bg-gray-700 rounded-full"
            title="Edit Prompt"
          >
            <Edit size={16} />
          </button>
        )}
      </div>

      <div className="flex-grow flex flex-col bg-brand-dark p-4 rounded-md">
        {isEditing ? (
          <textarea
            value={promptContent}
            onChange={(e) => setPromptContent(e.target.value)}
            className="w-full h-full flex-grow bg-transparent text-white font-mono text-xs focus:outline-none resize-none"
            rows={10}
          />
        ) : (
          <p className="whitespace-pre-wrap font-mono text-xs text-brand-light">
            {prompt?.prompt}
          </p>
        )}
      </div>

      {isEditing && (
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={handleCancel}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            <X size={18} /> Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 bg-brand-purple text-white font-bold py-2 px-4 rounded-lg hover:opacity-90 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {updateMutation.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}
