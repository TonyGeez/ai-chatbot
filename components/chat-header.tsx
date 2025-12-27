"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useState } from "react";
import { useWindowSize } from "usehooks-ts";
import { SidebarToggle } from "@/components/sidebar-toggle";
import { Button } from "@/components/ui/button";
import { PlusIcon, SettingsIcon } from "./icons";
import { useSidebar } from "./ui/sidebar";
import { VisibilitySelector, type VisibilityType } from "./visibility-selector";
import { ChatSettingsModal } from "./chat-settings-modal";
import type { ChatSettings } from "./chat-settings-modal";

function PureChatHeader({
  chatId,
  selectedVisibilityType,
  isReadonly,
  initialSettings,
}: {
  chatId: string;
  selectedVisibilityType: VisibilityType;
  isReadonly: boolean;
  initialSettings?: Partial<ChatSettings>;
}) {
  const router = useRouter();
  const { open } = useSidebar();
  const { width: windowWidth } = useWindowSize();
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  return (
    <header className="sticky top-0 flex items-center gap-2 border-border border-b bg-background px-2 py-1.5 md:px-2">
      <SidebarToggle />

      {(!open || windowWidth < 768) && (
        <Button
          className="order-2 ml-auto h-8 px-2 md:order-1 md:ml-0 md:h-fit md:px-2"
          onClick={() => {
            router.push("/");
            router.refresh();
          }}
          variant="outline"
        >
          <PlusIcon />
          <span className="md:sr-only">New Chat</span>
        </Button>
      )}

      {!isReadonly && (
        <VisibilitySelector
          chatId={chatId}
          className="order-1 md:order-2"
          selectedVisibilityType={selectedVisibilityType}
        />
      )}

      {!isReadonly && (
        <Button
          variant="outline"
          size="icon"
          className="order-3 h-8 w-8 md:ml-auto"
          onClick={() => setShowSettingsModal(true)}
          title="Chat Settings"
        >
          <SettingsIcon />
        </Button>
      )}

      <ChatSettingsModal
        chatId={chatId}
        open={showSettingsModal}
        onOpenChange={setShowSettingsModal}
        currentSettings={initialSettings}
      />
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return (
    prevProps.chatId === nextProps.chatId &&
    prevProps.selectedVisibilityType === nextProps.selectedVisibilityType &&
    prevProps.isReadonly === nextProps.isReadonly &&
    JSON.stringify(prevProps.initialSettings) === JSON.stringify(nextProps.initialSettings)
  );
});
