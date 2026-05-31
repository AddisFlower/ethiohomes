"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setError("");
    setSuccess("");
    setLoading(true);

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: String(formData.get("email") ?? ""),
      }),
    });

    setLoading(false);
    const result = await response.json();

    if (!response.ok) {
      setError(result.error ?? "Please try again.");
      return;
    }

    setSuccess(result.message ?? "Password reset email sent.");
    form.reset();
  }

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-6">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-4xl font-bold text-black mb-3">
          Reset Password
        </h1>

        <p className="text-gray-600 mb-8">
          Enter your account email and we will send a password reset link.
        </p>

        {error && (
          <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
            <p className="font-semibold">Reset email failed.</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
            <p className="font-semibold">Check your email.</p>
            <p className="text-sm">{success}</p>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <Link
          href="/login"
          className="mt-6 inline-block text-emerald-700 hover:text-emerald-800 font-semibold"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
