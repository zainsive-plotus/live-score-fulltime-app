// ===== src/components/admin/BatchProcessModal.tsx =====

"use client";

import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { XCircle, Loader2, CheckCircle } from 'lucide-react';

interface BatchProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BatchProcessModal({ isOpen, onClose }: BatchProcessModalProps) {
  const queryClient = useQueryClient();
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);
  
  const processAllArticles = async () => {
    setIsProcessing(true);
    setIsComplete(false);
    setLogs([]);

    const response = await fetch("/api/cron/process-all-news", { method: "POST" });

    if (!response.body) {
      toast.error("Streaming not supported or response body is missing.");
      setIsProcessing(false);
      setIsComplete(true);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n\n");

      lines.forEach((line) => {
        if (line.startsWith("data:")) {
          try {
            const json = JSON.parse(line.substring(5));
            if (json.event === "LOG") {
              setLogs(prev => [...prev, json.data]);
            }
            if (json.event === "COMPLETE") {
              toast.success(json.data || "Batch process complete!");
            }
          } catch (e) {
            console.error("Failed to parse stream log", e);
          }
        }
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      processAllArticles().finally(() => {
        setIsProcessing(false);
        setIsComplete(true);
        queryClient.invalidateQueries({ queryKey: ["externalNews"] });
        queryClient.invalidateQueries({ queryKey: ["adminCuratedPosts"] });
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            {isProcessing && <Loader2 className="animate-spin" />}
            {isComplete && <CheckCircle className="text-green-400" />}
            Batch Processing Log
          </h2>
          <button onClick={onClose} className="text-brand-muted hover:text-white" disabled={isProcessing}>
            <XCircle size={24} />
          </button>
        </div>

        <div className="p-6">
          <div
            ref={logContainerRef}
            className="bg-brand-dark p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm text-brand-light space-y-2 custom-scrollbar"
          >
            {logs.map((log, index) => (
              <div key={index} className="flex items-start gap-2">
                <span className="text-brand-muted">{">"}</span>
                <span
                  className={
                    log.startsWith("✓") ? "text-green-400" :
                    log.startsWith("✗") ? "text-red-400" : ""
                  }
                >
                  {log}
                </span>
              </div>
            ))}
            {isProcessing && <div className="text-yellow-400 animate-pulse">Processing... this may take several minutes. Please keep this window open.</div>}
            {isComplete && <div className="text-green-400 font-bold">✓ All tasks complete. You can now close this window.</div>}
          </div>
        </div>
        
        <div className="p-6 border-t border-gray-700 flex justify-end">
            <button
                onClick={onClose}
                className="bg-brand-purple text-white font-bold py-2 px-6 rounded-lg hover:opacity-90 disabled:opacity-50"
                disabled={isProcessing}
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
}