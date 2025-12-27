"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { ProviderConfig } from "@/lib/db/schema";
import { Shield, Key } from "lucide-react";

export interface ProviderSettings {
  openrouterKey?: string;
  deepinfraKey?: string;
}

interface GlobalSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSettingsModal({
  open,
  onOpenChange,
}: GlobalSettingsModalProps) {
  const [openrouterKey, setOpenrouterKey] = useState<string>("");
  const [deepinfraKey, setDeepinfraKey] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadProviderConfigs();
    }
  }, [open]);

  const loadProviderConfigs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/providers/config", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to load provider settings");
      }

      const configs: ProviderConfig[] = await response.json();

      const openrouterConfig = configs.find((c) => c.provider === "openrouter");
      const deepinfraConfig = configs.find((c) => c.provider === "deepinfra");

      setOpenrouterKey(openrouterConfig?.apiKey || "");
      setDeepinfraKey(deepinfraConfig?.apiKey || "");
    } catch (error) {
      console.error("Error loading provider configs:", error);
      toast.error("Failed to load provider settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const promises: Promise<Response>[] = [];

      if (openrouterKey) {
        promises.push(
          fetch("/api/providers/config", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              provider: "openrouter",
              apiKey: openrouterKey,
            }),
          })
        );
      }

      if (deepinfraKey) {
        promises.push(
          fetch("/api/providers/config", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              provider: "deepinfra",
              apiKey: deepinfraKey,
            }),
          })
        );
      }

      const results = await Promise.all(promises);
      const allSuccess = results.every((r) => r.ok);

      if (allSuccess) {
        toast.success("API keys saved successfully");
        onOpenChange(false);
      } else {
        throw new Error("Failed to save some API keys");
      }
    } catch (error) {
      console.error("Error saving provider settings:", error);
      toast.error("Failed to save API keys");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Global Settings
          </DialogTitle>
          <DialogDescription>
            Configure API keys for AI model providers
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid gap-6 py-4">
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Key className="h-4 w-4" />
                Provider API Keys
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Store API keys securely for accessing AI models. Keys are encrypted at rest.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="openrouter-key">
                  OpenRouter API Key
                </Label>
                <Input
                  id="openrouter-key"
                  type="password"
                  placeholder="sk-or-..."
                  value={openrouterKey}
                  onChange={(e) => setOpenrouterKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Get your key from {" "}
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    openrouter.ai/keys
                  </a>
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="deepinfra-key">
                  DeepInfra API Key
                </Label>
                <Input
                  id="deepinfra-key"
                  type="password"
                  placeholder="di-..."
                  value={deepinfraKey}
                  onChange={(e) => setDeepinfraKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Get your key from {" "}
                  <a
                    href="https://deepinfra.com/dash/api_keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    deepinfra.com/dash/api_keys
                  </a>
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-yellow-600/20 bg-yellow-600/10 p-4">
              <h4 className="text-sm font-semibold text-yellow-600 dark:text-yellow-500">
                Security Note
              </h4>
              <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-400">
                Your API keys are stored securely and only used to make requests on your behalf.
                Never share your API keys with others.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save API Keys"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
