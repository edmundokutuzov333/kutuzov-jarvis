interface VercelRequest {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}
interface VercelResponse {
  setHeader(name: string, value: string): void;
  status(code: number): VercelResponse;
  json(value: unknown): void;
}

declare const process: { env: Record<string, string | undefined> };

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 12;
const counters = new Map<string, { count: number; resetAt: number }>();

function clientIp(request: VercelRequest): string {
  const forwarded = request.headers["x-forwarded-for"];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return String(value ?? request.socket?.remoteAddress ?? "unknown").split(",")[0].trim().slice(0, 64);
}

function allowedOrigin(request: VercelRequest): boolean {
  const origin = request.headers.origin;
  if (!origin) return true;
  const host = request.headers.host;
  if (!host) return false;
  try {
    return new URL(origin).host.toLowerCase() === String(host).toLowerCase();
  } catch {
    return false;
  }
}

function allowedRequest(ip: string): boolean {
  const now = Date.now();
  const current = counters.get(ip);
  if (!current || current.resetAt <= now) {
    counters.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (current.count >= MAX_REQUESTS) return false;
  current.count += 1;
  return true;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader("Cache-Control", "no-store, max-age=0");
  response.setHeader("Vary", "Origin");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ message: "Método não permitido." });
    return;
  }

  if (!allowedOrigin(request)) {
    response.status(403).json({ message: "Origem não autorizada." });
    return;
  }

  if (!allowedRequest(clientIp(request))) {
    response.status(429).json({ message: "A voz está a receber muitos pedidos. Tente novamente dentro de instantes." });
    return;
  }

  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    response.status(503).json({ message: "A voz ainda não está configurada." });
    return;
  }

  const now = Date.now();
  const tokenResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/auth_tokens", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      uses: 1,
      expireTime: new Date(now + 30 * 60_000).toISOString(),
      newSessionExpireTime: new Date(now + 60_000).toISOString(),
    }),
  });

  if (!tokenResponse.ok) {
    response.status(502).json({ message: "Não consegui preparar a sessão de voz." });
    return;
  }

  const payload = await tokenResponse.json() as { name?: string };
  if (!payload.name) {
    response.status(502).json({ message: "A sessão de voz não devolveu um token válido." });
    return;
  }

  response.status(200).json({
    token: payload.name,
    model: process.env["GEMINI_LIVE_MODEL"]?.trim() || "gemini-3.8-live",
  });
}
