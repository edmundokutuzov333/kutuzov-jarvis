import {
  AgentHistorySchema,
  AgentQuestionSchema,
  MAX_AGENT_MODEL_OUTPUT_CHARACTERS,
  type AgentHistoryMessage,
} from "./contracts";
import { AGENT_PROMPT_VERSION } from "./contracts";
import { AGENT_SYSTEM_PROMPT, buildAgentUserPrompt } from "./prompts";
import type { AgentGenerationResult, AgentModelPort } from "./model-port";
import {
  AgentResponseValidationError,
  parseAgentModelOutput,
  type ValidatedAgentResponse,
} from "./response";
import { buildKnowledgeContext } from "../knowledge/context";
import { searchKnowledge } from "../knowledge/search";
import { KNOWLEDGE_CATALOG } from "../knowledge/catalog";

export type AgentCoreErrorCode =
  | "INVALID_INPUT"
  | "MODEL_UNAVAILABLE"
  | "MODEL_FAILED"
  | "INVALID_MODEL_OUTPUT"
  | "OUTPUT_TOO_LARGE";

export class AgentCoreError extends Error {
  constructor(
    public readonly code: AgentCoreErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "AgentCoreError";
  }
}

export interface AgentTurnOptions {
  model?: AgentModelPort;
  history?: readonly AgentHistoryMessage[];
  signal?: AbortSignal;
}

export interface AgentRetrievalSummary {
  status: "matched" | "constraints_only" | "insufficient_evidence";
  matchedRecords: number;
  publicFacts: number;
  editorialConstraints: number;
  contextCharacters: number;
  truncated: boolean;
}

export type AgentTurnResult =
  | {
      state: "completed";
      response: ValidatedAgentResponse;
      retrieval: AgentRetrievalSummary;
      promptVersion: typeof AGENT_PROMPT_VERSION;
      modelUsed: boolean;
    }
  | {
      state: "cancelled";
      retrieval: AgentRetrievalSummary;
      promptVersion: typeof AGENT_PROMPT_VERSION;
      modelUsed: boolean;
    };

const QUESTION_STOP_WORDS = new Set([
  "a", "as", "ao", "aos", "da", "das", "de", "do", "dos", "e", "em",
  "é", "foi", "for", "me", "na", "nas", "no", "nos", "o", "os", "ou",
  "para", "por", "que", "qual", "quais", "quem", "se", "sua", "suas",
  "um", "uma", "uns", "umas", "the", "a", "an", "and", "are", "do",
  "does", "did", "for", "how", "is", "of", "the", "what", "when", "where",
  "which", "who", "why", "with", "please", "tell", "about", "kutuzov",
  "edmundo",
]);

const FOLLOW_UP_MARKERS = new Set([
  "ano", "anos", "quando", "mais", "isso", "isto", "esse", "essa", "esses",
  "essas", "ele", "ela", "eles", "elas", "tambem", "entao", "detalhes",
  "detalhe", "porque", "porquê", "how", "when", "what", "which", "that",
  "it", "they", "he", "she", "more", "year", "years", "else", "then",
]);

