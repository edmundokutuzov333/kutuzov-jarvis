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

  const results = searchKnowledge(question, { limit: 5, minScore: 1.5 });
  const publicResults = results.filter(
    (result) => result.record.visibility === "public_fact",
  );
  const references = publicResults.map(({ record }) => ({
    recordId: record.id,
    label: record.title,
    path: record.source.path,
    capturedAt: record.source.capturedAt,
  }));
  const projects = searchKnowledge(question, {
    limit: 3,
    minScore: 2,
    kinds: ["project"],
  }).map((result) => result.record);

  const answer = publicResults.length > 0
    ? "A pesquisa local encontrou informação publicada relacionada com a pergunta. Os cartões e referências abaixo mostram exactamente os registos recuperados. Este modo não usa um modelo de inteligência artificial."
    : "Ainda não encontrei informação pública e verificada suficiente para responder. Sem o modelo local carregado, só posso fazer pesquisa determinística na base de conhecimento.";

  return {
    answer,
    references,
    projects,
    actionProposal: null,
    mode: "search",
  };
}
