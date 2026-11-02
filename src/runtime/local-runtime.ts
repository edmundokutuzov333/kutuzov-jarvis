import type {
  ChatCompletionChunk,
  ChatCompletionMessageParam,
  InitProgressReport,
  MLCEngineInterface,
} from "@mlc-ai/web-llm";

import { inspectWebGpu } from "../platform/webgpu";
import { LOCAL_MODEL_APP_CONFIG, LOCAL_MODEL_ID } from "./model-config";

export type RuntimeProgressHandler = (report: InitProgressReport) => void;
export type RuntimeTokenHandler = (token: string) => void;

export interface RuntimeGenerationOptions {
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

export class LocalRuntimeError extends Error {
  constructor(
    public readonly code:
      | "WEBGPU_UNAVAILABLE"
      | "WORKER_UNAVAILABLE"
      | "LOAD_CANCELLED"
      | "LOAD_FAILED"
      | "MODEL_NOT_READY"
      | "GENERATION_FAILED",
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "LocalRuntimeError";
  }
}

function normalizeRuntimeError(error: unknown): LocalRuntimeError {
  if (error instanceof LocalRuntimeError) return error;

  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (
    normalized.includes("failed to fetch") ||
    normalized.includes("networkerror") ||
    normalized.includes("cors") ||
    normalized.includes("404")
  ) {
    return new LocalRuntimeError(
      "LOAD_FAILED",
      "Não foi possível descarregar os artefactos do modelo. Verifique a ligação, a origem dos ficheiros e tente novamente.",
      { cause: error },
    );
  }

  if (
    normalized.includes("webgpu") ||
    normalized.includes("gpu") ||
    normalized.includes("adapter") ||
    normalized.includes("device")
  ) {
    return new LocalRuntimeError(
      "LOAD_FAILED",
      "O dispositivo não conseguiu inicializar o motor gráfico para este modelo. O equipamento pode não ter memória ou funcionalidades WebGPU suficientes.",
      { cause: error },
    );
  }

  return new LocalRuntimeError(
    "LOAD_FAILED",
    "O motor local não conseguiu carregar o modelo. Consulte os detalhes técnicos e tente novamente.",
    { cause: error },
  );
}

export class LocalInferenceRuntime {
  #engine: MLCEngineInterface | null = null;
  #worker: Worker | null = null;
  #loadTask: Promise<void> | null = null;
  #generationTask: Promise<{ cancelled: boolean }> | null = null;
  #generationController: AbortController | null = null;
  #loadOperation = 0;
  #rejectLoad: ((reason: Error) => void) | null = null;

  get isReady(): boolean {
    return this.#engine !== null;
  }

  async isModelCached(): Promise<boolean> {
    const { hasModelInCache } = await import("@mlc-ai/web-llm");
    return hasModelInCache(LOCAL_MODEL_ID, LOCAL_MODEL_APP_CONFIG);
  }

