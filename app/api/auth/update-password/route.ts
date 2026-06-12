import { NextResponse } from "next/server";
import { getFriendlyAuthError, logAuthError } from "@/lib/auth-errors";
import { getAuthCookieNames } from "@/lib/auth";
import { getSupabaseConfig } from "@/lib/supabase";

type UpdatePasswordBody = {
  accessToken?: string;
  password?: string;
  refreshToken?: string;
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

    const body = (await request.json()) as UpdatePasswordBody;
    const accessToken = body.accessToken?.trim();
    const refreshToken = body.refreshToken?.trim();
    const password = body.password ?? "";

    if (!accessToken || !password) {
      return NextResponse.json(
        { error: "Recovery token and new password are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const updateResponse = await fetch(`${config.authUrl}/user`, {
      method: "PUT",
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    if (!updateResponse.ok) {
      const message = await updateResponse.text();
      logAuthError("update password failed", message);

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

    const response = NextResponse.json({ ok: true });
    const cookieNames = getAuthCookieNames();

    response.cookies.set(cookieNames.accessTokenCookie, accessToken, {
      httpOnly: true,
      maxAge: 60 * 60,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    if (refreshToken) {
      response.cookies.set(cookieNames.refreshTokenCookie, refreshToken, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    return response;
  } catch (error) {
    logAuthError(
      "update password exception",
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
