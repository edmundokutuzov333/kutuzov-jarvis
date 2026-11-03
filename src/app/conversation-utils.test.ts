import { describe, expect, it } from "vitest";

import {
  buildDeterministicFallback,
  resolveDeterministicAction,
} from "./conversation-utils";

describe("deterministic conversation fallback", () => {
  it("returns a closed action for project navigation", () => {
    expect(resolveDeterministicAction("Mostra os projectos")).toEqual({
      action: "SHOW_PROJECTS",
      parameters: {},
    });
  });

  it("maps a recognised discipline to the allowlisted project filter", () => {
    expect(resolveDeterministicAction("Filtra projectos de Campaign Design")).toEqual({
      action: "FILTER_PROJECTS",
      parameters: { category: "Campaign Design" },
    });
  });

  it("opens a project only when its slug is in the action schema allowlist", () => {
    expect(resolveDeterministicAction("Abre o projecto Diga YES")).toEqual({
      action: "OPEN_PROJECT",
      parameters: { slug: "diga-yes" },
    });
  });

  it("does not invent an action for an unknown command", () => {
    expect(resolveDeterministicAction("Envia uma mensagem para Kutuzov")).toBeNull();
  });

  it("returns public references for deterministic search", () => {
    const result = buildDeterministicFallback("Quais são os projectos?");
    expect(result.mode).toBe("search");
    expect(result.references.length).toBeGreaterThan(0);
    expect(result.references.every((reference) => reference.recordId.startsWith("project."))).toBe(true);
    expect(result.projects.length).toBeGreaterThan(0);
  });

  it("does not claim an AI response when there is no evidence", () => {
    const result = buildDeterministicFallback("Qual é o nome do animal de estimação privado?");
    expect(result.references).toHaveLength(0);
    expect(result.answer).toContain("não encontrei informação");
  });
});
