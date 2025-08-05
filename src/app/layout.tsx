// ===== src/app/layout.tsx =====
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // The suppressHydrationWarning prop was already on <html> in your [locale] layout,
    // but the error is on <body> which is here in the root layout.
    <html suppressHydrationWarning={true}>
      <body
        className="bg-background text-text-primary"
        suppressHydrationWarning={true} // <-- ADD THIS LINE
      >
        {children}
      </body>
    </html>
  );
}