function normalizeQuestionTokens(question: string): string[] {
  return question
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function isBroadProfileQuestion(question: string): boolean {
  const normalized = normalizeQuestionTokens(question).join(" ");
  return /\b(tudo sobre mim|tudo sobre kutuzov|tudo o que sabes|tudo que sabes|tudo o que sabe|tudo que sabe|apresente tudo|perfil completo|percurso completo|all about me|everything about me|complete profile|who am i)\b/.test(normalized);
}

function buildRetrievalQuery(
  question: string,
  history: readonly AgentHistoryMessage[],
): string {
  if (isBroadProfileQuestion(question)) {
    return "Edmundo Kutuzov perfil identidade experiência carreira projectos clientes marcas serviços competências disciplinas princípios processo métricas";
  }

  const tokens = normalizeQuestionTokens(question);
  const meaningful = tokens.filter(
    (token) => token.length > 1 && !QUESTION_STOP_WORDS.has(token),
  );
  const isReferentialFollowUp =
    tokens.length <= 5 &&
    tokens.some((token) => FOLLOW_UP_MARKERS.has(token)) &&
    meaningful.every((token) => FOLLOW_UP_MARKERS.has(token));

  if (!isReferentialFollowUp) return question;

  const previousUserQuestion = [...history]
    .reverse()
    .find((message) => message.role === "user")?.content;

  if (!previousUserQuestion) return question;

  return (previousUserQuestion.slice(0, 300) + " " + question).trim().slice(0, 500);
}

function isExplicitActionRequest(question: string): boolean {
  const normalized = question
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("en");
  const hasActionVerb = /\b(mostra|mostrar|abre|abrir|ver|vai|navega|filtra|repor|reiniciar|show|open|view|display|navigate|go|take)\b/.test(normalized);
  const hasKnownTarget = /\b(projectos|projetos|projects|project|portefolio|portfolio|clientes|clients|marcas|brands|experiencia|experience|carreira|servicos|services|about|sobre|contacto|contact|interface)\b/.test(normalized);
  const knownProject = ["diga yes", "diga-yes", "jogue venca repita", "jogue vença repita", "datas que ligam", "somos uma"]
    .some((name) => normalized.includes(name));
  return hasActionVerb && (hasKnownTarget || knownProject);
}

function makeAbstention(constraintIds: readonly string[]): ValidatedAgentResponse {
  if (constraintIds.includes("limitation.biography-pending")) {
    return {
      status: "insufficient_evidence",
      answer: "O perfil público ainda não contém uma biografia consolidada e confirmada. Posso, no entanto, apresentar os cargos, a localização e o posicionamento que estão publicados.",
      references: [],
      followUpQuestion: "Quer consultar a experiência profissional e o posicionamento publicados?",
      actionProposal: null,
    };
  }

  if (constraintIds.includes("limitation.project-roles-unconfirmed")) {
    return {
      status: "insufficient_evidence",
      answer: "O portefólio identifica o projecto, mas a informação pública consultada não confirma a função individual desempenhada por Kutuzov. Não vou atribuir-lhe uma responsabilidade por inferência.",
      references: [],
      followUpQuestion: "Quer ver os dados do projecto que estão publicados?",
      actionProposal: null,
    };
  }

  if (constraintIds.includes("limitation.metrics-not-audited")) {
    return {
      status: "insufficient_evidence",
      answer: "O portefólio apresenta métricas declaradas, mas a fonte disponível não permite tratá-las como resultados auditados externamente.",
      references: [],
      followUpQuestion: "Quer consultar os valores indicados no portefólio?",
      actionProposal: null,
    };
  }

  if (constraintIds.includes("limitation.skill-scores-not-assessed")) {
    return {
      status: "insufficient_evidence",
      answer: "O portefólio apresenta níveis e pontuações para algumas competências, mas esses valores não correspondem a uma avaliação ou certificação independente.",
      references: [],
      followUpQuestion: "Quer consultar as competências e os níveis publicados?",
      actionProposal: null,
    };
  }

  return {
    status: "insufficient_evidence",
    answer: "Não encontrei informação pública e verificada suficiente para responder a essa pergunta. Prefiro não adivinhar.",
    references: [],
    followUpQuestion: null,
    actionProposal: null,
  };
}

function summarizeRetrieval(
  context: ReturnType<typeof buildKnowledgeContext>,
  matchedRecords: number,
): AgentRetrievalSummary {
  return {
    status: context.status,
    matchedRecords,
    publicFacts: context.facts.length,
    editorialConstraints: context.constraints.length,
    contextCharacters: context.characterCount,
    truncated: context.truncated,
  };
}

function validateInput(question: string, history: readonly AgentHistoryMessage[]) {
  try {
    return {
      question: AgentQuestionSchema.parse(question),
      history: AgentHistorySchema.parse(history),
    };
  } catch (error) {
    throw new AgentCoreError(
      "INVALID_INPUT",
      "A pergunta ou o histórico não respeitam os limites definidos.",
      { cause: error },
    );
  }
}

export async function runAgentTurn(
  rawQuestion: string,
  options: AgentTurnOptions = {},
): Promise<AgentTurnResult> {
  const input = validateInput(rawQuestion, options.history ?? []);

  const broadProfile = isBroadProfileQuestion(input.question);
  const retrievalQuery = buildRetrievalQuery(input.question, input.history);
  const rawResults = broadProfile
    ? KNOWLEDGE_CATALOG.records.map((record) => ({
        record,
        score: 1,
        matchedTerms: ["broad-profile"],
      }))
    : searchKnowledge(retrievalQuery, {
        limit: 12,
        minScore: 1,
      });
  const focusedTerms = normalizeQuestionTokens(retrievalQuery)
    .filter((term) => term.length > 1 && !QUESTION_STOP_WORDS.has(term));
  const results = broadProfile || focusedTerms.length === 0
    ? rawResults
    : rawResults.filter((result) =>
        result.matchedTerms.some((term) => focusedTerms.includes(term)),
      );
  const context = buildKnowledgeContext(retrievalQuery, results, broadProfile
    ? { maxCharacters: 28_000, maxRecords: 80 }
    : { maxCharacters: 4_500, maxRecords: 8 },
  );
  const retrieval = summarizeRetrieval(context, results.length);

  if (options.signal?.aborted) {
    return {
      state: "cancelled",
      retrieval,
      promptVersion: AGENT_PROMPT_VERSION,
      modelUsed: false,
    };
  }

  const hasPublicEvidence = context.status === "matched" && context.facts.length > 0;
  const actionRequested = isExplicitActionRequest(input.question);

  if (!hasPublicEvidence && !actionRequested) {
    return {
      state: "completed",
      response: makeAbstention(context.constraints.map((constraint) => constraint.id)),
      retrieval,
      promptVersion: AGENT_PROMPT_VERSION,
      modelUsed: false,
    };
  }

  if (!options.model) {
    throw new AgentCoreError(
      "MODEL_UNAVAILABLE",
      "A Knowledge Base encontrou informação, mas o modelo local ainda não está disponível. Carregue o modelo neste dispositivo para gerar uma resposta fundamentada.",
    );
  }

  const controller = new AbortController();
  const relayAbort = () => controller.abort();
  options.signal?.addEventListener("abort", relayAbort, { once: true });

  let generated = "";
  let outputTooLarge = false;

  try {
    const userPrompt = buildAgentUserPrompt({
      question: input.question,
      history: input.history,
      knowledge: context,
      includeActionContract: actionRequested,
    });

    let generation: AgentGenerationResult;
    try {
      generation = await options.model.generate({
        systemPrompt: AGENT_SYSTEM_PROMPT,
        userPrompt,
        maxTokens: broadProfile ? 720 : actionRequested ? 180 : 256,
        temperature: 0.15,
        topP: 0.82,
        signal: controller.signal,
        onToken: (token) => {
          if (controller.signal.aborted) return;
          if (generated.length + token.length > MAX_AGENT_MODEL_OUTPUT_CHARACTERS) {
            outputTooLarge = true;
            controller.abort();
            return;
          }
          generated += token;
        },
      });
    } catch (error) {
      if (outputTooLarge) {
        throw new AgentCoreError(
          "OUTPUT_TOO_LARGE",
          "A resposta do modelo excedeu o limite de segurança e foi interrompida.",
          { cause: error },
        );
      }
      if (options.signal?.aborted) {
        return {
          state: "cancelled",
          retrieval,
          promptVersion: AGENT_PROMPT_VERSION,
          modelUsed: true,
        };
      }
      throw new AgentCoreError(
        "MODEL_FAILED",
        "O modelo local não conseguiu concluir esta resposta.",
        { cause: error },
      );
    }

    if (outputTooLarge) {
      throw new AgentCoreError(
        "OUTPUT_TOO_LARGE",
        "A resposta do modelo excedeu o limite de segurança e foi interrompida.",
      );
    }

    if (generation.cancelled || controller.signal.aborted || options.signal?.aborted) {
      return {
        state: "cancelled",
        retrieval,
        promptVersion: AGENT_PROMPT_VERSION,
        modelUsed: true,
      };
    }

    let response: ValidatedAgentResponse;
    try {
      response = parseAgentModelOutput(generated, context);
    } catch (error) {
      if (error instanceof AgentResponseValidationError) {
        throw new AgentCoreError("INVALID_MODEL_OUTPUT", error.message, {
          cause: error,
        });
      }
      throw error;
    }

    return {
      state: "completed",
      response,
      retrieval,
      promptVersion: AGENT_PROMPT_VERSION,
      modelUsed: true,
    };
  } finally {
    options.signal?.removeEventListener("abort", relayAbort);
  }
}
