"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

function getRecoveryTokens() {
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const searchParams = new URLSearchParams(window.location.search);

  return {
    accessToken:
      hashParams.get("access_token") ?? searchParams.get("access_token") ?? "",
    refreshToken:
      hashParams.get("refresh_token") ?? searchParams.get("refresh_token") ?? "",
    type: hashParams.get("type") ?? searchParams.get("type") ?? "",
  };
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [recoveryTokens, setRecoveryTokens] = useState<{
    accessToken: string;
    refreshToken: string;
    type: string;
  } | null>(null);
  const [hasCheckedRecovery, setHasCheckedRecovery] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [linkError, setLinkError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setRecoveryTokens(getRecoveryTokens());
    setHasCheckedRecovery(true);
  }, []);

  useEffect(() => {
    if (!hasCheckedRecovery) {
      return;
    }

    if (!recoveryTokens?.accessToken) {
      setLinkError(
        "Password reset token is missing or expired. Please request a new reset link."
      );
      return;
    }

    setLinkError("");
  }, [hasCheckedRecovery, recoveryTokens]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!recoveryTokens?.accessToken) {
      setLinkError(
        "Password reset token is missing or expired. Please request a new reset link."
      );
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    setSubmitError("");

    if (password !== confirmPassword) {
      setSubmitError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const response = await fetch("/api/auth/update-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        accessToken: recoveryTokens.accessToken,
        password,
        refreshToken: recoveryTokens.refreshToken,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const result = await response.json();
      setSubmitError(result.error ?? "Please try again.");
      return;
    }

    setSuccess(true);
    window.history.replaceState(null, "", "/reset-password");
    window.setTimeout(() => {
      router.push("/my-listings");
      router.refresh();
    }, 1200);
  }

  return (
    <main className="min-h-screen bg-gray-100 py-12 px-6">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-4xl font-bold text-black mb-3">
          Set New Password
        </h1>

        <p className="text-gray-600 mb-8">
          Enter a new password for your EthioMLS account.
        </p>

        {!hasCheckedRecovery && (
          <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-700">
            <p className="font-semibold">Checking reset link.</p>
            <p className="text-sm">
              Verifying your password reset link before showing the form.
            </p>
          </div>
        )}

        {hasCheckedRecovery && submitError && (
          <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
            <p className="font-semibold">Password could not be updated.</p>
            <p className="text-sm">{submitError}</p>
          </div>
        )}

        {hasCheckedRecovery && recoveryTokens?.accessToken && success && (
          <div className="mb-6 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
            <p className="font-semibold">Password updated.</p>
            <p className="text-sm">Taking you to My Listings...</p>
          </div>
        )}

        {hasCheckedRecovery && recoveryTokens?.accessToken ? (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-black font-semibold mb-2">
                New Password
              </label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                disabled={success}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black disabled:bg-gray-100"
                placeholder="New password"
              />
            </div>

            <div>
              <label className="block text-black font-semibold mb-2">
                Confirm Password
              </label>
              <input
                name="confirmPassword"
                type="password"
                required
                minLength={6}
                disabled={success}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-black disabled:bg-gray-100"
                placeholder="Confirm password"
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        ) : null}

        {hasCheckedRecovery && (!recoveryTokens?.accessToken || linkError) && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
            <p className="font-semibold">Invalid or expired reset link.</p>
            <p className="text-sm">
              {linkError ||
                "Please request a new password reset email and try again."}
            </p>
          </div>
        )}

        <Link
          href="/forgot-password"
          className="mt-6 inline-block text-emerald-700 hover:text-emerald-800 font-semibold"
        >
          Request a new reset link
        </Link>
      </div>
    </main>
  );
}
