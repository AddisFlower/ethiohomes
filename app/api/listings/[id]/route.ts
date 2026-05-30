import { NextResponse } from "next/server";
import { deleteListing, updateListing } from "@/lib/listings";

const currentAgentId = "agent-1";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const listing = await updateListing(id, formData, currentAgentId);

    return NextResponse.json({ listing });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update listing.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // TODO: Replace this hard delete with soft delete if listing recovery is needed.
    await deleteListing(id, currentAgentId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to delete listing.",
      },
      { status: 500 }
    );
  }
}
