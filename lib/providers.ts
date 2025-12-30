import { db } from "./db";
import { providerConfig } from "./db/schema";
import { eq } from "drizzle-orm";
import type { ProviderConfig } from "./db/schema";

export type ProviderType = "openrouter" | "deepinfra";

export async function getProviderConfig(
  userId: string,
  provider: ProviderType
): Promise<string | undefined> {
  const result = await db
    .select({ apiKey: providerConfig.apiKey })
    .from(providerConfig)
    .where(
      eq(providerConfig.userId, userId) && eq(providerConfig.provider, provider)
    )
    .limit(1);

  return result[0]?.apiKey;
}

export async function saveProviderConfig(
  userId: string,
  provider: ProviderType,
  apiKey: string
): Promise<ProviderConfig> {
  const now = new Date();
  const result = await db
    .insert(providerConfig)
    .values({
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      userId,
      provider,
      apiKey,
    })
    .onConflictDoUpdate({
      target: [providerConfig.userId, providerConfig.provider],
      set: {
        apiKey,
        updatedAt: now,
      },
    })
    .returning();

  return result[0];
}

export async function deleteProviderConfig(
  userId: string,
  provider: ProviderType
): Promise<void> {
  await db
    .delete(providerConfig)
    .where(
      eq(providerConfig.userId, userId) && eq(providerConfig.provider, provider)
    );
}

export async function getAllProviderConfigs(
  userId: string
): Promise<ProviderConfig[]> {
  const result = await db
    .select()
    .from(providerConfig)
    .where(eq(providerConfig.userId, userId));

  return result;
}
