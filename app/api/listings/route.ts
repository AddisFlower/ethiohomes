import { NextResponse } from "next/server";
import { createListing } from "@/lib/listings";

const currentAgentId = "agent-1";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const listing = await createListing(formData, currentAgentId);

    return NextResponse.json({ listing });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create listing.",
      },
      { status: 500 }
    );
  }
}
