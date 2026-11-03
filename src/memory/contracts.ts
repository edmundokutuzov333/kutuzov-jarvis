import { z } from "zod";

import { ConversationMessageSchema } from "../domain/conversation";

export const MEMORY_DATABASE_NAME = "kutuzov-jarvis-conversations";
export const MEMORY_DATABASE_VERSION = 1;
export const MEMORY_SETTINGS_KEY = "history-consent";

export const MAX_STORED_SESSIONS = 20;
export const MAX_STORED_MESSAGES_PER_SESSION = 100;
export const MAX_SESSION_AGE_DAYS = 90;

export const ConversationSessionSchema = z.object({
  id: z.string().min(8).max(128),
  title: z.string().trim().min(1).max(80),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  messageCount: z.number().int().min(0).max(MAX_STORED_MESSAGES_PER_SESSION),
}).strict();

export const ConversationSettingsSchema = z.object({
  id: z.literal(MEMORY_SETTINGS_KEY),
  historyEnabled: z.boolean(),
  updatedAt: z.number().int().nonnegative(),
}).strict();

export const StoredConversationMessageSchema = ConversationMessageSchema.extend({
  sessionId: z.string().min(8).max(128),
}).strict();

export type ConversationSession = z.infer<typeof ConversationSessionSchema>;
export type ConversationSettings = z.infer<typeof ConversationSettingsSchema>;
export type StoredConversationMessage = z.infer<typeof StoredConversationMessageSchema>;
export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;

export type NewConversationMessage = {
  role: ConversationMessage["role"];
  content: string;
  createdAt?: number;
};

export type MemoryStoreErrorCode =
  | "INDEXEDDB_UNAVAILABLE"
  | "DATABASE_OPEN_FAILED"
  | "DATABASE_BLOCKED"
  | "TRANSACTION_FAILED"
  | "MEMORY_DISABLED"
  | "SESSION_NOT_FOUND"
  | "INVALID_MESSAGE";

export class MemoryStoreError extends Error {
  constructor(
    public readonly code: MemoryStoreErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "MemoryStoreError";
  }
}
