import { KNOWLEDGE_CATALOG } from "./catalog";
import type { KnowledgeEntry, KnowledgeKind } from "./schema";

export interface KnowledgeSearchOptions {
  limit?: number;
  minScore?: number;
  kinds?: readonly KnowledgeKind[];
}

export interface KnowledgeSearchResult {
  record: KnowledgeEntry;
  score: number;
  matchedTerms: string[];
}

const STOP_WORDS = new Set([
  "a", "as", "ao", "aos", "com", "como", "da", "das", "de", "do", "dos",
  "e", "em", "entre", "era", "essa", "esse", "esta", "este", "eu", "foi",
  "for", "me", "na", "nas", "no", "nos", "o", "os", "ou", "para", "por",
  "que", "qual", "quais", "quem", "se", "sem", "sobre", "sua", "suas",
  "the", "this", "that", "to", "was", "what", "which", "who", "with", "and",
  "is", "are", "of", "in", "on", "his", "her", "their", "at", "by",
]);

const QUERY_SYNONYMS: Record<string, readonly string[]> = {
  biografia: ["biography", "bio", "about"],
  biography: ["biografia", "bio", "about"],
  competencias: ["skills", "capabilities"],
  competencia: ["skills", "capabilities"],
  skills: ["competencias", "capabilities"],
  empresas: ["experience", "career", "organization"],
  empresa: ["experience", "career", "organization"],
  experiencia: ["experience", "career"],
  experiencias: ["experience", "career"],
  clientes: ["clients", "brands"],
  cliente: ["clients", "brands"],
  marcas: ["brands", "clients"],
  marca: ["brands", "clients"],
  projetos: ["project", "projects", "work"],
  projectos: ["project", "projects", "work"],
  projecto: ["project", "projects", "work"],
  projeto: ["project", "projects", "work"],
  trabalhos: ["projects", "work"],
  trabalho: ["projects", "work"],
  servicos: ["services"],
  servico: ["services"],
  services: ["servicos"],
  direcao: ["art", "direction", "art direction"],
  direccao: ["art", "direction", "art direction"],
  arte: ["art", "direction", "art direction"],
  filosofia: ["principles", "creative"],
  principio: ["principles", "philosophy"],
  principios: ["principles", "philosophy"],
  processo: ["process", "steps"],
  etapas: ["process", "steps"],
  ferramentas: ["software", "skills"],
};

export function normalizeKnowledgeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function tokenize(value: string): string[] {
  return normalizeKnowledgeText(value)
    .split(" ")
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token))
    .slice(0, 50);
}

function expandTokens(tokens: readonly string[]): string[] {
  const expanded = new Set(tokens);

  for (const token of tokens) {
    for (const synonym of QUERY_SYNONYMS[token] ?? []) {
      for (const expandedToken of tokenize(synonym)) {
        expanded.add(expandedToken);
      }
    }
  }

  return [...expanded];
}

function searchableFields(record: KnowledgeEntry) {
  return {
    title: normalizeKnowledgeText(record.title),
    content: normalizeKnowledgeText(record.content),
    keywords: normalizeKnowledgeText(record.keywords.join(" ")),
    entities: normalizeKnowledgeText(record.entities.join(" ")),
    metadata: normalizeKnowledgeText(JSON.stringify(record.metadata)),
  };
}

function scoreRecord(
  record: KnowledgeEntry,
  query: string,
  originalTokens: readonly string[],
  expandedTokens: readonly string[],
): KnowledgeSearchResult | null {
  const fields = searchableFields(record);
  const titleTokens = new Set(fields.title.split(" "));
  const keywordTokens = new Set(fields.keywords.split(" "));
  const entityTokens = new Set(fields.entities.split(" "));
  const contentTokens = new Set(fields.content.split(" "));
  const metadataTokens = new Set(fields.metadata.split(" "));
  const matchedTerms: string[] = [];
  let score = 0;

  for (const token of expandedTokens) {
    let tokenScore = 0;

    if (titleTokens.has(token)) tokenScore = Math.max(tokenScore, 7);
    if (entityTokens.has(token)) tokenScore = Math.max(tokenScore, 6);
    if (keywordTokens.has(token)) tokenScore = Math.max(tokenScore, 4);
    if (contentTokens.has(token)) tokenScore = Math.max(tokenScore, 1.5);
    if (metadataTokens.has(token)) tokenScore = Math.max(tokenScore, 1);

    if (tokenScore > 0) {
      score += tokenScore;
      matchedTerms.push(token);
    }
  }

  const normalizedQuery = normalizeKnowledgeText(query);
  if (normalizedQuery.length >= 3) {
    if (fields.title.includes(normalizedQuery)) score += 12;
    else if (fields.entities.includes(normalizedQuery)) score += 9;
    else if (fields.keywords.includes(normalizedQuery)) score += 5;
    else if (fields.content.includes(normalizedQuery)) score += 3;
  }

  const originalCoverage = originalTokens.filter((token) =>
    matchedTerms.some((match) =>
      match === token ||
      (QUERY_SYNONYMS[token] ?? []).some((alias) => tokenize(alias).includes(match)),
    ),
  ).length;

  if (originalTokens.length > 0) {
    score += (originalCoverage / originalTokens.length) * 3;
  }

  if (score <= 0) return null;

  return {
    record,
    score: Number(score.toFixed(3)),
    matchedTerms: [...new Set(matchedTerms)],
  };
}

export function searchKnowledge(
  query: string,
  options: KnowledgeSearchOptions = {},
): KnowledgeSearchResult[] {
  const safeQuery = query.trim().slice(0, 500);
  const originalTokens = tokenize(safeQuery);

  if (originalTokens.length === 0) return [];

  const expandedTokens = expandTokens(originalTokens);
  const limit = Math.max(1, Math.min(options.limit ?? 6, 20));
  const minScore = options.minScore ?? 1;
  const allowedKinds = options.kinds ? new Set(options.kinds) : null;

  return KNOWLEDGE_CATALOG.records
    .filter((record) => !allowedKinds || allowedKinds.has(record.kind))
    .map((record) => scoreRecord(record, safeQuery, originalTokens, expandedTokens))
    .filter((result): result is KnowledgeSearchResult => result !== null && result.score >= minScore)
    .sort((left, right) => right.score - left.score || left.record.id.localeCompare(right.record.id))
    .slice(0, limit);
}
