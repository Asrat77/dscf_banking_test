"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { loginWithCoreAuth } from "@/lib/api";
import { saveAccessToken } from "@/lib/auth";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthReady, isAuthenticated } = useAuthGuard({
    requireAuth: false,
    redirectIfAuthed: "/",
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const response = await loginWithCoreAuth({
      email_or_phone: email.trim(),
      password,
    });

    setIsSubmitting(false);

    if (!response.success) {
      setError(response.error);
      return;
    }

    saveAccessToken(response.data.access_token);
    router.push("/");
  };

  if (!isAuthReady || isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--bg-app)] px-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--border-panel)] bg-[var(--bg-panel)] p-6 shadow-card">
        <h1 className="text-xl font-semibold text-workbench-900">Sign in</h1>
        <p className="text-sm text-workbench-500 mt-1 mb-6">Use your core account credentials to continue.</p>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-workbench-700 mb-1">
              Email or phone
            </label>
            <input
              id="email"
              type="text"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-workbench-300 bg-white px-3 py-2 text-sm text-workbench-900 focus:outline-none focus:ring-2 focus:ring-action/30"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-workbench-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-workbench-300 bg-white px-3 py-2 text-sm text-workbench-900 focus:outline-none focus:ring-2 focus:ring-action/30"
              required
            />
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
