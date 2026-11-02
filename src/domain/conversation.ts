import { z } from "zod";

export const MAX_MESSAGE_CHARACTERS = 2_000;

export const ConversationRoleSchema = z.enum(["user", "assistant"]);

export const ConversationMessageSchema = z
  .object({
    id: z.string().trim().min(1).max(128),
    role: ConversationRoleSchema,
    content: z.string().trim().min(1).max(MAX_MESSAGE_CHARACTERS),
    createdAt: z.number().int().nonnegative(),
  })
  .strict();

export type ConversationRole = z.infer<typeof ConversationRoleSchema>;
export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;
