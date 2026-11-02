import { AgentModelOutputSchema, type AgentModelOutput } from "./contracts";
import type { KnowledgeContext } from "../knowledge/context";

export interface AgentReference {
  recordId: string;
  label: string;
  path: string;
  capturedAt: string;
}

export interface ValidatedAgentResponse {
  status: "answered" | "insufficient_evidence";
  answer: string;
  references: AgentReference[];
  followUpQuestion: string | null;
}

export class AgentResponseValidationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "AgentResponseValidationError";
  }
}

export function parseAgentModelOutput(
  raw: string,
  knowledge: KnowledgeContext,
): ValidatedAgentResponse {
  if (raw.trim().length === 0 || raw.length > 12_000) {
    throw new AgentResponseValidationError("O modelo devolveu uma resposta vazia ou acima do limite.");
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(raw.trim());
  } catch (error) {
    throw new AgentResponseValidationError(
      "O modelo não devolveu JSON válido. A resposta foi rejeitada.",
      { cause: error },
    );
  }

  let parsed: AgentModelOutput;
  try {
    parsed = AgentModelOutputSchema.parse(decoded);
  } catch (error) {
    throw new AgentResponseValidationError(
      "A resposta do modelo não respeita o contrato estruturado.",
      { cause: error },
    );
  }

  const allowedReferences = new Map(
    knowledge.references.map((reference) => [reference.recordId, reference]),
  );

  const references = parsed.citationIds.map((recordId) => {
    const reference = allowedReferences.get(recordId);
    if (!reference) {
      throw new AgentResponseValidationError(
        "O modelo citou uma fonte que não foi recuperada. A resposta foi rejeitada.",
      );
    }
    return {
      recordId: reference.recordId,
      label: reference.label,
      path: reference.path,
      capturedAt: reference.capturedAt,
    };
  });

  if (parsed.status === "answered" && references.length === 0) {
    throw new AgentResponseValidationError(
      "Uma resposta factual sem fontes válidas não pode ser apresentada.",
    );
  }

  if (parsed.status === "insufficient_evidence") {
    return {
      status: "insufficient_evidence",
      answer: "A informação pública recuperada não permite responder com segurança a esta pergunta. Prefiro não adivinhar.",
      references: [],
      followUpQuestion: null,
    };
  }

  return {
    status: parsed.status,
    answer: parsed.answer,
    references,
    followUpQuestion: parsed.followUpQuestion,
  };
}
