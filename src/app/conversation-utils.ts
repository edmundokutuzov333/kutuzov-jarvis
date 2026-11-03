import { PortfolioActionSchema } from "../actions/schemas";
import type { PortfolioActionProposal, ProjectCategory } from "../actions/schemas";
import { searchKnowledge } from "../knowledge/search";
import type { KnowledgeEntry } from "../knowledge/schema";
import type { AgentReference } from "../agent/response";

export interface DeterministicConversationResult {
  answer: string;
  references: AgentReference[];
  projects: KnowledgeEntry[];
  actionProposal: PortfolioActionProposal | null;
  mode: "search" | "action";
}

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function hasAny(value: string, terms: readonly string[]): boolean {
  return terms.some((term) => value.includes(term));
}

const QUERY_STOP_WORDS = new Set([
  "a", "as", "ao", "aos", "da", "das", "de", "do", "dos", "e", "em",
  "é", "foi", "for", "me", "na", "nas", "no", "nos", "o", "os", "ou",
  "para", "por", "que", "qual", "quais", "quem", "se", "sua", "suas",
  "um", "uma", "uns", "umas", "the", "this", "that", "to", "was",
  "what", "which", "who", "with", "and", "is", "are", "of", "in", "on",
  "his", "her", "their", "at", "by", "please", "tell", "about",
  "kutuzov", "edmundo",
]);

function isDirectIdentityQuestion(question: string): boolean {
  const value = normalize(question);
  return /\b(quem e kutuzov|who is kutuzov|who was kutuzov|sobre kutuzov|perfil de kutuzov|tell me about kutuzov)\b/.test(value);
}

function relevantKnowledgeResults(
  question: string,
  limit: number,
): ReturnType<typeof searchKnowledge> {
  const results = searchKnowledge(question, { limit, minScore: 1 });
  if (isDirectIdentityQuestion(question)) {
    return results.filter((result) =>
      result.record.kind === "identity" &&
      result.record.visibility === "public_fact",
    );
  }

  const meaningfulTerms = normalize(question)
    .split(" ")
    .filter((term) => term.length > 1 && !QUERY_STOP_WORDS.has(term));

  if (meaningfulTerms.length === 0) return [];
  return results.filter((result) =>
    result.matchedTerms.some((term) => meaningfulTerms.includes(term)),
  );
}

function openProjectProposal(slug: string): PortfolioActionProposal | null {
  const parsed = PortfolioActionSchema.safeParse({
    action: "OPEN_PROJECT",
    parameters: { slug },
  });
  return parsed.success ? parsed.data : null;
}

