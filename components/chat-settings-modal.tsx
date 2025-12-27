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
  maxTokens?: string;
  topP?: string;
  topK?: string;
  presencePenalty?: string;
  frequencyPenalty?: string;
  seed?: string;
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
  const [maxTokens, setMaxTokens] = useState<string>(currentSettings?.maxTokens || "");
  const [topP, setTopP] = useState<string>(currentSettings?.topP || "");
  const [topK, setTopK] = useState<string>(currentSettings?.topK || "");
  const [presencePenalty, setPresencePenalty] = useState<string>(currentSettings?.presencePenalty || "");
  const [frequencyPenalty, setFrequencyPenalty] = useState<string>(currentSettings?.frequencyPenalty || "");
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

          <div className="grid gap-2">
            <Label htmlFor="max-tokens">Max Tokens</Label>
            <Input
              id="max-tokens"
              type="number"
              placeholder="Optional - max tokens to generate"
              value={maxTokens}
              onChange={(e) => setMaxTokens(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Maximum number of tokens to generate (optional)
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="top-p">Top P</Label>
            <Input
              id="top-p"
              type="number"
              step="0.01"
              min="0"
              max="1"
              placeholder="0.0 - 1.0 (optional)"
              value={topP}
              onChange={(e) => setTopP(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Nucleus sampling: 0.1 = only top 10% probability mass (optional)
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="top-k">Top K</Label>
            <Input
              id="top-k"
              type="number"
              min="1"
              placeholder="Optional"
              value={topK}
              onChange={(e) => setTopK(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Only sample from top K options (removes low probability responses)
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="presence-penalty">Presence Penalty</Label>
            <Input
              id="presence-penalty"
              type="number"
              step="0.1"
              placeholder="-2.0 to 2.0 (optional)"
              value={presencePenalty}
              onChange={(e) => setPresencePenalty(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Positive values penalize new tokens based on whether they appear in the text so far
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="frequency-penalty">Frequency Penalty</Label>
            <Input
              id="frequency-penalty"
              type="number"
              step="0.1"
              placeholder="-2.0 to 2.0 (optional)"
              value={frequencyPenalty}
              onChange={(e) => setFrequencyPenalty(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Positive values penalize new tokens based on their frequency in the text so far
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="seed">Seed</Label>
            <Input
              id="seed"
              type="number"
              placeholder="Optional - for deterministic results"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Set a seed for reproducible/deterministic results
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
