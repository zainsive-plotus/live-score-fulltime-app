"use client"; // This component will be used in client-side code

import { sendGAEvent } from "@next/third-parties/google";

// Define an interface for your GA event properties
interface GAEvent {
  action: string;
  category: string;
  label?: string; // label is optional
  value?: number; // value is optional
}

export const trackEvent = ({ action, category, label, value }: GAEvent) => {
  sendGAEvent({ event: action, value: { category, label, value } });
};