function metadataString(record: KnowledgeEntry, key: string): string {
  const value = record.metadata[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function formatPublicFact(record: KnowledgeEntry): string | null {
  if (record.id === "identity.public-profile") {
    return "Sou Art Director. O meu perfil profissional também apresenta áreas de Social Media Manager, AI Expert e Content Creator. Trabalho a partir de Maputo, Moçambique.";
  }
  if (record.id === "identity.published-positioning") {
    return "A minha abordagem criativa procura criar sistemas de marca que conquistam atenção e permanecem na memória.";
  }
  if (record.kind === "project") return null;
  if (record.kind === "experience") {
    const role = metadataString(record, "role");
    const organization = metadataString(record, "organization") || record.title;
    const period = metadataString(record, "period");
    if (role) return "Na " + organization + ", trabalhei como " + role + (period ? " (" + period + ")" : "") + ".";
  }
  if (record.kind === "client") {
    const name = metadataString(record, "name") || record.title;
    return "No meu portefólio constam marcas como " + name + ".";
  }
  if (record.kind === "service") {
    const name = metadataString(record, "name") || record.title;
    return "Entre os serviços que apresento está " + name + ".";
  }
  if (record.kind === "skill") {
    const name = metadataString(record, "name") || record.title;
    const score = metadataString(record, "score");
    return "A minha página de competências apresenta " + name + (score ? " com uma pontuação publicada de " + score + "." : ".");
  }
  if (record.kind === "discipline") {
    const items = record.metadata["items"];
    if (Array.isArray(items) && items.every((item) => typeof item === "string")) {
      return "Entre as minhas disciplinas estão " + items.join(", ") + ".";
    }
  }
  return record.title + ": " + record.content
    .replace(/^Experiência publicada:\s*/i, "")
    .replace(/^O perfil público identifica Edmundo Kutuzov como/i, "Sou")
    .trim();
}

export function resolveAutomaticProjectUrl(
  proposal: PortfolioActionProposal | null | undefined,
  intentText: string,
): string | null {
  const parsed = PortfolioActionSchema.safeParse(proposal);
  if (!parsed.success || parsed.data.action !== "OPEN_PROJECT") return null;
  const slug = parsed.data.parameters.slug;
  const intentRecords = searchKnowledge(intentText, {
    limit: 12,
    minScore: 1,
    kinds: ["project"],
  });
  const normalizedIntent = normalize(intentText);
  const projectWasMentioned = intentRecords.some((result) => {
    if (result.record.visibility !== "public_fact" || result.record.metadata["slug"] !== slug) {
      return false;
    }
    const identifyingTerms = slug.split("-").filter((term) => term.length > 2 && term !== "que" && term !== "uma");
    return identifyingTerms.some((term) => normalizedIntent.includes(term));
  });
  if (!projectWasMentioned) return null;
  return new URL("/work/" + encodeURIComponent(slug), "https://www.edmundokutuzov.art").toString();
}

export function resolveDeterministicAction(
  question: string,
): PortfolioActionProposal | null {
  const value = normalize(question);
  const hasCommand = hasAny(value, [
    "mostra", "mostrar", "abre", "abrir", "ver ", "vai ", "navega",
    "filtra", "repor", "reiniciar", "open ", "show ", "display ",
    "view ", "navigate", "reset ",
  ]);

  if (!hasCommand) return null;

  if (hasAny(value, ["repor interface", "reiniciar interface", "reset interface", "comecar de novo"])) {
    return { action: "RESET_INTERFACE", parameters: {} };
  }
  if (hasAny(value, ["contacto", "contato", "contact", "falar com", "entrar em contacto"])) {
    return { action: "OPEN_CONTACT", parameters: {} };
  }
  if (hasAny(value, ["clientes", "marcas", "clients", "brands"])) {
    return { action: "SHOW_CLIENTS", parameters: {} };
  }
  if (hasAny(value, ["experiencia", "carreira", "experience", "career"])) {
    return { action: "SHOW_EXPERIENCE", parameters: {} };
  }
  if (hasAny(value, ["servicos", "services"])) {
    return { action: "SHOW_SERVICES", parameters: {} };
  }
  if (hasAny(value, ["about", "sobre kutuzov", "perfil", "profile"])) {
    return { action: "SHOW_ABOUT", parameters: {} };
  }

  const categories: Array<{ terms: string[]; category: ProjectCategory }> = [
    { terms: ["campaign design", "campanhas", "campaign"], category: "Campaign Design" },
    { terms: ["social media", "redes sociais", "social"], category: "Social Media" },
    { terms: ["content creation", "criacao de conteudo", "conteudo"], category: "Content Creation" },
    { terms: ["art direction", "direccao de arte", "direcao de arte"], category: "Art Direction" },
  ];

  const projectMatch = searchKnowledge(question, {
    limit: 1,
    minScore: 2,
    kinds: ["project"],
  })[0]?.record;

  if (
    projectMatch &&
    hasAny(value, ["abre", "abrir", "open", "detalhe", "detalhes"])
  ) {
    const slug = projectMatch.metadata["slug"];
    if (typeof slug === "string") return openProjectProposal(slug);
  }

  if (hasAny(value, ["projectos", "projetos", "projects", "portfolio", "portefolio", "projecto", "projeto"])) {
    for (const item of categories) {
      if (hasAny(value, item.terms)) {
        return { action: "FILTER_PROJECTS", parameters: { category: item.category } };
      }
    }
    return { action: "SHOW_PROJECTS", parameters: {} };
  }

  return null;
}

export function buildDeterministicFallback(
  question: string,
): DeterministicConversationResult {
  const actionProposal = resolveDeterministicAction(question);
  if (actionProposal?.action === "OPEN_PROJECT") {
    return {
      answer: "Vou abrir o projecto que pediu.",
      references: [],
      projects: [],
      actionProposal,
      mode: "action",
    };
  }

  const results = relevantKnowledgeResults(question, 12).slice(0, 5);
  const publicResults = results.filter(
    (result) => result.record.visibility === "public_fact",
  );
  const references = publicResults.map(({ record }) => ({
    recordId: record.id,
    label: record.title,
    path: record.source.path,
    capturedAt: record.source.capturedAt,
  }));
  const projects = publicResults
    .filter((result) => result.record.kind === "project")
    .slice(0, 3)
    .map((result) => result.record);

  const excerpts = publicResults
    .filter(({ record }) => record.kind !== "project")
    .slice(0, 4)
    .map(({ record }) => formatPublicFact(record))
    .filter((value): value is string => value !== null)
    .slice(0, 4);

  const answer = excerpts.length > 0
    ? "Posso partilhar consigo o que está confirmado:\n\n" + excerpts.join("\n\n")
    : projects.length > 0
      ? "Estes são alguns dos projectos que tenho publicados:"
      : "Ainda não encontrei informação pública confirmada sobre isso. Prefiro não inventar.";

  return {
    answer,
    references,
    projects,
    actionProposal: null,
    mode: "search",
  };
}
