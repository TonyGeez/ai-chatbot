import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import dotenv from "dotenv";
import { isTestEnvironment } from "../constants";
import { getProviderApiKey } from "../db/queries";
import type { ProviderType } from "../providers";

dotenv.config();

const THINKING_SUFFIX_REGEX = /-thinking$/;

// Default API key from environment as fallback
const DEFAULT_API_KEY = process.env.OPENROUTER_API_KEY;

export const myProvider = isTestEnvironment
  ? (() => {
      const {
        artifactModel,
        chatModel,
        reasoningModel,
        titleModel,
      } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : null;

function createOpenRouterClient(apiKey: string | null | undefined) {
  const key = apiKey || DEFAULT_API_KEY;
  if (!key) {
    throw new Error(
      "OpenRouter API key is missing. Please configure your API key in settings."
    );
  }
  return createOpenRouter({
    apiKey: key,
  });
}

export async function getLanguageModel(
  modelId: string,
  userId: string,
  provider: ProviderType = "openrouter"
) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId);
  }

  const apiKey = await getProviderApiKey(userId, provider);
  const openrouter = createOpenRouterClient(apiKey);

  const isReasoningModel =
    modelId.includes("reasoning") || modelId.endsWith("-thinking");

  if (isReasoningModel) {
    const gatewayModelId = modelId.replace(THINKING_SUFFIX_REGEX, "");

    return wrapLanguageModel({
      model: openrouter.chat(gatewayModelId),
      middleware: extractReasoningMiddleware({ tagName: "thinking" }),
    });
  }

  return openrouter.languageModel(modelId);
}

export async function getTitleModel(userId: string, provider: ProviderType = "openrouter") {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }
  const apiKey = await getProviderApiKey(userId, provider);
  const openrouter = createOpenRouterClient(apiKey);
  return openrouter.languageModel("xiaomi/mimo-v2-flash:free");
}

export async function getArtifactModel(userId: string, provider: ProviderType = "openrouter") {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("artifact-model");
  }
  const apiKey = await getProviderApiKey(userId, provider);
  const openrouter = createOpenRouterClient(apiKey);
  return openrouter.languageModel("xiaomi/mimo-v2-flash:free");
}
