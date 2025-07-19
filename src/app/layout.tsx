// ===== src/app/layout.tsx =====

import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning={true}>
      {/* 
        Add suppressHydrationWarning here as well.
        This tells React to ignore attribute mismatches on the body tag,
        which are often caused by browser extensions and are safe to ignore.
      */}
      <body
        className="bg-background text-text-primary"
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}
