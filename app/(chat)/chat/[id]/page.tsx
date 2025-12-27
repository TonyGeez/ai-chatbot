import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

import { auth } from "@/app/(auth)/auth";
import { Chat } from "@/components/chat";
import { DataStreamHandler } from "@/components/data-stream-handler";
import { DEFAULT_CHAT_MODEL } from "@/lib/ai/models";
import { getChatById, getChatWithSettings, getMessagesByChatId } from "@/lib/db/queries";
import { convertToUIMessages } from "@/lib/utils";
import type { ChatSettings } from "@/components/chat-settings-modal";

export default function Page(props: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="flex h-dvh" />}>
      <ChatPage params={props.params} />
    </Suspense>
  );
}

async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chat = await getChatWithSettings({ id });

  if (!chat) {
    redirect("/");
  }

  const session = await auth();

  if (!session) {
    redirect("/api/auth/guest");
  }

  if (chat.visibility === "private") {
    if (!session.user) {
      return notFound();
    }

    if (session.user.id !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  const uiMessages = convertToUIMessages(messagesFromDb);

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get("chat-model");

  // Use chat-specific model if set, otherwise use cookie, otherwise use default
  const chatModel = chat.model || (chatModelFromCookie?.value) || DEFAULT_CHAT_MODEL;

  const chatSettings: Partial<ChatSettings> = {
    model: chat.model || undefined,
    systemInstruction: chat.systemInstruction || undefined,
    temperature: chat.temperature || undefined,
  };

  return (
    <>
      <Chat
        autoResume={true}
        id={chat.id}
        initialChatModel={chatModel}
        initialMessages={uiMessages}
        initialVisibilityType={chat.visibility}
        isReadonly={session?.user?.id !== chat.userId}
        initialSettings={chatSettings}
      />
      <DataStreamHandler />
    </>
  );
}
