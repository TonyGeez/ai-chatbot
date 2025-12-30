"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import type { ChatModel } from "@/lib/ai/models";
import { chatModels, modelsByProvider } from "@/lib/ai/models";

export type ChatSettings = {
  model: string;
  systemInstruction: string;
  temperature: string;
  maxTokens?: string;
  topP?: string;
  topK?: string;
  presencePenalty?: string;
  frequencyPenalty?: string;
  seed?: string;
};

type ChatSettingsModalProps = {
  chatId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSettings?: Partial<ChatSettings>;
};

export function ChatSettingsModal({
  chatId,
  open,
  onOpenChange,
  currentSettings,
}: ChatSettingsModalProps) {
  const [model, setModel] = useState<string>(
    currentSettings?.model || chatModels[0].id
  );
  const [systemInstruction, setSystemInstruction] = useState<string>(
    currentSettings?.systemInstruction || ""
  );
  const [temperature, setTemperature] = useState<string>(
    currentSettings?.temperature || "0.7"
  );
  const [maxTokens, setMaxTokens] = useState<string>(
    currentSettings?.maxTokens || ""
  );
  const [topP, setTopP] = useState<string>(currentSettings?.topP || "");
  const [topK, setTopK] = useState<string>(currentSettings?.topK || "");
  const [presencePenalty, setPresencePenalty] = useState<string>(
    currentSettings?.presencePenalty || ""
  );
  const [frequencyPenalty, setFrequencyPenalty] = useState<string>(
    currentSettings?.frequencyPenalty || ""
  );
  const [seed, setSeed] = useState<string>(currentSettings?.seed || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && currentSettings) {
      setModel(currentSettings.model || chatModels[0].id);
      setSystemInstruction(currentSettings.systemInstruction || "");
      setTemperature(currentSettings.temperature || "0.7");
      setMaxTokens(currentSettings.maxTokens || "");
      setTopP(currentSettings.topP || "");
      setTopK(currentSettings.topK || "");
      setPresencePenalty(currentSettings.presencePenalty || "");
      setFrequencyPenalty(currentSettings.frequencyPenalty || "");
      setSeed(currentSettings.seed || "");
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
          maxTokens,
          topP,
          topK,
          presencePenalty,
          frequencyPenalty,
          seed,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      toast.success("Chat settings saved successfully");
      onOpenChange(false);
      // Refresh to reload settings from database
      window.location.reload();
    } catch (error) {
      console.error("Error saving chat settings:", error);
      toast.error("Failed to save chat settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Chat Settings</DialogTitle>
          <DialogDescription>
            Configure model and parameters for this chat
          </DialogDescription>
        </DialogHeader>

        <div className="grid flex-1 gap-6 overflow-y-auto px-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="model">Model</Label>
            <Select onValueChange={setModel} value={model}>
              <SelectTrigger id="model">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent className="max-h-[400px]">
                {Object.entries(modelsByProvider).map(([provider, models]) => (
                  <div key={provider}>
                    <div className="px-2 py-1.5 font-semibold text-muted-foreground text-xs">
                      {provider.charAt(0).toUpperCase() + provider.slice(1)}
                    </div>
                    {models.map((m: ChatModel) => (
                      <SelectItem key={m.id} value={m.id}>
                        <div className="flex flex-col">
                          <span>{m.name}</span>
                          <span className="text-muted-foreground text-xs">
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
              onChange={(e) => setSystemInstruction(e.target.value)}
              placeholder="Enter system instructions (optional)..."
              rows={6}
              value={systemInstruction}
            />
            <p className="text-muted-foreground text-xs">
              Custom instructions that guide the AI's behavior for this chat
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="max-tokens">Max Tokens</Label>
              <Input
                id="max-tokens"
                onChange={(e) => setMaxTokens(e.target.value)}
                placeholder="Optional"
                type="number"
                value={maxTokens}
              />
              <p className="text-muted-foreground text-xs">
                Maximum tokens to generate
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="top-k">Top K</Label>
              <Input
                id="top-k"
                min="1"
                onChange={(e) => setTopK(e.target.value)}
                placeholder="Optional"
                type="number"
                value={topK}
              />
              <p className="text-muted-foreground text-xs">
                Sample from top K options
              </p>
            </div>{" "}
            <div className="grid gap-2">
              <Label htmlFor="top-p">Top P: {topP || "Not set"}</Label>
              <Slider
                className="w-full"
                id="top-p"
                max={1}
                min={0}
                onValueChange={(value) => setTopP(value[0].toString())}
                step={0.01}
                value={[Number.parseFloat(topP || "0")]}
              />
              <p className="text-muted-foreground text-xs">
                Nucleus sampling parameter
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="temperature">Temperature: {temperature}</Label>
              <Slider
                className="w-full"
                id="temperature"
                max={1}
                min={0}
                onValueChange={(value) => setTemperature(value[0].toString())}
                step={0.1}
                value={[Number.parseFloat(temperature)]}
              />
              <p className="text-muted-foreground text-xs">
                Lower is focused, higher is creative
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="presence-penalty">
                Presence Penalty: {presencePenalty || "Not set"}
              </Label>
              <Slider
                className="w-full"
                id="presence-penalty"
                max={2}
                min={-2}
                onValueChange={(value) =>
                  setPresencePenalty(value[0].toString())
                }
                step={0.1}
                value={[Number.parseFloat(presencePenalty || "0")]}
              />
              <p className="text-muted-foreground text-xs">
                Penalize repeated topics
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="frequency-penalty">
                Frequency Penalty: {frequencyPenalty || "Not set"}
              </Label>
              <Slider
                className="w-full"
                id="frequency-penalty"
                max={2}
                min={-2}
                onValueChange={(value) =>
                  setFrequencyPenalty(value[0].toString())
                }
                step={0.1}
                value={[Number.parseFloat(frequencyPenalty || "0")]}
              />
              <p className="text-muted-foreground text-xs">
                Penalize token frequency
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t px-6 pt-4 pb-6">
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button disabled={isSaving} onClick={handleSave}>
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
