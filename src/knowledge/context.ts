import type { KnowledgeEntry, KnowledgeSource } from "./schema";
import type { KnowledgeSearchResult } from "./search";

export const DEFAULT_CONTEXT_MAX_CHARACTERS = 4_500;
export const DEFAULT_CONTEXT_MAX_RECORDS = 6;

export interface KnowledgeContextFact {
  id: string;
  kind: KnowledgeEntry["kind"];
  title: string;
  content: string;
  source: KnowledgeSource;
}

export interface KnowledgeContextConstraint {
  id: string;
  title: string;
  content: string;
  verification: "pending_editorial";
}

export interface KnowledgeContext {
  version: 1;
  status: "matched" | "constraints_only" | "insufficient_evidence";
  question: string;
  facts: KnowledgeContextFact[];
  constraints: KnowledgeContextConstraint[];
  references: Array<{
    recordId: string;
    label: string;
    path: string;
    capturedAt: string;
  }>;
  truncated: boolean;
  characterCount: number;
}

export interface KnowledgeContextOptions {
  maxCharacters?: number;
  maxRecords?: number;
}

function toFact(record: KnowledgeEntry): KnowledgeContextFact {
  return {
    id: record.id,
    kind: record.kind,
    title: record.title,
    content: record.content,
    source: record.source,
  };
}

function toConstraint(record: KnowledgeEntry): KnowledgeContextConstraint {
  return {
    id: record.id,
    title: record.title,
    content: record.content,
    verification: "pending_editorial",
  };
}

function makeContext(
  question: string,
  records: readonly KnowledgeEntry[],
  truncated: boolean,
): KnowledgeContext {
  const facts = records
    .filter((record) => record.visibility === "public_fact")
    .map(toFact);
  const constraints = records
    .filter((record) => record.visibility === "internal_guardrail")
    .map(toConstraint);
  const references = facts.map((fact) => ({
    recordId: fact.id,
    label: fact.title,
    path: fact.source.path,
    capturedAt: fact.source.capturedAt,
  }));

  const base = {
    version: 1 as const,
    status: facts.length > 0
      ? "matched" as const
      : constraints.length > 0
        ? "constraints_only" as const
        : "insufficient_evidence" as const,
    question: question.trim().slice(0, 500),
    facts,
    constraints,
    references,
    truncated,
  };

  return {
    ...base,
    characterCount: JSON.stringify(base).length,
  };
}

export function buildKnowledgeContext(
  question: string,
  results: readonly KnowledgeSearchResult[],
  options: KnowledgeContextOptions = {},
): KnowledgeContext {
  const maxCharacters = Math.max(500, options.maxCharacters ?? DEFAULT_CONTEXT_MAX_CHARACTERS);
  const maxRecords = Math.max(1, Math.min(options.maxRecords ?? DEFAULT_CONTEXT_MAX_RECORDS, 80));
  const candidates = results.slice(0, maxRecords).map((result) => result.record);
  const selected: KnowledgeEntry[] = [];
  let truncated = results.length > candidates.length;

  for (const candidate of candidates) {
    const trial = makeContext(question, [...selected, candidate], true);
    if (trial.characterCount <= maxCharacters - 32) {
      selected.push(candidate);
    } else {
      truncated = true;
    }
  }

  let context = makeContext(question, selected, truncated);

  while (context.characterCount > maxCharacters && selected.length > 0) {
    selected.pop();
    truncated = true;
    context = makeContext(question, selected, truncated);
  }

  return context;
}
