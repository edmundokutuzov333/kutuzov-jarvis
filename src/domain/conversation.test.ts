import { describe, expect, it } from "vitest";

import {
  ConversationMessageSchema,
  MAX_MESSAGE_CHARACTERS,
} from "./conversation";

const validMessage = {
  id: "message-001",
  role: "user",
  content: "Who is Kutuzov?",
  createdAt: 1_793_520_000_000,
} as const;

describe("ConversationMessageSchema", () => {
  it("accepts a valid user message", () => {
    expect(ConversationMessageSchema.parse(validMessage)).toEqual(validMessage);
  });

  it("trims surrounding whitespace from message content", () => {
    const parsed = ConversationMessageSchema.parse({
      ...validMessage,
      content: "  Tell me about the work.  ",
    });

    expect(parsed.content).toBe("Tell me about the work.");
  });

  it("rejects empty or whitespace-only messages", () => {
    expect(() =>
      ConversationMessageSchema.parse({ ...validMessage, content: "   " }),
    ).toThrow();
  });

  it("rejects content longer than the configured limit", () => {
    expect(() =>
      ConversationMessageSchema.parse({
        ...validMessage,
        content: "x".repeat(MAX_MESSAGE_CHARACTERS + 1),
      }),
    ).toThrow();
  });

  it("rejects roles outside the public conversation contract", () => {
    expect(() =>
      ConversationMessageSchema.parse({
        ...validMessage,
        role: "system",
      }),
    ).toThrow();
  });

  it("rejects additional fields instead of silently accepting them", () => {
    expect(() =>
      ConversationMessageSchema.parse({
        ...validMessage,
        metadata: { source: "untrusted" },
      }),
    ).toThrow();
  });
});
