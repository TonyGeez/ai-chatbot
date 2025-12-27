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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { ChatModel } from "@/lib/ai/models";
import { chatModels, modelsByProvider } from "@/lib/ai/models";

export interface ChatSettings {
  model: string;
  systemInstruction: string;
  temperature: string;
}

interface ChatSettingsModalProps {
  chatId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSettings?: Partial<ChatSettings>;
}

export function ChatSettingsModal({
  chatId,
  open,
  onOpenChange,
  currentSettings,
}: ChatSettingsModalProps) {
  const [model, setModel] = useState<string>(currentSettings?.model || chatModels[0].id);
  const [systemInstruction, setSystemInstruction] = useState<string>(
    currentSettings?.systemInstruction || ""
  );
  const [temperature, setTemperature] = useState<string>(
    currentSettings?.temperature || "0.7"
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && currentSettings) {
      setModel(currentSettings.model || chatModels[0].id);
      setSystemInstruction(currentSettings.systemInstruction || "");
      setTemperature(currentSettings.temperature || "0.7");
    }
  }, [open, currentSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/chat/${chatId}/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          systemInstruction,
          temperature,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      toast.success("Chat settings saved successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving chat settings:", error);
      toast.error("Failed to save chat settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chat Settings</DialogTitle>
          <DialogDescription>
            Configure model and parameters for this chat
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="model">Model</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger id="model">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                {Object.entries(modelsByProvider).map(([provider, models]) => (
                  <div key={provider}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      {provider.charAt(0).toUpperCase() + provider.slice(1)}
                    </div>
                    {models.map((m: ChatModel) => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex flex-col">
                          <span>{m.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {m.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="system-instruction">System Instruction</Label>
            <Textarea
              id="system-instruction"
              placeholder="Enter system instructions (optional)..."
              value={systemInstruction}
              onChange={(e) => setSystemInstruction(e.target.value)}
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              Custom instructions that guide the AI's behavior for this chat
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="temperature">Temperature</Label>
            <Select value={temperature} onValueChange={setTemperature}>
              <SelectTrigger id="temperature">
                <SelectValue placeholder="Select temperature" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0.1">0.1 - Very focused and deterministic</SelectItem>
                <SelectItem value="0.3">0.3 - More focused and consistent</SelectItem>
                <SelectItem value="0.5">0.5 - Balanced</SelectItem>
                <SelectItem value="0.7">0.7 - Creative and varied (default)</SelectItem>
                <SelectItem value="0.9">0.9 - Very creative and diverse</SelectItem>
                <SelectItem value="1.0">1.0 - Maximum creativity</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Controls randomness: Lower is more focused, higher is more creative
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
