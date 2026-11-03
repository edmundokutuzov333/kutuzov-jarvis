import { describe, expect, it } from "vitest";

import type { ConversationMessage } from "../domain/conversation";
import {
  MAX_PERSISTED_MESSAGES,
  MEMORY_RETENTION_DAYS,
  getRetentionCutoff,
  toAgentHistory,
} from "./policy";
import { MAX_STORED_MESSAGES_PER_SESSION, MAX_STORED_SESSIONS } from "./contracts";

function makeMessages(total: number): ConversationMessage[] {
  return Array.from({ length: total }, (_, index) => ({
    id: "message-" + index,
    role: index % 2 === 0 ? "user" : "assistant",
    content: "message " + index,
    createdAt: index + 1,
  }));
}

describe("local memory policy", () => {
  it("keeps only the six most recent turns for Agent Core", () => {
    const history = toAgentHistory(makeMessages(9));

    expect(history).toHaveLength(6);
    expect(history[0]?.content).toBe("message 3");
    expect(history[5]?.content).toBe("message 8");
  });

  it("bounds each persisted message to the Agent Core history budget", () => {
    const messages = [{
      id: "message-long",
      role: "user" as const,
      content: "x".repeat(2_000),
      createdAt: 1,
    }];

    const history = toAgentHistory(messages);

    expect(history[0]?.content).toHaveLength(500);
  });

  it("has a finite upper bound for sessions and stored messages", () => {
    expect(MAX_STORED_SESSIONS).toBe(20);
    expect(MAX_STORED_MESSAGES_PER_SESSION).toBe(100);
    expect(MAX_PERSISTED_MESSAGES).toBe(2_000);
  });

  it("calculates the 90-day retention cutoff", () => {
    const now = 2_000_000_000_000;

    expect(MEMORY_RETENTION_DAYS).toBe(90);
    expect(getRetentionCutoff(now)).toBe(now - 90 * 24 * 60 * 60 * 1_000);
  });
});
