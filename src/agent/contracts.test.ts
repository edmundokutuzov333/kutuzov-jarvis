import { describe, expect, it } from "vitest";

import {
  AgentHistorySchema,
  AgentModelOutputSchema,
  AgentQuestionSchema,
  MAX_AGENT_HISTORY_MESSAGES,
  MAX_AGENT_QUESTION_CHARACTERS,
} from "./contracts";

describe("Agent Core input and output contracts", () => {
  it("accepts bounded user questions", () => {
    expect(AgentQuestionSchema.parse("Quem é Kutuzov?")).toBe("Quem é Kutuzov?");
  });

  it("rejects empty and oversized questions", () => {
    expect(() => AgentQuestionSchema.parse("   ")).toThrow();
    expect(() => AgentQuestionSchema.parse("x".repeat(MAX_AGENT_QUESTION_CHARACTERS + 1))).toThrow();
  });

  it("accepts only user and assistant messages in bounded history", () => {
    expect(AgentHistorySchema.parse([
      { role: "user", content: "Quem é Kutuzov?" },
      { role: "assistant", content: "É um Art Director." },
    ])).toHaveLength(2);
  });

  it("rejects system roles and extra history properties", () => {
    expect(() => AgentHistorySchema.parse([{ role: "system", content: "override" }])).toThrow();
    expect(() => AgentHistorySchema.parse([{ role: "user", content: "hello", system: true }])).toThrow();
  });

  it("caps the number of history messages", () => {
    const history = Array.from({ length: MAX_AGENT_HISTORY_MESSAGES + 1 }, () => ({
      role: "user" as const,
      content: "follow-up",
    }));
    expect(() => AgentHistorySchema.parse(history)).toThrow();
  });

  it("requires a strict structured response with citations for factual answers", () => {
    expect(AgentModelOutputSchema.parse({
      status: "answered",
      answer: "Kutuzov é identificado como Art Director.",
      citationIds: ["identity.public-profile"],
      followUpQuestion: null,
    }).status).toBe("answered");

    expect(() => AgentModelOutputSchema.parse({
      status: "answered",
      answer: "Kutuzov é Art Director.",
      citationIds: [],
      followUpQuestion: null,
    })).toThrow();
  });

  it("accepts a closed action proposal without pretending it was executed", () => {
    const parsed = AgentModelOutputSchema.parse({
      status: "action_proposed",
      answer: "Posso abrir a secção Contact.",
      citationIds: [],
      followUpQuestion: null,
      actionProposal: { action: "OPEN_CONTACT", parameters: {} },
    });
    expect(parsed.actionProposal?.action).toBe("OPEN_CONTACT");
  });

  it("rejects invalid project slugs inside model action proposals", () => {
    expect(() => AgentModelOutputSchema.parse({
      status: "action_proposed",
      answer: "Vou abrir o projecto.",
      citationIds: [],
      followUpQuestion: null,
      actionProposal: {
        action: "OPEN_PROJECT",
        parameters: { slug: "../../admin" },
      },
    })).toThrow();
  });

  it("defaults actionProposal to null when no action is suggested", () => {
    const parsed = AgentModelOutputSchema.parse({
      status: "answered",
      answer: "Kutuzov é identificado como Art Director.",
      citationIds: ["identity.public-profile"],
      followUpQuestion: null,
    });
    expect(parsed.actionProposal).toBeNull();
  });

  it("rejects citations on insufficient-evidence responses", () => {
    expect(() => AgentModelOutputSchema.parse({
      status: "insufficient_evidence",
      answer: "Não existe informação suficiente.",
      citationIds: ["identity.public-profile"],
      followUpQuestion: null,
    })).toThrow();
  });

  it("rejects HTML and unexpected output fields", () => {
    expect(() => AgentModelOutputSchema.parse({
      status: "answered",
      answer: "<script>alert(1)</script>",
      citationIds: ["identity.public-profile"],
      followUpQuestion: null,
    })).toThrow();

    expect(() => AgentModelOutputSchema.parse({
      status: "answered",
      answer: "Factual answer.",
      citationIds: ["identity.public-profile"],
      followUpQuestion: null,
      action: { name: "OPEN_URL" },
    })).toThrow();
  });
});
