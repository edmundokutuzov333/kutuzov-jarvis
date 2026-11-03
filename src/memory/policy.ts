import {
  MAX_AGENT_HISTORY_MESSAGES,
  MAX_AGENT_HISTORY_MESSAGE_CHARACTERS,
  type AgentHistoryMessage,
} from "../agent/contracts";
import type { ConversationMessage } from "../domain/conversation";
import { MAX_STORED_MESSAGES_PER_SESSION, MAX_STORED_SESSIONS } from "./contracts";

export const MEMORY_RETENTION_DAYS = 90;
export const MAX_PERSISTED_MESSAGES =
  MAX_STORED_SESSIONS * MAX_STORED_MESSAGES_PER_SESSION;

export function toAgentHistory(
  messages: readonly ConversationMessage[],
): AgentHistoryMessage[] {
  return messages
    .slice(-MAX_AGENT_HISTORY_MESSAGES)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, MAX_AGENT_HISTORY_MESSAGE_CHARACTERS),
    }));
}

export function getRetentionCutoff(now = Date.now()): number {
  return now - MEMORY_RETENTION_DAYS * 24 * 60 * 60 * 1_000;
}
