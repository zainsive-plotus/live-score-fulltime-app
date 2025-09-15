"use client";

import { useEffect } from "react";

// This is a "fire-and-forget" function. It sends the data but doesn't block rendering.
const sendReferrerData = async () => {
  // Only run in the browser and only if there's a referrer from a different domain.
  if (
    typeof window === "undefined" ||
    !document.referrer ||
    document.referrer.startsWith(window.location.origin)
  ) {
    return;
  }

  try {
    // Use keepalive to ensure the request is sent even if the user navigates away.
    await fetch("/api/track/referrer-hit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourceUrl: document.referrer,
        landingPage: window.location.pathname + window.location.search,
      }),
      keepalive: true,
    });
  } catch (error) {
    // We log the error to the console but don't bother the user with it.
    console.error("Referrer tracking failed:", error);
  }
};

export default function ReferrerTracker() {
  useEffect(() => {
    // Trigger the tracking logic once when the component mounts.
    sendReferrerData();
  }, []);

  // This component renders nothing to the UI.
  return null;
}
