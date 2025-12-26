import Image from "next/image";
import type { ComponentProps, ReactNode } from "react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type ChatSettingsProps = ComponentProps<typeof Dialog>;

export const ChatSettings = (props: ChatSettingsProps) => <Dialog {...props} />;

export type ChatSettingsTriggerProps = ComponentProps<typeof DialogTrigger>;

export const ChatSettingsTrigger = (props: ChatSettingsTriggerProps) => (
  <DialogTrigger {...props} />
);

export type ChatSettingsContentProps = ComponentProps<typeof DialogContent> & {
  title?: ReactNode;
};

export const ChatSettingsContent = ({
  className,
  children,
  title = "Model Selector",
  ...props
}: ChatSettingsContentProps) => (
  <DialogContent className={cn("p-0", className)} {...props}>
    <DialogTitle className="sr-only">{title}</DialogTitle>
    <Command className="**:data-[slot=command-input-wrapper]:h-auto">
      {children}
    </Command>
  </DialogContent>
);

export type ChatSettingsDialogProps = ComponentProps<typeof CommandDialog>;

export const ChatSettingsDialog = (props: ChatSettingsDialogProps) => (
  <CommandDialog {...props} />
);

export type ChatSettingsInputProps = ComponentProps<typeof CommandInput>;

export const ChatSettingsInput = ({
  className,
  ...props
}: ChatSettingsInputProps) => (
  <CommandInput className={cn("h-auto py-3.5", className)} {...props} />
);

export type ChatSettingsListProps = ComponentProps<typeof CommandList>;

export const ChatSettingsList = (props: ChatSettingsListProps) => (
  <CommandList {...props} />
);

export type ChatSettingsEmptyProps = ComponentProps<typeof CommandEmpty>;

export const ChatSettingsEmpty = (props: ChatSettingsEmptyProps) => (
  <CommandEmpty {...props} />
);

export type ChatSettingsGroupProps = ComponentProps<typeof CommandGroup>;

export const ChatSettingsGroup = (props: ChatSettingsGroupProps) => (
  <CommandGroup {...props} />
);

export type ChatSettingsItemProps = ComponentProps<typeof CommandItem>;

export const ChatSettingsItem = (props: ChatSettingsItemProps) => (
  <CommandItem {...props} />
);

export type ChatSettingsShortcutProps = ComponentProps<typeof CommandShortcut>;

export const ChatSettingsShortcut = (props: ChatSettingsShortcutProps) => (
  <CommandShortcut {...props} />
);

export type ChatSettingsSeparatorProps = ComponentProps<
  typeof CommandSeparator
>;

export const ChatSettingsSeparator = (props: ChatSettingsSeparatorProps) => (
  <CommandSeparator {...props} />
);

export type ChatSettingsLogoProps = {
  className?: string;
  provider:
    | "moonshotai-cn"
    | "lucidquery"
    | "moonshotai"
    | "zai-coding-plan"
    | "alibaba"
    | "xai"
    | "vultr"
    | "nvidia"
    | "upstage"
    | "groq"
    | "github-copilot"
    | "mistral"
    | "vercel"
    | "nebius"
    | "deepseek"
    | "alibaba-cn"
    | "google-vertex-anthropic"
    | "venice"
    | "chutes"
    | "cortecs"
    | "github-models"
    | "togetherai"
    | "azure"
    | "baseten"
    | "huggingface"
    | "opencode"
    | "fastrouter"
    | "google"
    | "google-vertex"
    | "cloudflare-workers-ai"
    | "inception"
    | "wandb"
    | "openai"
    | "zhipuai-coding-plan"
    | "perplexity"
    | "openrouter"
    | "zenmux"
    | "v0"
    | "iflowcn"
    | "synthetic"
    | "deepinfra"
    | "zhipuai"
    | "submodel"
    | "zai"
    | "inference"
    | "requesty"
    | "morph"
    | "lmstudio"
    | "anthropic"
    | "aihubmix"
    | "fireworks-ai"
    | "modelscope"
    | "llama"
    | "scaleway"
    | "amazon-bedrock"
    | "cerebras"
    | (string & {});
};

export const ChatSettingsLogo = ({
  provider,
  className,
}: ChatSettingsLogoProps) => (
  <Image
    alt={`${provider} logo`}
    className={cn("size-3 dark:invert", className)}
    height={12}
    src={`https://models.dev/logos/${provider}.svg`}
    unoptimized
    width={12}
  />
);

export type ChatSettingsLogoGroupProps = ComponentProps<"div">;

export const ChatSettingsLogoGroup = ({
  className,
  ...props
}: ChatSettingsLogoGroupProps) => (
  <div
    className={cn(
      "-space-x-1 flex shrink-0 items-center [&>img]:rounded-full [&>img]:bg-background [&>img]:p-px [&>img]:ring-1 dark:[&>img]:bg-foreground",
      className
    )}
    {...props}
  />
);

export type ChatSettingsNameProps = ComponentProps<"span">;

export const ChatSettingsName = ({
  className,
  ...props
}: ChatSettingsNameProps) => (
  <span className={cn("flex-1 truncate text-left", className)} {...props} />
);
