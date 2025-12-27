import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";
import { db } from "@/lib/db/queries";
import { chat } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      model,
      systemInstruction,
      temperature,
      maxTokens,
      topP,
      topK,
      presencePenalty,
      frequencyPenalty,
      seed,
    } = body;

    // Verify the chat belongs to the user
    const existingChat = await db
      .select()
      .from(chat)
      .where(and(eq(chat.id, id), eq(chat.userId, session.user.id)))
      .limit(1);

    if (existingChat.length === 0) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    // Update chat settings
    await db
      .update(chat)
      .set({
        model,
        systemInstruction: systemInstruction?.trim() || null,
        temperature: temperature?.trim() || null,
        maxTokens: maxTokens?.trim() || null,
        topP: topP?.trim() || null,
        topK: topK?.trim() || null,
        presencePenalty: presencePenalty?.trim() || null,
        frequencyPenalty: frequencyPenalty?.trim() || null,
        seed: seed?.trim() || null,
      })
      .where(eq(chat.id, id));

    return NextResponse.json({
      success: true,
      message: "Chat settings updated successfully",
    });
  } catch (error) {
    console.error("Error updating chat settings:", error);
    return NextResponse.json(
      { error: "Failed to update chat settings" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Fetch chat settings
    const chats = await db
      .select({
        model: chat.model,
        systemInstruction: chat.systemInstruction,
        temperature: chat.temperature,
        maxTokens: chat.maxTokens,
        topP: chat.topP,
        topK: chat.topK,
        presencePenalty: chat.presencePenalty,
        frequencyPenalty: chat.frequencyPenalty,
        seed: chat.seed,
      })
      .from(chat)
      .where(and(eq(chat.id, id), eq(chat.userId, session.user.id)))
      .limit(1);

    if (chats.length === 0) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json(chats[0]);
  } catch (error) {
    console.error("Error fetching chat settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat settings" },
      { status: 500 }
    );
  }
}
