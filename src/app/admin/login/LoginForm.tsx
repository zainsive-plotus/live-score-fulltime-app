// ===== src/app/login/LoginForm.tsx =====

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(() => {
    const err = searchParams.get("error");
    if (err === "Forbidden") {
      return "Access Denied. You must be an administrator to access this page.";
    }
    return err || "";
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        redirect: false, // Important: We handle the redirect manually
        email,
        password,
      });

      if (result?.error) {
        setError("Invalid credentials. Please try again.");
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        // After a successful sign-in, we need to get the user's session to check their role.
        // A common way is to re-trigger a session fetch or simply reload the page and let NextAuth handle it.
        // A simple reload is the most robust way to ensure the session is updated.
        // The router will then redirect based on the role.

        // We'll make a quick API call to get the session data with the role.
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();

        if (session?.user?.role === "admin") {
          const callbackUrl =
            searchParams.get("callbackUrl") || "/admin/dashboard";
          router.push(callbackUrl);
        } else {
          // Non-admin users are redirected to their profile page.
          router.push("/profile");
        }
      }
    } catch (e) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-8 rounded-lg shadow-lg bg-brand-secondary w-full max-w-sm"
    >
      <h1 className="text-2xl font-bold mb-6 text-center text-white">
        Admin Login
      </h1>
      {error && (
        <p className="bg-red-500/20 text-red-400 p-3 rounded mb-4 text-sm text-center">
          {error}
        </p>
      )}
      <div className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          disabled={isLoading}
          className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-secondary focus:ring-brand-purple disabled:opacity-50"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          disabled={isLoading}
          className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-secondary focus:ring-brand-purple disabled:opacity-50"
        />
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full mt-6 bg-brand-purple text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-secondary focus:ring-brand-purple flex items-center justify-center disabled:opacity-70"
      >
        {isLoading && <Loader2 className="animate-spin mr-2" />}
        {isLoading ? "Signing In..." : "Sign In"}
      </button>
    </form>
  );
}
