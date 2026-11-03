import { z } from "zod";

import { AgentHistorySchema, AgentQuestionSchema } from "./contracts";
import { PortfolioActionSchema } from "../actions/schemas";

const AgentReferenceSchema = z.object({
  recordId: z.string().min(3).max(120),
  label: z.string().min(1).max(180),
  path: z.string().min(1).max(240),
  capturedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}).strict();

const AgentResponseSchema = z.object({
  status: z.enum(["answered", "insufficient_evidence", "action_proposed"]),
  answer: z.string().min(1).max(3_000),
  references: z.array(AgentReferenceSchema).max(6),
  followUpQuestion: z.string().max(240).nullable(),
  actionProposal: PortfolioActionSchema.nullable(),
}).strict();

const RetrievalSchema = z.object({
  status: z.enum(["matched", "constraints_only", "insufficient_evidence"]),
  matchedRecords: z.number().int().nonnegative(),
  publicFacts: z.number().int().nonnegative(),
  editorialConstraints: z.number().int().nonnegative(),
  contextCharacters: z.number().int().nonnegative(),
  truncated: z.boolean(),
}).strict();

export const GeminiAvailabilitySchema = z.object({
  available: z.boolean(),
  provider: z.literal("gemini"),
  model: z.string().min(1).max(80),
}).strict();

export const GeminiTurnResultSchema = z.discriminatedUnion("state", [
  z.object({
    state: z.literal("completed"),
    response: AgentResponseSchema,
    retrieval: RetrievalSchema,
    promptVersion: z.string().min(1).max(40),
    modelUsed: z.boolean(),
  }).strict(),
  z.object({
    state: z.literal("cancelled"),
    retrieval: RetrievalSchema,
    promptVersion: z.string().min(1).max(40),
    modelUsed: z.boolean(),
  }).strict(),
]);

export type GeminiAvailability = z.infer<typeof GeminiAvailabilitySchema>;
export type GeminiTurnResult = z.infer<typeof GeminiTurnResultSchema>;

export class GeminiClientError extends Error {
  constructor(message: string, readonly status = 0) {
    super(message);
    this.name = "GeminiClientError";
  }
}

export async function getGeminiAvailability(): Promise<GeminiAvailability> {
  try {
    const response = await fetch("/api/assistant", {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return { available: false, provider: "gemini", model: "gemini-3.8-flash" };
    const payload: unknown = await response.json();
    return GeminiAvailabilitySchema.parse(payload);
  } catch {
    return { available: false, provider: "gemini", model: "gemini-3.8-flash" };
  }
}

export async function askGeminiAssistant(
  question: string,
  history: readonly { role: "user" | "assistant"; content: string }[],
  signal?: AbortSignal,
): Promise<GeminiTurnResult> {
  const safeQuestion = AgentQuestionSchema.parse(question);
  const safeHistory = AgentHistorySchema.parse(history);
  const response = await fetch("/api/assistant", {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ question: safeQuestion, history: safeHistory }),
    ...(signal ? { signal } : {}),
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new GeminiClientError("O serviço de inteligência não devolveu uma resposta válida.", response.status);
  }

  if (!response.ok) {
    const message = typeof payload === "object" && payload !== null && "message" in payload &&
      typeof payload.message === "string"
      ? payload.message
      : response.status === 429
        ? "Estou a receber muitos pedidos neste momento. Tente novamente dentro de instantes."
        : "Não foi possível concluir a resposta. Tente novamente.";
    throw new GeminiClientError(message, response.status);
  }

  const parsed = GeminiTurnResultSchema.safeParse(payload);
  if (!parsed.success) {
    throw new GeminiClientError("A resposta do serviço não passou pela validação.");
  }
  return parsed.data;
}
