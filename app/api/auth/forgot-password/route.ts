import { NextResponse } from "next/server";
import { getFriendlyAuthError, logAuthError } from "@/lib/auth-errors";
import { getSupabaseConfig } from "@/lib/supabase";

type ForgotPasswordBody = {
  email?: string;
};

export async function POST(request: Request) {
  try {
    const config = getSupabaseConfig();

    if (!config) {
      return NextResponse.json(
        { error: "Supabase environment variables are not configured." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as ForgotPasswordBody;
    const email = body.email?.trim();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    const redirectTo = new URL("/reset-password", request.url).toString();
    const response = await fetch(
      `${config.authUrl}/recover?redirect_to=${encodeURIComponent(redirectTo)}`,
      {
        method: "POST",
        headers: {
          apikey: config.anonKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      }
    );

    if (!response.ok) {
      const message = await response.text();
      logAuthError("forgot password failed", message);

      return NextResponse.json(
        {
          error: getFriendlyAuthError(
            message,
            "Something went wrong. Please try again."
          ),
        },
        { status: 400 }
      );
    }

    // TODO: Configure custom SMTP and branded production email templates in Supabase.
    return NextResponse.json({
      ok: true,
      message:
        "If an account exists for that email, a password reset link has been sent.",
    });
  } catch (error) {
    logAuthError(
      "forgot password exception",
      error instanceof Error ? error.message : String(error)
    );

    return NextResponse.json(
      {
        error: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}
