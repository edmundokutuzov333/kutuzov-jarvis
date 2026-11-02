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

  it("rejects oversized output and invalid markup", () => {
    expect(() => parseAgentModelOutput("x".repeat(12_001), knowledge)).toThrow();
    expect(() => parseAgentModelOutput(JSON.stringify({
      ...valid,
      answer: "<img src=x onerror=alert(1)>",
    }), knowledge)).toThrow();
  });
});
