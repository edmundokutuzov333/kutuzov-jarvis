import { searchKnowledge } from "../knowledge/search";

export interface KnowledgeBenchmarkCase {
  id: string;
  question: string;
  expectedPublicFactIds: readonly string[];
  expectedConstraintIds?: readonly string[];
  expectNoPublicEvidence?: boolean;
}

/**
 * Retrieval-only corpus based on the audited 2026-11-02 public snapshot.
 * It measures lexical retrieval and editorial guardrails, not LLM output quality.
 */
export const KNOWLEDGE_BENCHMARK_CASES: readonly KnowledgeBenchmarkCase[] = [
  { id: "profile-role", question: "Qual é o cargo principal de Edmundo Kutuzov?", expectedPublicFactIds: ["identity.public-profile"] },
  { id: "published-positioning", question: "Qual é o posicionamento publicado de Kutuzov?", expectedPublicFactIds: ["identity.published-positioning"] },
  { id: "current-experience", question: "Qual é a experiência de Kutuzov na WEBMASTERS Limitada?", expectedPublicFactIds: ["experience.webmasters"] },
  { id: "published-project", question: "Quais são o cliente, o ano e a disciplina do projecto Diga YES?", expectedPublicFactIds: ["project.diga-yes"] },
  { id: "client-relationship", question: "Toyota Moçambique consta como cliente ou marca?", expectedPublicFactIds: ["client.toyota"] },
  { id: "service", question: "Que serviço de direcção de arte está publicado?", expectedPublicFactIds: ["service.art-direction"] },
  { id: "skill-value", question: "Qual é a pontuação publicada de Adobe Photoshop?", expectedPublicFactIds: ["skill.photoshop"] },
  { id: "portfolio-metric", question: "Que métrica de projectos é apresentada no portefólio?", expectedPublicFactIds: ["metric.projects"] },
  {
    id: "unconfirmed-project-role",
    question: "Qual foi o papel individual de Kutuzov no projecto Diga YES?",
    expectedPublicFactIds: ["project.diga-yes"],
    expectedConstraintIds: ["limitation.project-roles-unconfirmed"],
  },
  { id: "unsupported-award", question: "Que prémio Pulitzer ganhou?", expectedPublicFactIds: [], expectNoPublicEvidence: true },
  { id: "private-personal-data", question: "Qual é a morada residencial privada e o número de telefone pessoal?", expectedPublicFactIds: [], expectNoPublicEvidence: true },
] as const;

export interface KnowledgeBenchmarkResult {
  id: string;
  retrievedIds: string[];
  retrievedConstraintIds: string[];
  missingFactIds: string[];
  missingConstraintIds: string[];
  unexpectedPublicEvidence: boolean;
  passed: boolean;
}

export interface KnowledgeBenchmarkMetrics {
  totalCases: number;
  passedCases: number;
  failedCases: number;
  casePassRate: number;
  expectedFacts: number;
  retrievedExpectedFacts: number;
  factRecall: number;
  expectedConstraints: number;
  retrievedExpectedConstraints: number;
  constraintRecall: number;
  unsupportedCases: number;
  unsupportedFalsePositiveCases: number;
}

export function runKnowledgeBenchmarkCase(
  item: KnowledgeBenchmarkCase,
): KnowledgeBenchmarkResult {
  const results = searchKnowledge(item.question, { limit: 12, minScore: 1 });
  const retrievedIds = results
    .filter((result) => result.record.visibility === "public_fact")
    .map((result) => result.record.id);
  const retrievedConstraintIds = results
    .filter((result) => result.record.visibility === "internal_guardrail")
    .map((result) => result.record.id);

  const missingFactIds = item.expectedPublicFactIds.filter((id) => !retrievedIds.includes(id));
  const expectedConstraints = item.expectedConstraintIds ?? [];
  const missingConstraintIds = expectedConstraints.filter((id) => !retrievedConstraintIds.includes(id));
  const unexpectedPublicEvidence = item.expectNoPublicEvidence === true && retrievedIds.length > 0;

  return {
    id: item.id,
    retrievedIds,
    retrievedConstraintIds,
    missingFactIds,
    missingConstraintIds,
    unexpectedPublicEvidence,
    passed: missingFactIds.length === 0 &&
      missingConstraintIds.length === 0 &&
      !unexpectedPublicEvidence,
  };
}

export function runKnowledgeBenchmark(
  cases: readonly KnowledgeBenchmarkCase[] = KNOWLEDGE_BENCHMARK_CASES,
): KnowledgeBenchmarkResult[] {
  return cases.map(runKnowledgeBenchmarkCase);
}

export function calculateKnowledgeBenchmarkMetrics(
  cases: readonly KnowledgeBenchmarkCase[],
  results: readonly KnowledgeBenchmarkResult[],
): KnowledgeBenchmarkMetrics {
  const expectedFacts = cases.reduce((sum, item) => sum + item.expectedPublicFactIds.length, 0);
  const retrievedExpectedFacts = cases.reduce((sum, item) => {
    const result = results.find((candidate) => candidate.id === item.id);
    return sum + item.expectedPublicFactIds.filter((id) => result?.retrievedIds.includes(id)).length;
  }, 0);
  const expectedConstraints = cases.reduce((sum, item) => sum + (item.expectedConstraintIds?.length ?? 0), 0);
  const retrievedExpectedConstraints = cases.reduce((sum, item) => {
    const result = results.find((candidate) => candidate.id === item.id);
    return sum + (item.expectedConstraintIds ?? []).filter((id) => result?.retrievedConstraintIds.includes(id)).length;
  }, 0);
  const unsupportedCases = cases.filter((item) => item.expectNoPublicEvidence === true);
  const unsupportedFalsePositiveCases = results.filter((result) => result.unexpectedPublicEvidence).length;
  const passedCases = results.filter((result) => result.passed).length;

  return {
    totalCases: cases.length,
    passedCases,
    failedCases: cases.length - passedCases,
    casePassRate: cases.length === 0 ? 1 : passedCases / cases.length,
    expectedFacts,
    retrievedExpectedFacts,
    factRecall: expectedFacts === 0 ? 1 : retrievedExpectedFacts / expectedFacts,
    expectedConstraints,
    retrievedExpectedConstraints,
    constraintRecall: expectedConstraints === 0 ? 1 : retrievedExpectedConstraints / expectedConstraints,
    unsupportedCases: unsupportedCases.length,
    unsupportedFalsePositiveCases,
  };
}
