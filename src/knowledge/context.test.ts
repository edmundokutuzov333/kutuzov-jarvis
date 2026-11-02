import { describe, expect, it } from "vitest";

import { buildKnowledgeContext } from "./context";
import { searchKnowledge } from "./search";

describe("compact knowledge context", () => {
  it("includes retrieved facts and traceable source references", () => {
    const results = searchKnowledge("Diga YES", { limit: 5 });
    const context = buildKnowledgeContext("Diga YES", results);

    expect(context.status).toBe("matched");
    expect(context.facts.some((fact) => fact.id === "project.diga-yes")).toBe(true);
    expect(context.references.some((reference) => reference.recordId === "project.diga-yes")).toBe(true);
    expect(context.characterCount).toBe(JSON.stringify({
      version: context.version,
      status: context.status,
      question: context.question,
      facts: context.facts,
      constraints: context.constraints,
      references: context.references,
      truncated: context.truncated,
    }).length);
  });

  it("keeps editorial constraints separate from public evidence", () => {
    const results = searchKnowledge("qual foi o papel no projecto Diga YES", { limit: 10 });
    const context = buildKnowledgeContext("qual foi o papel no projecto Diga YES", results);

    expect(context.facts.some((fact) => fact.id === "project.diga-yes")).toBe(true);
    expect(context.constraints.some((constraint) => constraint.id === "limitation.project-roles-unconfirmed")).toBe(true);
    expect(context.references.some((reference) => reference.recordId === "limitation.project-roles-unconfirmed")).toBe(false);
  });

  it("returns an explicit empty-evidence state for unsupported questions", () => {
    const context = buildKnowledgeContext("Who won a Pulitzer?", []);

    expect(context.status).toBe("insufficient_evidence");
    expect(context.facts).toEqual([]);
    expect(context.references).toEqual([]);
  });

  it("bounds the compact context and reports omitted records", () => {
    const results = searchKnowledge("marcas e clientes", { limit: 12 });
    const context = buildKnowledgeContext("marcas e clientes", results, {
      maxCharacters: 1_100,
      maxRecords: 12,
    });

    expect(context.characterCount).toBeLessThanOrEqual(1_100);
    expect(context.truncated).toBe(true);
  });

  it("never includes more than the configured number of records", () => {
    const results = searchKnowledge("portefólio", { limit: 20 });
    const context = buildKnowledgeContext("portefólio", results, { maxRecords: 3 });

    expect(context.facts.length + context.constraints.length).toBeLessThanOrEqual(3);
  });
});
