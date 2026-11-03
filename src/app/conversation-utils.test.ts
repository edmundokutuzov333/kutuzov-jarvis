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

  it("shows retrieved public facts in the deterministic response", () => {
    const result = buildDeterministicFallback("Quem é Kutuzov?");
    expect(result.answer).toContain("Art Director");
    expect(result.references.some((reference) => reference.recordId === "identity.public-profile")).toBe(true);
  });

  it("does not retrieve a public profile just because a private-data question names Kutuzov", () => {
    const result = buildDeterministicFallback(
      "Qual é a morada residencial privada e o número de telefone pessoal de Kutuzov?",
    );
    expect(result.references).toHaveLength(0);
    expect(result.projects).toHaveLength(0);
    expect(result.answer).toContain("não encontrei informação");
  });

  it("allows a direct identity question to retrieve only public identity records", () => {
    const result = buildDeterministicFallback("Quem é Kutuzov?");
    expect(result.references.length).toBeGreaterThan(0);
    expect(result.references.every((reference) =>
      reference.recordId.startsWith("identity."),
    )).toBe(true);
  });

  it("does not claim an AI response when there is no evidence", () => {
    const result = buildDeterministicFallback("Qual é o nome do animal de estimação privado?");
    expect(result.references).toHaveLength(0);
    expect(result.answer).toContain("não encontrei informação");
  });
});
