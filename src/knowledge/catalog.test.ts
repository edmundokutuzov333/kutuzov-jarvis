import { describe, expect, it } from "vitest";

import {
  KNOWLEDGE_CATALOG,
  KNOWLEDGE_RECORD_COUNT,
} from "./catalog";
import { KnowledgeCatalogSchema } from "./schema";

describe("Kutuzov knowledge catalog", () => {
  it("validates the versioned public snapshot", () => {
    expect(KnowledgeCatalogSchema.parse(KNOWLEDGE_CATALOG)).toEqual(KNOWLEDGE_CATALOG);
    expect(KNOWLEDGE_CATALOG.snapshotDate).toBe("2026-11-02");
    expect(KNOWLEDGE_CATALOG.sourceDocument).toBe("docs/PORTFOLIO-DATA-AUDIT.md");
  });

  it("contains the expected audited portfolio snapshot counts", () => {
    const count = (kind: string) =>
      KNOWLEDGE_CATALOG.records.filter((record) => record.kind === kind).length;

    expect(count("project")).toBe(4);
    expect(count("client")).toBe(20);
    expect(count("experience")).toBe(5);
    expect(count("service")).toBe(5);
    expect(count("skill")).toBe(5);
    expect(count("discipline")).toBe(3);
    expect(count("principle")).toBe(4);
    expect(count("process_step")).toBe(4);
    expect(count("metric")).toBe(5);
    expect(KNOWLEDGE_RECORD_COUNT).toBe(63);
  });

  it("attributes every record to the audited source", () => {
    for (const record of KNOWLEDGE_CATALOG.records) {
      expect(["docs/PORTFOLIO-DATA-AUDIT.md", "docs/PUBLIC-SOURCES-AUDIT.md"]).toContain(record.source.path);
      expect(["2026-11-02", "2026-11-03"]).toContain(record.source.capturedAt);
      expect(record.id.length).toBeGreaterThan(2);
    }
  });

  it("never presents editorial guardrails as published facts", () => {
    const guardrails = KNOWLEDGE_CATALOG.records.filter(
      (record) => record.visibility === "internal_guardrail",
    );

    expect(guardrails.length).toBe(4);
    expect(guardrails.every((record) => !record.published)).toBe(true);
    expect(guardrails.every((record) => record.verification === "pending_editorial")).toBe(true);
  });

  it("does not claim an individual role for any of the four published projects", () => {
    const projects = KNOWLEDGE_CATALOG.records.filter((record) => record.kind === "project");

    expect(projects).toHaveLength(4);
    expect(projects.every((record) => record.metadata.roleConfirmed === false)).toBe(true);
    expect(projects.every((record) => !/his role was art direction/i.test(record.content))).toBe(true);
  });

  it("keeps the published biography unresolved", () => {
    const biography = KNOWLEDGE_CATALOG.records.find(
      (record) => record.id === "limitation.biography-pending",
    );

    expect(biography).toBeDefined();
    expect(biography?.visibility).toBe("internal_guardrail");
    expect(biography?.published).toBe(false);
  });

  it("rejects duplicate ids", () => {
    expect(() =>
      KnowledgeCatalogSchema.parse({
        ...KNOWLEDGE_CATALOG,
        records: [...KNOWLEDGE_CATALOG.records, KNOWLEDGE_CATALOG.records[0]],
      }),
    ).toThrow();
  });
});
