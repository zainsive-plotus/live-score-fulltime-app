// src/config/adSlots.ts

export interface AdSlot {
  id: string; // The unique identifier used in the code and database
  name: string; // A user-friendly name for the admin panel
  description: string; // A hint for the admin
}

// Define all available ad locations in the application
export const AD_SLOTS: AdSlot[] = [
  {
    id: "match_sidebar",
    name: "Match Page Sidebar",
    description:
      "Appears in the right sidebar on the individual match detail page.",
  },
  {
    id: "news_sidebar",
    name: "News Article Sidebar",
    description:
      "Appears in the right sidebar on individual news article pages.",
  },
  {
    id: "homepage_left_sidebar",
    name: "Homepage Left Sidebar",
    description:
      "Appears on the left side of the main content on the homepage. Ideal for vertical ads.",
  },
  {
    id: "homepage_right_sidebar",
    name: "Homepage Right Sidebar",
    description:
      "Appears on the right side of the main content on the homepage. Ideal for vertical ads.",
  },
  {
    id: "homepage_header",
    name: "Homepage Header Banner",
    description:
      "A prominent banner at the top of the homepage (under the header).",
  },
  {
    id: "sticky_footer",
    name: "Sticky Footer Banner",
    description:
      "A banner that sticks to the bottom of the screen on all pages. Ideal for landscape ads (e.g., 728x90).",
  },
];
