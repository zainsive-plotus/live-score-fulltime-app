// This type definition helps with TypeScript autocompletion
declare global {
  interface Window {
    gtag: (
      command: "event",
      action: string,
      params: { [key: string]: any }
    ) => void;
  }
}

/**
 * Sends a custom event to Google Analytics.
 * This function safely checks if the `gtag` function is available on the window object
 * before attempting to send an event. This prevents errors if GA hasn't loaded yet.
 *
 * @param {string} action - The name of the event (e.g., 'casino_partner_click').
 * @param {object} params - An object of event parameters (e.g., { partner_name: 'Example Casino' }).
 */
export const sendGAEvent = (action: string, params: { [key: string]: any }) => {
  if (typeof window.gtag === "function") {
    window.gtag("event", action, params);
  }
};
