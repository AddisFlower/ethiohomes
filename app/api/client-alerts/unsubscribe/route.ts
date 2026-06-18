import { NextResponse } from "next/server";
import { unsubscribeClientAlertByToken } from "@/lib/client-alert-preferences";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await unsubscribeClientAlertByToken(body.token);

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update alert preferences.",
      },
      { status: 400 }
    );
  }
}
