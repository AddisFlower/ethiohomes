"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AuthMode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setError("");
    setNotice("");
    setLoading(true);

    const response = await fetch(
      mode === "login" ? "/api/auth/login" : "/api/auth/signup",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agencyName: String(formData.get("agencyName") ?? ""),
          email: String(formData.get("email") ?? ""),
          fullName: String(formData.get("fullName") ?? ""),
          password: String(formData.get("password") ?? ""),
        }),
      }
    );

    setLoading(false);

    if (!response.ok) {
      const result = await response.json();
      setError(result.error ?? "Please try again.");
      return;
    }

    const result = await response.json();

    if (result.needsLogin) {
      setMode("login");
      setNotice(result.message ?? "Account created. Please sign in.");
      return;
    }

    router.push("/my-listings");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-6">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-4xl font-bold text-black mb-3">
          {mode === "login" ? "Sign In" : "Create Agent Account"}
        </h1>

        <p className="text-gray-600 mb-8">
          Use your EthioMLS agent account to manage listings.
        </p>

        {error && (
          <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
            <p className="font-semibold">Authentication failed.</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {notice && (
          <div className="mb-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
            <p className="font-semibold">Account ready.</p>
            <p className="text-sm">{notice}</p>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <>
              <div>
                <label className="block text-black font-semibold mb-2">
                  Full Name
                </label>
                <input
                  name="fullName"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
                  placeholder="Mac Yifru"
                />
              </div>

              <div>
                <label className="block text-black font-semibold mb-2">
                  Agency Name
                </label>
                <input
                  name="agencyName"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
                  placeholder="EthioMLS Realty"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-black font-semibold mb-2">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
              placeholder="agent@example.com"
            />
          </div>

          <div>
            <label className="block text-black font-semibold mb-2">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black"
              placeholder="Password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition"
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-start gap-3 border-t border-gray-200 pt-5">
          {mode === "login" && (
            <Link
              href="/forgot-password"
              className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Forgot password?
            </Link>
          )}

          <button
            type="button"
            onClick={() => {
              setError("");
              setNotice("");
              setMode(mode === "login" ? "signup" : "login");
            }}
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            {mode === "login"
              ? "Need an agent account?"
              : "Already have an account?"}
          </button>
        </div>
      </div>
    </main>
  );
}
