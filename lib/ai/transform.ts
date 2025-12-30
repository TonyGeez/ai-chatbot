import { TextStreamPart } from "ai";
import type { ToolSet } from "ai";

export function typedTextTransform<TOOLS extends ToolSet>() {
  return ({ stopStream }: { stopStream: () => void }) => {
    let lastChunkTime = 0;
    const MIN_DELAY_MS = 20; // Minimum delay between chunks in milliseconds

    return new TransformStream<TextStreamPart<TOOLS>, TextStreamPart<TOOLS>>({
      async transform(chunk, controller) {
        const now = Date.now();
        const timeSinceLastChunk = now - lastChunkTime;

        // If this is a text chunk and not enough time has passed, add delay
        if (chunk.type === "text" && timeSinceLastChunk < MIN_DELAY_MS) {
          const delay = MIN_DELAY_MS - timeSinceLastChunk;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        controller.enqueue(chunk);
        lastChunkTime = Date.now();
      },

      async flush(controller) {
        // Ensure any remaining data is sent
        controller.terminate();
      },
    });
  };
}
