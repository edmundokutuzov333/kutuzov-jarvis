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
  if (actionProposal) {
    return {
      answer: "Identifiquei um comando permitido. Reveja a acção abaixo e confirme para a executar no ambiente de demonstração. Esta operação não navega no portefólio oficial.",
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

  const excerpts: string[] = [];
  let remainingCharacters = 1_200;
  for (const { record } of publicResults.slice(0, 3)) {
    if (remainingCharacters <= 0) break;
    const title = record.title.slice(0, 110);
    const content = record.content.slice(0, Math.min(420, remainingCharacters));
    const excerpt = title + "\n" + content;
    excerpts.push(excerpt);
    remainingCharacters -= excerpt.length + 4;
  }

  const answer = publicResults.length > 0
    ? "A pesquisa local encontrou informação publicada relacionada com a pergunta. Estes são os registos recuperados:\n\n" +
      excerpts.join("\n\n") +
      "\n\nEste modo usa pesquisa local, não um modelo de inteligência artificial."
    : "Ainda não encontrei informação pública e verificada suficiente para responder. Sem o modelo local carregado, só posso fazer pesquisa determinística na base de conhecimento.";

  return {
    answer,
    references,
    projects,
    actionProposal: null,
    mode: "search",
  };
}
