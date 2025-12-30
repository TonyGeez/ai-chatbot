import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { saveProviderConfig, getAllProviderConfigs } from "@/lib/db/queries";
import type { ProviderType } from "@/lib/providers";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { provider, apiKey } = body;

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: "Provider and API key are required" },
        { status: 400 }
      );
    }

    if (provider !== "openrouter" && provider !== "deepinfra") {
      return NextResponse.json(
        { error: "Invalid provider" },
        { status: 400 }
      );
    }

    await saveProviderConfig(session.user.id, provider as ProviderType, apiKey);

    return NextResponse.json({
      success: true,
      message: "Provider configuration saved successfully",
    });
  } catch (error) {
    console.error("Error saving provider config:", error);
    return NextResponse.json(
      { error: "Failed to save provider configuration" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const configs = await getAllProviderConfigs(session.user.id);

    return NextResponse.json(configs);
  } catch (error) {
    console.error("Error fetching provider configs:", error);
    return NextResponse.json(
      { error: "Failed to fetch provider configurations" },
      { status: 500 }
    );
  }
}
