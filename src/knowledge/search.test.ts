import { describe, expect, it } from "vitest";

import { searchKnowledge } from "./search";

describe("lexical knowledge retrieval", () => {
  it("normalizes accents and retrieves art direction", () => {
    const results = searchKnowledge("direcção de arte", { limit: 10 });
    const ids = results.map((result) => result.record.id);

    expect(ids).toContain("service.art-direction");
    expect(ids).toContain("discipline.core");
  });

  it("finds a published project by its title", () => {
    const result = searchKnowledge("Diga YES", { limit: 3 })[0];

    expect(result?.record.id).toBe("project.diga-yes");
    expect(result?.record.metadata.client).toBe("Webmasters / YES");
  });

  it("finds clients by their public names", () => {
    const result = searchKnowledge("Toyota Moçambique", {
      kinds: ["client"],
      limit: 2,
    });

    expect(result[0]?.record.id).toBe("client.toyota");
  });

  it("finds experience by organisation", () => {
    const result = searchKnowledge("trabalhou na Imperial Seguros", {
      kinds: ["experience"],
      limit: 2,
    });

    expect(result[0]?.record.id).toBe("experience.imperial");
  });

  it("finds skills and their portfolio-published values", () => {
    const result = searchKnowledge("Adobe Photoshop", {
      kinds: ["skill"],
      limit: 2,
    });

    expect(result[0]?.record.metadata.score).toBe(95);
    expect(result[0]?.record.metadata.level).toBe("Core");
  });

  it("retrieves the editorial restriction when asked about a project role", () => {
    const results = searchKnowledge("qual foi o papel no projecto Diga YES", { limit: 10 });

    expect(results.some((result) => result.record.id === "limitation.project-roles-unconfirmed")).toBe(true);
    expect(results.some((result) => result.record.id === "project.diga-yes")).toBe(true);
  });

  it("returns no results when the catalog has no supporting evidence", () => {
    expect(searchKnowledge("Pulitzer Prize winner")).toEqual([]);
  });

  it("does not return anything for an empty or stop-word-only query", () => {
    expect(searchKnowledge("   ")).toEqual([]);
    expect(searchKnowledge("quem é o")).toEqual([]);
  });

  it("respects result limits and kind filters", () => {
    const results = searchKnowledge("marcas", { kinds: ["client"], limit: 4 });

    expect(results).toHaveLength(4);
    expect(results.every((result) => result.record.kind === "client")).toBe(true);
  });
});
