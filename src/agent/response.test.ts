import { describe, expect, it } from "vitest";

import { buildKnowledgeContext } from "../knowledge/context";
import { searchKnowledge } from "../knowledge/search";
import { parseAgentModelOutput } from "./response";

describe("structured Agent Core response validation", () => {
  const knowledge = buildKnowledgeContext("Diga YES", searchKnowledge("Diga YES"));
  const valid = {
    status: "answered",
    answer: "Diga YES & Viva o Mundo Online é um projecto publicado de 2026.",
    citationIds: ["project.diga-yes"],
    followUpQuestion: null,
  };

  it("accepts JSON and maps citation IDs to trusted references", () => {
    const response = parseAgentModelOutput(JSON.stringify(valid), knowledge);

    expect(response.status).toBe("answered");
    expect(response.references[0]?.recordId).toBe("project.diga-yes");
    expect(response.references[0]?.path).toBe("docs/PORTFOLIO-DATA-AUDIT.md");
  });

  it("rejects malformed JSON and surrounding prose", () => {
    expect(() => parseAgentModelOutput("{broken", knowledge)).toThrow();
    expect(() => parseAgentModelOutput("Here is the answer: " + JSON.stringify(valid), knowledge)).toThrow();
  });

  it("rejects citations not in the retrieved public reference set", () => {
    expect(() => parseAgentModelOutput(JSON.stringify({
      ...valid,
      citationIds: ["client.not-retrieved"],
    }), knowledge)).toThrow(/fonte que não foi recuperada/i);
  });

  it("rejects factual claims without citations", () => {
    expect(() => parseAgentModelOutput(JSON.stringify({
      ...valid,
      citationIds: [],
    }), knowledge)).toThrow();
  });

  it("rejects unknown navigation actions and arbitrary parameters", () => {
    const emptyKnowledge = buildKnowledgeContext("Abre Contact", []);
    const invalidOutputs = [
      {
        ...valid,
        status: "action_proposed",
        citationIds: [],
        actionProposal: { action: "DELETE_DATABASE", parameters: {} },
      },
      {
        ...valid,
        status: "action_proposed",
        citationIds: [],
        actionProposal: {
          action: "OPEN_PROJECT",
          parameters: { slug: "diga-yes", url: "javascript:alert(1)" },
        },
      },
      { ...valid, unexpectedInstruction: "execute arbitrary code" },
    ];
    for (const output of invalidOutputs) {
      expect(() => parseAgentModelOutput(JSON.stringify(output), emptyKnowledge)).toThrow();
    }
  });

  it("returns an action proposal as an inert suggestion", () => {
    const emptyKnowledge = buildKnowledgeContext("Abre Contact", []);
    const output = {
      status: "action_proposed",
      answer: "Posso abrir a secção Contact.",
      citationIds: [],
      followUpQuestion: null,
      actionProposal: { action: "OPEN_CONTACT", parameters: {} },
    };
    const response = parseAgentModelOutput(JSON.stringify(output), emptyKnowledge);

    expect(response.status).toBe("action_proposed");
    expect(response.actionProposal?.action).toBe("OPEN_CONTACT");
    expect(response.references).toEqual([]);
  });

  it("rejects oversized output and invalid markup", () => {
    expect(() => parseAgentModelOutput("x".repeat(12_001), knowledge)).toThrow();
    expect(() => parseAgentModelOutput(JSON.stringify({
      ...valid,
      answer: "<img src=x onerror=alert(1)>",
    }), knowledge)).toThrow();
  });
});
