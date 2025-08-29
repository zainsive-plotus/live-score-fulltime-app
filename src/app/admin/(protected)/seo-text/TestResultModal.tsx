"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";

interface TestResultModalProps {
  result: any;
  onClose: () => void;
}

export default function TestResultModal({
  result,
  onClose,
}: TestResultModalProps) {
  const isOpen = !!result;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-brand-secondary p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-xl font-bold leading-6 text-white mb-4"
                >
                  Test Result for:{" "}
                  <span className="text-brand-purple">
                    {result?.testEntityName}
                  </span>
                </Dialog.Title>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Extracted Variables */}
                  <div className="bg-brand-dark/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">
                      Extracted Variables
                    </h4>
                    <div className="font-mono text-xs text-gray-300 space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                      {result?.extractedVariables &&
                        Object.entries(result.extractedVariables).map(
                          ([key, value]) => (
                            <div key={key} className="grid grid-cols-3 gap-2">
                              <span className="text-brand-muted truncate col-span-1">
                                {key}:
                              </span>
                              <span className="text-white col-span-2 break-all">
                                {JSON.stringify(value)}
                              </span>
                            </div>
                          )
                        )}
                    </div>
                  </div>

                  {/* HTML Preview */}
                  <div className="bg-brand-dark/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">
                      Generated HTML Preview
                    </h4>
                    <div
                      className="prose prose-sm prose-invert max-w-none text-text-secondary leading-relaxed max-h-96 overflow-y-auto custom-scrollbar"
                      dangerouslySetInnerHTML={{
                        __html: result?.generatedHtml || "",
                      }}
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-brand-purple px-4 py-2 text-sm font-medium text-white hover:bg-brand-purple/80 focus:outline-none"
                    onClick={onClose}
                  >
                    Got it, thanks!
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
