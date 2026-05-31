import { NextResponse } from "next/server";
import { getAuthCookieNames } from "@/lib/auth";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url), 303);
  const cookieNames = getAuthCookieNames();

  response.cookies.delete(cookieNames.accessTokenCookie);
  response.cookies.delete(cookieNames.refreshTokenCookie);

  return response;
}