  async initialize(onProgress: RuntimeProgressHandler): Promise<void> {
    if (this.#engine) return;
    if (this.#loadTask) return this.#loadTask;

    const capability = await inspectWebGpu();
    if (capability.status !== "available") {
      throw new LocalRuntimeError("WEBGPU_UNAVAILABLE", capability.message);
    }

    if (typeof Worker === "undefined") {
      throw new LocalRuntimeError(
        "WORKER_UNAVAILABLE",
        "Este browser não suporta Web Workers necessários para manter a interface responsiva.",
      );
    }

    const operation = ++this.#loadOperation;
    const worker = new Worker(
      new URL("./webllm.worker.ts", import.meta.url),
      { type: "module", name: "kutuzov-jarvis-local-llm" },
    );
    this.#worker = worker;

    let rejectAbort!: (reason: Error) => void;
    const abortPromise = new Promise<never>((_resolve, reject) => {
      rejectAbort = reject;
    });
    this.#rejectLoad = rejectAbort;

    let rejectWorkerError!: (reason: Error) => void;
    const workerFailure = new Promise<never>((_resolve, reject) => {
      rejectWorkerError = reject;
    });

    const handleWorkerError = (event: ErrorEvent) => {
      rejectWorkerError(
        new LocalRuntimeError(
          "LOAD_FAILED",
          event.message || "O Web Worker do motor local terminou inesperadamente.",
        ),
      );
    };
    const handleMessageError = () => {
      rejectWorkerError(
        new LocalRuntimeError(
          "LOAD_FAILED",
          "O Web Worker recebeu uma mensagem que não conseguiu processar.",
        ),
      );
    };

    worker.addEventListener("error", handleWorkerError, { once: true });
    worker.addEventListener("messageerror", handleMessageError, { once: true });

    const createEngineTask = (async () => {
      const { CreateWebWorkerMLCEngine } = await import("@mlc-ai/web-llm");
      return CreateWebWorkerMLCEngine(worker, LOCAL_MODEL_ID, {
        appConfig: LOCAL_MODEL_APP_CONFIG,
        initProgressCallback: (report) => {
          if (this.#loadOperation === operation) onProgress(report);
        },
      });
    })();

    const task = (async () => {
      try {
        const engine = await Promise.race([
          createEngineTask,
          workerFailure,
          abortPromise,
        ]);

        if (this.#loadOperation !== operation) {
          await engine.unload().catch(() => undefined);
          throw new LocalRuntimeError(
            "LOAD_CANCELLED",
            "O carregamento do modelo foi cancelado.",
          );
        }

        this.#engine = engine;
        onProgress({
          progress: 1,
          timeElapsed: 0,
          text: "Modelo local inicializado.",
        });
      } catch (error) {
        if (this.#loadOperation === operation) {
          worker.terminate();
          this.#worker = null;
        }
        throw normalizeRuntimeError(error);
      }
    })();

    this.#loadTask = task;
    const cleanupLoad = () => {
      worker.removeEventListener("error", handleWorkerError);
      worker.removeEventListener("messageerror", handleMessageError);
      if (this.#loadOperation === operation) this.#rejectLoad = null;
      if (this.#loadTask === task) this.#loadTask = null;
    };
    void task.then(cleanupLoad, cleanupLoad);
    return task;
  }

  cancelLoading(): void {
    if (!this.#loadTask) return;

    this.#loadOperation += 1;
    this.#rejectLoad?.(
      new LocalRuntimeError("LOAD_CANCELLED", "O carregamento foi cancelado pelo visitante."),
    );
    this.#rejectLoad = null;
    this.#worker?.terminate();
    this.#worker = null;
    this.#engine = null;
    this.#loadTask = null;
  }

  async generate(
    prompt: string,
    onToken: RuntimeTokenHandler,
    externalSignal?: AbortSignal,
    options: RuntimeGenerationOptions = {},
  ): Promise<{ cancelled: boolean }> {
    const engine = this.#engine;
    if (!engine) {
      throw new LocalRuntimeError(
        "MODEL_NOT_READY",
        "O modelo local ainda não está carregado.",
      );
    }
    if (this.#generationTask) {
      throw new LocalRuntimeError(
        "GENERATION_FAILED",
        "Já existe uma geração em curso.",
      );
    }
    if (externalSignal?.aborted) {
      return { cancelled: true };
    }
    if (
      prompt.trim().length === 0 ||
      prompt.length > 16_000 ||
      (options.systemPrompt !== undefined && options.systemPrompt.length > 12_000)
    ) {
      throw new LocalRuntimeError(
        "GENERATION_FAILED",
        "O pedido excede os limites de contexto definidos para o modelo local.",
      );
    }

    const requestedTokens = Number.isFinite(options.maxTokens) ? options.maxTokens ?? 120 : 120;
    const requestedTemperature = Number.isFinite(options.temperature) ? options.temperature ?? 0.35 : 0.35;
    const requestedTopP = Number.isFinite(options.topP) ? options.topP ?? 0.85 : 0.85;
    const maxTokens = Math.max(32, Math.min(1_024, Math.floor(requestedTokens)));
    const temperature = Math.max(0, Math.min(1, requestedTemperature));
    const topP = Math.max(0.05, Math.min(1, requestedTopP));

    const controller = new AbortController();
    this.#generationController = controller;

    const relayAbort = () => controller.abort();
    if (externalSignal?.aborted) {
      controller.abort();
    } else {
      externalSignal?.addEventListener("abort", relayAbort, { once: true });
    }

    const interrupt = () => engine.interruptGenerate();
    controller.signal.addEventListener("abort", interrupt, { once: true });

    const messages: ChatCompletionMessageParam[] = [
      {
        role: "system",
        content:
          options.systemPrompt ??
          "És um motor local de geração de texto em fase de validação técnica. Responde de forma breve, clara e natural em português. Ainda não és o assistente final de Kutuzov e não deves afirmar que conheces dados pessoais ou profissionais que não tenham sido fornecidos nesta mensagem.",
      },
      { role: "user", content: prompt },
    ];

    const task = (async () => {
      try {
        const stream = await engine.chat.completions.create({
          messages,
          stream: true,
          temperature,
          top_p: topP,
          max_tokens: maxTokens,
        });

        for await (const chunk of stream as AsyncIterable<ChatCompletionChunk>) {
          if (controller.signal.aborted) break;
          const content = chunk.choices[0]?.delta?.content;
          if (typeof content === "string" && content.length > 0) onToken(content);
        }

        return { cancelled: controller.signal.aborted };
      } catch (error) {
        if (controller.signal.aborted) return { cancelled: true };
        throw new LocalRuntimeError(
          "GENERATION_FAILED",
          "O modelo não conseguiu concluir a geração. Pode tentar novamente.",
          { cause: error },
        );
      }
    })();

    this.#generationTask = task;
    const cleanupGeneration = () => {
      externalSignal?.removeEventListener("abort", relayAbort);
      controller.signal.removeEventListener("abort", interrupt);
      if (this.#generationController === controller) {
        this.#generationController = null;
      }
      if (this.#generationTask === task) this.#generationTask = null;
    };
    void task.then(cleanupGeneration, cleanupGeneration);
    return task;
  }

  cancelGeneration(): void {
    this.#generationController?.abort();
  }

  async clearModelCache(): Promise<void> {
    await this.release();
    const { deleteModelAllInfoInCache } = await import("@mlc-ai/web-llm");
    await deleteModelAllInfoInCache(LOCAL_MODEL_ID, LOCAL_MODEL_APP_CONFIG);
  }

  async release(): Promise<void> {
    if (this.#loadTask) this.cancelLoading();

    this.cancelGeneration();
    if (this.#generationTask) {
      await this.#generationTask.catch(() => ({ cancelled: true }));
    }

    const engine = this.#engine;
    this.#engine = null;

    try {
      await engine?.unload();
    } finally {
      this.#worker?.terminate();
      this.#worker = null;
    }
  }

  async dispose(): Promise<void> {
    await this.release();
  }
}
