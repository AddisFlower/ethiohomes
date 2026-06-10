import { NextResponse } from "next/server";
import { getFriendlyAuthError, logAuthError } from "@/lib/auth-errors";
import { getAuthCookieNames } from "@/lib/auth";
import { getSupabaseConfig } from "@/lib/supabase";

type LoginBody = {
  email?: string;
  password?: string;
};

type LoginResponse = {
  access_token: string;
  expires_in: number;
  refresh_token: string;
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

    const body = (await request.json()) as LoginBody;
    const email = body.email?.trim();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const authResponse = await fetch(
      `${config.authUrl}/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          apikey: config.key,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      }
    );

    if (!authResponse.ok) {
      const message = await authResponse.text();
      logAuthError("login failed", message);

      return NextResponse.json(
        {
          error: getFriendlyAuthError(
            message,
            "Invalid email or password. Please try again."
          ),
        },
        { status: 401 }
      );
    }

    const result = (await authResponse.json()) as LoginResponse;

    const response = NextResponse.json({ ok: true });
    const cookieNames = getAuthCookieNames();

    response.cookies.set(cookieNames.accessTokenCookie, result.access_token, {
      httpOnly: true,
      maxAge: result.expires_in,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    response.cookies.set(cookieNames.refreshTokenCookie, result.refresh_token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    logAuthError(
      "login exception",
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
