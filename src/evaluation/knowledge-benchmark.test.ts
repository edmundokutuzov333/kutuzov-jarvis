import { describe, expect, it } from "vitest";

import {
  calculateKnowledgeBenchmarkMetrics,
  KNOWLEDGE_BENCHMARK_CASES,
  runKnowledgeBenchmark,
  runKnowledgeBenchmarkCase,
} from "./knowledge-benchmark";

describe("Kutuzov knowledge evaluation corpus", () => {
  it("retrieves the expected published facts and editorial restrictions", () => {
    const results = runKnowledgeBenchmark();
    const failures = results.filter((result) => !result.passed);
    expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
    expect(results).toHaveLength(KNOWLEDGE_BENCHMARK_CASES.length);
  });

  it("reports deterministic retrieval metrics for the fixed evaluation corpus", () => {
    const results = runKnowledgeBenchmark();
    const metrics = calculateKnowledgeBenchmarkMetrics(KNOWLEDGE_BENCHMARK_CASES, results);
    expect(metrics).toMatchObject({
      totalCases: 11,
      passedCases: 11,
      failedCases: 0,
      casePassRate: 1,
      factRecall: 1,
      constraintRecall: 1,
      unsupportedCases: 2,
      unsupportedFalsePositiveCases: 0,
    });
  });

  it("keeps unsupported awards and private personal data outside public evidence", () => {
    const cases = KNOWLEDGE_BENCHMARK_CASES.filter((item) => item.expectNoPublicEvidence);
    const results = cases.map(runKnowledgeBenchmarkCase);
    expect(results.every((result) => result.retrievedIds.length === 0)).toBe(true);
    expect(results.every((result) => result.passed)).toBe(true);
  });

  it("recovers the project and its internal role restriction without publishing the restriction", () => {
    const item = KNOWLEDGE_BENCHMARK_CASES.find((entry) => entry.id === "unconfirmed-project-role")!;
    const result = runKnowledgeBenchmarkCase(item);
    expect(result.retrievedIds).toContain("project.diga-yes");
    expect(result.retrievedConstraintIds).toContain("limitation.project-roles-unconfirmed");
    expect(result.retrievedIds).not.toContain("limitation.project-roles-unconfirmed");
    expect(result.passed).toBe(true);
  });

  it("uses unique and explicit evaluation case identifiers", () => {
    const ids = KNOWLEDGE_BENCHMARK_CASES.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThanOrEqual(10);
  });
});
