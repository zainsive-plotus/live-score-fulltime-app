// ===== src/components/NewsSidebar.tsx =====

import React from "react";
// We will import the dynamic components in a new client wrapper
import NewsSidebarClientContent from "./NewsSidebarClientContent";

export default function NewsSidebar({
  children,
}: {
  children?: React.ReactNode;
}) {
  return (
    // This is now a simple layout container
    <aside className="space-y-8 lg:sticky lg:top-8">
      {children}
      {/* All dynamic and client-side content is moved to its own component */}
      <NewsSidebarClientContent />
    </aside>
  );
}
