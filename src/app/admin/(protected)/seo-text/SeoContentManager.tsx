"use client";

import { useState, useEffect, Fragment, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Loader2,
  Play,
  Info,
  PlusCircle,
  X,
  TestTube2,
  Save,
  ChevronDown,
  CheckCircle,
} from "lucide-react";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { ILanguage } from "@/models/Language";
import { ISeoTemplate } from "@/models/SeoTemplate";
import { ISeoContent } from "@/models/SeoContent";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import SeoContentList from "./SeoContentList";
import TestResultModal from "./TestResultModal";
import { Dialog, Transition } from "@headlessui/react";

const PAGE_TYPES = [
  { value: "league-standings", label: "League Standings Detail" },
];

const fetchTemplate = async (pageType: string): Promise<ISeoTemplate> => {
  const { data } = await axios.get(
    `/api/admin/seo-templates?pageType=${pageType}&language=${DEFAULT_LOCALE}`
  );
  return data;
};

const fetchSeoContent = async (pageType: string): Promise<ISeoContent[]> => {
  const { data } = await axios.get(
    `/api/admin/seo-content?pageType=${pageType}`
  );
  return data;
};
const fetchLanguages = async (): Promise<ILanguage[]> => {
  const { data } = await axios.get("/api/admin/languages?active=true");
  return data;
};
const LogViewerModal = ({
  logs,
  progress,
  onClose,
  isOpen,
  isComplete,
}: {
  logs: any[];
  progress: any;
  onClose: () => void;
  isOpen: boolean;
  isComplete: boolean;
}) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="text-green-400" size={16} />;
      case "error":
        return <X className="text-red-400" size={16} />;
      default:
        return <Info className="text-blue-400" size={16} />;
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="relative z-[101]"
        onClose={isComplete ? onClose : () => {}}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/70" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-brand-secondary p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-xl font-bold leading-6 text-white mb-4"
                >
                  Processing Logs
                </Dialog.Title>
                <div className="mt-2 space-y-3">
                  <div className="w-full bg-brand-dark rounded-full h-4">
                    <div
                      className="bg-brand-purple h-4 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          progress.total > 0
                            ? (progress.current / progress.total) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                  <div className="text-center text-sm font-semibold text-brand-light">
                    {progress.stage}: {progress.current} / {progress.total}
                  </div>
                </div>
                <div
                  ref={logContainerRef}
                  className="mt-4 h-80 overflow-y-auto custom-scrollbar bg-brand-dark p-4 rounded-lg font-mono text-xs space-y-2"
                >
                  {logs.map((log, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(log.type)}
                      </div>
                      <p
                        className={`whitespace-pre-wrap ${
                          log.type === "error"
                            ? "text-red-400"
                            : "text-gray-300"
                        }`}
                      >
                        {log.message}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-brand-purple px-4 py-2 text-sm font-medium text-white hover:bg-brand-purple/80 focus:outline-none disabled:opacity-50"
                    onClick={onClose}
                    disabled={!isComplete}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default function SeoContentManager({
  initialPageType,
  initialLanguages,
  initialMasterTemplate,
  initialContentItems,
}: {
  pageType: string;
  initialLanguages: ILanguage[];
  initialMasterTemplate: ISeoTemplate | null;
  initialContentItems: ISeoContent[];
}) {
  const queryClient = useQueryClient();
  const [selectedPageType, setSelectedPageType] = useState(initialPageType);
  const [content, setContent] = useState(initialMasterTemplate?.template || "");
  const [variableMappings, setVariableMappings] = useState<
    { variable: string; expression: string }[]
  >(
    initialMasterTemplate?.variableMappings?.map((m) => ({
      variable: m.variable,
      expression: m.path,
    })) || []
  );
  const [isEditorOpen, setIsEditorOpen] = useState(!initialMasterTemplate);
  const [testResult, setTestResult] = useState<any>(null);

  const [isRunnerModalOpen, setIsRunnerModalOpen] = useState(false);
  const [runnerLogs, setRunnerLogs] = useState<any[]>([]);
  const [runnerProgress, setRunnerProgress] = useState({
    current: 0,
    total: 0,
    stage: "Starting...",
  });
  const [isRunnerComplete, setIsRunnerComplete] = useState(false);
  const [isRunningGenerator, setIsRunningGenerator] = useState(false);

  const { data: languages } = useQuery<ILanguage[]>({
    queryKey: ["activeLanguages"],
    queryFn: fetchLanguages,
    initialData: initialLanguages,
  });
  const { data: contentItems, isLoading: isLoadingContent } = useQuery({
    queryKey: ["seoContent", selectedPageType],
    queryFn: () => fetchSeoContent(selectedPageType),
    enabled: !!selectedPageType,
    initialData: initialContentItems,
  });

  const { data: savedTemplate, isLoading: isLoadingTemplate } = useQuery({
    queryKey: ["seoTemplate", selectedPageType, DEFAULT_LOCALE],
    queryFn: () => fetchTemplate(selectedPageType),
    enabled: !!selectedPageType,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (savedTemplate) {
      setContent(savedTemplate.template || "");
      setVariableMappings(
        savedTemplate.variableMappings?.map((m: any) => ({
          variable: m.variable,
          expression: m.path,
        })) || []
      );
    } else {
      setContent("");
      setVariableMappings([]);
    }
  }, [savedTemplate]);

  const saveTemplateMutation = useMutation({
    mutationFn: (data: any) => axios.post(`/api/admin/seo-templates`, data),
    onSuccess: (response, variables) => {
      toast.success("Template saved successfully!");
      queryClient.invalidateQueries({
        queryKey: ["seoTemplate", variables.pageType, DEFAULT_LOCALE],
      });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Failed to save template."),
  });

  const testMutation = useMutation({
    mutationFn: (data: any) => axios.post(`/api/admin/seo-runner/test`, data),
    onSuccess: (response) => setTestResult(response.data),
    onError: (err: any) =>
      toast.error(err.response?.data?.error || "Failed to run test."),
  });

  const getMappingsObject = () =>
    variableMappings.reduce((acc, item) => {
      if (item.variable && item.expression)
        acc[item.variable] = item.expression;
      return acc;
    }, {} as Record<string, string>);

  const handleRunGenerator = async () => {
    if (!content.trim() || !selectedPageType)
      return toast.error("Template and page type must be selected.");
    if (
      !window.confirm(
        "This will save the current template and overwrite existing SEO text for ALL languages. Are you sure?"
      )
    )
      return;

    setIsRunningGenerator(true);
    setRunnerLogs([]);
    setRunnerProgress({ current: 0, total: 0, stage: "Initializing..." });
    setIsRunnerComplete(false);
    setIsRunnerModalOpen(true);

    try {
      const response = await fetch("/api/admin/seo-runner/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageType: selectedPageType,
          template: content,
          variableMappings: getMappingsObject(),
        }),
      });

      if (!response.ok)
        throw new Error(`Server responded with ${response.status}`);
      if (!response.body) throw new Error("Response body is null.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.type === "progress") {
                setRunnerProgress((prev) => ({ ...prev, ...data }));
              } else if (data.type === "done") {
                setIsRunnerComplete(true);
                toast.success(data.message);
                queryClient.invalidateQueries({
                  queryKey: ["seoContent", selectedPageType],
                });
              } else {
                setRunnerLogs((prev) => [...prev, data]);
              }
            } catch (e) {
              console.error("Failed to parse stream message:", line);
            }
          }
        }
      }
    } catch (error: any) {
      toast.error("An error occurred with the runner stream.");
      setRunnerLogs((prev) => [
        ...prev,
        {
          type: "error",
          message:
            error.message ||
            "Connection to server lost or a critical error occurred.",
        },
      ]);
      setIsRunnerComplete(true);
    } finally {
      setIsRunningGenerator(false);
    }
  };

  const handleSaveTemplate = () =>
    saveTemplateMutation.mutate({
      pageType: selectedPageType,
      language: DEFAULT_LOCALE,
      template: content,
      variableMappings: getMappingsObject(),
    });
  const handleTestGenerator = () =>
    testMutation.mutate({
      pageType: selectedPageType,
      template: content,
      variableMappings: getMappingsObject(),
    });
  const handleAddVariable = () =>
    setVariableMappings([
      ...variableMappings,
      { variable: "", expression: "" },
    ]);
  const handleVariableChange = (
    index: number,
    field: "variable" | "expression",
    value: string
  ) => {
    const newMappings = [...variableMappings];
    newMappings[index][field] = value;
    setVariableMappings(newMappings);
  };
  const handleRemoveVariable = (index: number) =>
    setVariableMappings(variableMappings.filter((_, i) => i !== index));

  const isBusy =
    isRunningGenerator ||
    testMutation.isPending ||
    isLoadingTemplate ||
    saveTemplateMutation.isPending;

  return (
    <div>
      <LogViewerModal
        logs={runnerLogs}
        progress={runnerProgress}
        isOpen={isRunnerModalOpen}
        isComplete={isRunnerComplete}
        onClose={() => setIsRunnerModalOpen(false)}
      />
      <TestResultModal
        result={testResult}
        onClose={() => setTestResult(null)}
      />

      <div className="bg-brand-secondary rounded-lg mb-8 border border-gray-700/50">
        <button
          onClick={() => setIsEditorOpen(!isEditorOpen)}
          className="w-full flex justify-between items-center p-4"
        >
          <h2 className="text-xl font-bold text-white">
            Master Template & Runner
          </h2>
          <ChevronDown
            size={24}
            className={`transition-transform duration-300 ${
              isEditorOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        <div
          className={`grid transition-all duration-300 ease-in-out ${
            isEditorOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="p-4 border-t border-gray-700/50 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-brand-dark/50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-brand-light mb-2">
                    1. Select Page Type
                  </label>
                  <select
                    value={selectedPageType}
                    onChange={(e) => setSelectedPageType(e.target.value)}
                    className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
                  >
                    {PAGE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="bg-brand-dark/50 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-brand-light mb-2">
                    2. Define Variables (from `apiResponse`)
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                    {variableMappings.map((mapping, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="variable_name"
                          value={mapping.variable}
                          onChange={(e) =>
                            handleVariableChange(
                              index,
                              "variable",
                              e.target.value
                            )
                          }
                          className="w-1/3 p-1 rounded bg-gray-800 text-white border border-gray-600 text-sm font-mono"
                        />
                        <span className="text-gray-500">=</span>
                        <input
                          type="text"
                          placeholder="e.g., apiResponse.standings[0].length"
                          value={mapping.expression}
                          onChange={(e) =>
                            handleVariableChange(
                              index,
                              "expression",
                              e.target.value
                            )
                          }
                          className="flex-grow p-1 rounded bg-gray-800 text-white border border-gray-600 text-sm font-mono"
                        />
                        <button
                          onClick={() => handleRemoveVariable(index)}
                          className="text-red-500 hover:text-red-400"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleAddVariable}
                    className="flex items-center gap-2 text-xs text-brand-purple font-semibold mt-2 hover:text-brand-purple/80"
                  >
                    <PlusCircle size={14} /> Add Variable
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-light mb-2">
                  3. Write master template (in {DEFAULT_LOCALE.toUpperCase()})
                </label>
                {isLoadingTemplate ? (
                  <div className="min-h-[200px] flex items-center justify-center rounded-lg bg-brand-dark">
                    <Loader2
                      size={32}
                      className="animate-spin text-brand-muted"
                    />
                  </div>
                ) : (
                  <RichTextEditor value={content} onChange={setContent} />
                )}
              </div>
              <div className="flex items-center justify-end gap-2 md:gap-4 pt-4 border-t border-gray-700/50">
                <button
                  onClick={handleSaveTemplate}
                  disabled={isBusy}
                  className="flex items-center gap-2 bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saveTemplateMutation.isPending ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Save size={20} />
                  )}
                  <span>Save Template</span>
                </button>
                <button
                  onClick={handleTestGenerator}
                  disabled={isBusy}
                  className="flex items-center gap-2 bg-gray-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50"
                >
                  {testMutation.isPending ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <TestTube2 size={20} />
                  )}
                  <span>Test</span>
                </button>
                <button
                  onClick={handleRunGenerator}
                  disabled={isBusy}
                  className="flex items-center gap-2 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isRunningGenerator ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Play size={20} />
                  )}
                  <span>
                    {isRunningGenerator ? `Processing...` : "Save & Run All"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SeoContentList
        pageType={selectedPageType}
        languages={initialLanguages}
        contentItems={contentItems || []}
        isLoading={isLoadingContent}
      />
    </div>
  );
}
