import { NextResponse } from "next/server";
import { updateListingPhoto } from "@/lib/listings";

const currentAgentId = "agent-1";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const listing = await updateListingPhoto(id, formData, currentAgentId);

    return NextResponse.json({ listing });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update listing photo.",
      },
      { status: 500 }
    );
  }
}
