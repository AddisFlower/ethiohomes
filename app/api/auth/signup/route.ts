import { NextResponse } from "next/server";
import { getFriendlyAuthError, logAuthError } from "@/lib/auth-errors";
import { getAuthCookieNames } from "@/lib/auth";
import {
  getSupabaseConfig,
  serviceRoleSupabaseRequest,
} from "@/lib/supabase";

type SignupBody = {
  agencyName?: string;
  email?: string;
  fullName?: string;
  password?: string;
};

type SignupResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  user?: {
    id: string;
  };
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

    const body = (await request.json()) as SignupBody;
    const email = body.email?.trim();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const authResponse = await fetch(`${config.authUrl}/signup`, {
      method: "POST",
      headers: {
        apikey: config.anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        data: {
          agency_name: body.agencyName?.trim() ?? "",
          full_name: body.fullName?.trim() ?? "",
        },
      }),
    });

    if (!authResponse.ok) {
      const message = await authResponse.text();
      logAuthError("signup failed", message);

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

    const result = (await authResponse.json()) as SignupResponse;

    if (!result.user?.id) {
      logAuthError("signup missing user", JSON.stringify(result));

      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 400 }
      );
    }

    await serviceRoleSupabaseRequest("/profiles?on_conflict=id", {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        id: result.user.id,
        full_name: body.fullName?.trim() || email,
        agency_name: body.agencyName?.trim() || null,
        role: "agent",
      }),
    });

    const response = NextResponse.json({ ok: true });

    if (!result.access_token || !result.refresh_token || !result.expires_in) {
      return NextResponse.json({
        ok: true,
        needsLogin: true,
        message:
          "Account was created, but Supabase did not return an immediate session. Please sign in with the same email and password.",
      });
    }

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
      "signup exception",
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
