import { AgentHistorySchema, AgentQuestionSchema } from "../src/agent/contracts";

declare const process: {
  env: Record<string, string | undefined>;
};
import type { AgentGenerationRequest, AgentModelPort } from "../src/agent/model-port";
import { runAgentTurn } from "../src/agent/agent-core";

interface ApiRequest {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
}

interface ApiResponse {
  setHeader(name: string, value: string): void;
  status(code: number): ApiResponse;
  json(value: unknown): void;
}

interface GeminiOutputPart {
  type?: string;
  text?: string;
}

export interface GeminiInteractionResponse {
  status?: string;
  steps?: Array<{
    type?: string;
    content?: GeminiOutputPart[];
  }>;
}

export function extractGeminiText(payload: GeminiInteractionResponse): string | null {
  const finalOutput = [...(payload.steps ?? [])]
    .reverse()
    .find((step) => step.type === "model_output");
  const text = finalOutput?.content
    ?.filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text ?? "")
    .join("")
    .trim();
  return text || null;
}

const MODEL = process.env["GEMINI_MODEL"]?.trim() || "gemini-3.8-flash";
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT_PER_WINDOW = 18;
const MAX_REQUEST_BYTES = 8_000;
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export const config = { maxDuration: 30 };

function headerValue(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function getClientIp(headers: ApiRequest["headers"]): string {
  const forwarded = headerValue(headers["x-forwarded-for"]);
  return forwarded.split(",")[0]?.trim().slice(0, 64) || "unknown";
}

function isSameOrigin(request: ApiRequest): boolean {
  const origin = headerValue(request.headers.origin);
  if (!origin) return true;
  const host = headerValue(request.headers.host);
  if (!host) return false;
  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

function consumeRateLimit(ip: string): boolean {
  const now = Date.now();
  const current = requestCounts.get(ip);
  if (!current || current.resetAt <= now) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (current.count >= RATE_LIMIT_PER_WINDOW) return false;
  current.count += 1;
  if (requestCounts.size > 2_000) {
    for (const [key, value] of requestCounts) {
      if (value.resetAt <= now) requestCounts.delete(key);
    }
  }
  return true;
}

function decodeBody(body: unknown): unknown {
  if (typeof body !== "string") return body;
  if (body.length > MAX_REQUEST_BYTES) return null;
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return null;
  }
}

function createGeminiModel(apiKey: string): AgentModelPort {
  return {
    async generate(request: AgentGenerationRequest) {
      if (request.signal.aborted) return { cancelled: true };

      let response: Response;
      try {
        response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/interactions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-goog-api-key": apiKey,
            },
            body: JSON.stringify({
              model: MODEL,
              input: request.userPrompt,
              system_instruction: request.systemPrompt,
              generation_config: {
                thinking_level: "low",
                max_output_tokens: Math.min(request.maxTokens, 800),
              },
              response_format: {
                type: "text",
                mime_type: "application/json",
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", enum: ["answered", "insufficient_evidence", "action_proposed"] },
                    answer: { type: "string" },
                    citationIds: { type: "array", items: { type: "string" } },
                    followUpQuestion: { type: ["string", "null"] },
                    actionProposal: { type: ["object", "null"] },
                  },
                  required: ["status", "answer", "citationIds", "followUpQuestion", "actionProposal"],
                },
              },
              store: false,
            }),
            signal: request.signal,
          },
        );
      } catch (error) {
        if (request.signal.aborted) return { cancelled: true };
        throw new Error("Gemini não conseguiu receber o pedido.", { cause: error });
      }

      if (!response.ok) {
        throw new Error("Gemini devolveu HTTP " + response.status + ".");
      }

      const payload = await response.json() as GeminiInteractionResponse;
      if (payload.status !== "completed") {
        throw new Error("Gemini não concluiu a interacção.");
      }

      const text = extractGeminiText(payload);

      if (!text) {
        throw new Error("Gemini não devolveu conteúdo de texto.");
      }

      request.onToken(text);
      return { cancelled: false };
    },
  };
}

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  response.setHeader("Cache-Control", "no-store, max-age=0");
  response.setHeader("Vary", "Origin");

  if (request.method === "GET") {
    response.status(200).json({
      available: Boolean(process.env["GEMINI_API_KEY"]),
      provider: "gemini",
      model: MODEL,
    });
    return;
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    response.status(405).json({ message: "Método não permitido." });
    return;
  }

  if (!isSameOrigin(request)) {
    response.status(403).json({ message: "Origem não autorizada." });
    return;
  }

  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    response.status(503).json({ message: "A IA remota ainda não está configurada." });
    return;
  }

  const contentLength = Number(headerValue(request.headers["content-length"]));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    response.status(413).json({ message: "O pedido excede o limite permitido." });
    return;
  }

  if (!consumeRateLimit(getClientIp(request.headers))) {
    response.status(429).json({ message: "Estou a receber muitos pedidos neste momento. Tente novamente dentro de instantes." });
    return;
  }

  const decoded = decodeBody(request.body);
  const shape = typeof decoded === "object" && decoded !== null
    ? decoded as Record<string, unknown>
    : null;

  if (!shape || typeof shape["question"] !== "string") {
    response.status(400).json({ message: "Pedido inválido." });
    return;
  }

  const question = AgentQuestionSchema.safeParse(shape["question"]);
  const history = AgentHistorySchema.safeParse(shape["history"] ?? []);
  if (!question.success || !history.success || Object.keys(shape).some((key) => !["question", "history"].includes(key))) {
    response.status(400).json({ message: "A pergunta ou o histórico não respeitam os limites definidos." });
    return;
  }

  try {
    const result = await runAgentTurn(question.data, {
      model: createGeminiModel(apiKey),
      history: history.data,
    });
    response.status(200).json(result);
  } catch {
    response.status(502).json({ message: "Não consegui preparar uma resposta neste momento. Tente novamente." });
  }
}
