import { NextResponse } from "next/server";
import { canUseAgentFeatures, getAppSession } from "@/lib/auth";
import { deleteListing, updateListing } from "@/lib/listings";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAppSession();

    if (!canUseAgentFeatures(session) || !session.user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const { id } = await params;
    const formData = await request.formData();
    const listing = await updateListing(id, formData, session.user.id);

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
    const session = await getAppSession();

    if (!canUseAgentFeatures(session) || !session.user) {
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    }

    const { id } = await params;
    // TODO: Replace this hard delete with soft delete if listing recovery is needed.
    await deleteListing(id, session.user.id);

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
