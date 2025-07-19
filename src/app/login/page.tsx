"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Get error from URL, provide a default message for common cases
  const [error, setError] = useState(() => {
    const err = searchParams.get("error");
    if (err === "Forbidden") {
      return "Access Denied. You must be an administrator.";
    }
    return err || "";
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError("Invalid credentials. Please try again.");
    } else if (result?.ok) {
      // Redirect to the intended page or default to the admin dashboard
      const callbackUrl = searchParams.get("callbackUrl") || "/admin/dashboard";
      router.push(callbackUrl);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-brand-dark">
      <form
        onSubmit={handleSubmit}
        className="p-8 rounded-lg shadow-lg bg-brand-secondary w-full max-w-sm"
      >
        <h1 className="text-2xl font-bold mb-6 text-center text-white">
          Admin Login
        </h1>
        {error && (
          <p className="bg-red-500/20 text-red-400 p-3 rounded mb-4 text-sm">
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
            className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="w-full p-3 rounded bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-purple"
          />
        </div>
        <button
          type="submit"
          className="w-full mt-6 bg-brand-purple text-white font-bold py-3 rounded-lg hover:opacity-90 transition-opacity"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
