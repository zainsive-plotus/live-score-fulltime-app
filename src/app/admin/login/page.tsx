import { Suspense } from "react";
import LoginForm from "./LoginForm";

// Updated skeleton to use theme colors
const LoginFormSkeleton = () => (
  <div className="p-8 rounded-lg shadow-lg bg-brand-secondary w-full max-w-sm animate-pulse">
    <div className="h-8 w-3/4 mx-auto rounded-md bg-gray-700 mb-6"></div>
    <div className="space-y-4">
      <div className="h-12 w-full rounded bg-gray-700"></div>
      <div className="h-12 w-full rounded bg-gray-700"></div>
    </div>
    <div className="h-12 w-full mt-6 rounded-lg bg-brand-purple/50"></div>
  </div>
);

export default function LoginPage() {
  return (
    <html>
      <body>
        <div className="flex items-center justify-center min-h-screen bg-brand-dark">
          <Suspense fallback={<LoginFormSkeleton />}>
            <LoginForm />
          </Suspense>
        </div>
      </body>
    </html>
  );
}
