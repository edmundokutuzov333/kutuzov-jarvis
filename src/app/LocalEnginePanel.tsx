import { useEffect, useRef, useState } from "react";

import { ConversationMessageSchema } from "../domain/conversation";
import { inspectWebGpu, type WebGpuSupport } from "../platform/webgpu";
import { LocalInferenceRuntime, LocalRuntimeError } from "../runtime/local-runtime";
import { LOCAL_MODEL_METADATA } from "../runtime/model-config";

type PanelStatus =
  | "idle"
  | "checking"
  | "loading"
  | "ready"
  | "generating"
  | "releasing"
  | "error";

type CacheStatus = "unknown" | "checking" | "cached" | "not-cached" | "error";

function getErrorMessage(error: unknown): string {
  if (error instanceof LocalRuntimeError) return error.message;
  if (error instanceof Error) return error.message;
  return "Ocorreu um erro inesperado no motor local.";
}

export function LocalEnginePanel() {
  const runtimeRef = useRef<LocalInferenceRuntime | null>(null);
  if (runtimeRef.current === null) {
    runtimeRef.current = new LocalInferenceRuntime();
  }

  const abortControllerRef = useRef<AbortController | null>(null);
  const [status, setStatus] = useState<PanelStatus>("idle");
  const [capability, setCapability] = useState<WebGpuSupport | null>(null);
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>("unknown");
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("À espera de autorização para carregar o modelo.");
  const [prompt, setPrompt] = useState(
    "Escreve uma frase curta em português para confirmar que o motor local está a funcionar.",
  );
  const [answer, setAnswer] = useState("");
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const runtime = runtimeRef.current;
    return () => {
      abortControllerRef.current?.abort();
      void runtime?.dispose();
    };
  }, []);

  async function checkCompatibility() {
    setStatus("checking");
    setErrorMessage("");
    setNotice("");
    setCacheStatus("checking");

    const result = await inspectWebGpu();
    setCapability(result);

    setCacheStatus("unknown");
    if (result.status === "available") {
      setNotice("WebGPU está disponível. O runtime e os ficheiros do modelo só serão carregados depois de escolher Load local model.");
      setStatus(runtimeRef.current?.isReady ? "ready" : "idle");
    } else {
      setStatus("idle");
    }
  }

  async function checkModelCache() {
    setCacheStatus("checking");
    setErrorMessage("");
    try {
      const cached = await runtimeRef.current?.isModelCached();
      setCacheStatus(cached ? "cached" : "not-cached");
      setNotice(
        cached
          ? "Foram encontrados pesos do modelo na cache local. O browser pode removê-los mais tarde."
          : "Não foram encontrados pesos completos na cache. O carregamento terá de descarregar os artefactos.",
      );
    } catch (error) {
      setCacheStatus("error");
      setErrorMessage(getErrorMessage(error));
    }
  }

  async function loadModel() {
    if (capability?.status !== "available") return;

    setStatus("loading");
    setProgress(0);
    setProgressText("A preparar o motor WebLLM...");
    setErrorMessage("");
    setNotice("");

    try {
      await runtimeRef.current?.initialize((report) => {
        setProgress(Math.max(0, Math.min(100, Math.round(report.progress * 100))));
        setProgressText(report.text);
      });
      setStatus("ready");
      setCacheStatus("cached");
      setNotice("Modelo inicializado neste dispositivo. A inferência será executada localmente.");
    } catch (error) {
      if (error instanceof LocalRuntimeError && error.code === "LOAD_CANCELLED") {
        setStatus("idle");
        setNotice("O carregamento foi cancelado. Nenhuma inferência foi iniciada.");
        return;
      }
      setStatus("error");
      setErrorMessage(getErrorMessage(error));
    }
  }

  function cancelLoad() {
    runtimeRef.current?.cancelLoading();
    setStatus("idle");
    setNotice("Pedido de cancelamento enviado. O Worker de carregamento foi terminado.");
  }

  async function runLocalTest() {
    setErrorMessage("");
    setNotice("");
    setAnswer("");

    try {
      const validatedMessage = ConversationMessageSchema.parse({
        id: crypto.randomUUID(),
        role: "user",
        content: prompt,
        createdAt: Date.now(),
      });

      const controller = new AbortController();
      abortControllerRef.current = controller;
      setStatus("generating");

      const result = await runtimeRef.current?.generate(
        validatedMessage.content,
        (token) => setAnswer((current) => current + token),
        controller.signal,
      );

      setStatus("ready");
      setNotice(
        result?.cancelled
          ? "A geração foi interrompida."
          : "Geração concluída pelo modelo local.",
      );
    } catch (error) {
      setStatus(runtimeRef.current?.isReady ? "ready" : "error");
      setErrorMessage(getErrorMessage(error));
    } finally {
      abortControllerRef.current = null;
    }
  }

  function cancelGeneration() {
    abortControllerRef.current?.abort();
    runtimeRef.current?.cancelGeneration();
  }

  async function releaseModel() {
    setStatus("releasing");
    setErrorMessage("");
    try {
      await runtimeRef.current?.release();
      setStatus("idle");
      setNotice("O modelo foi descarregado da memória GPU. A cache dos ficheiros foi preservada.");
      setCacheStatus("cached");
    } catch (error) {
      setStatus("error");
      setErrorMessage(getErrorMessage(error));
    }
  }

  async function clearCache() {
    setStatus("releasing");
    setErrorMessage("");
    try {
      await runtimeRef.current?.clearModelCache();
      setCacheStatus("not-cached");
      setStatus("idle");
      setNotice("Os artefactos do modelo foram removidos da cache deste browser.");
    } catch (error) {
      setStatus("error");
      setErrorMessage(getErrorMessage(error));
    }
  }

  const canLoad = capability?.status === "available" && status === "idle";
  const isBusy =
    status === "checking" ||
    status === "loading" ||
    status === "generating" ||
    status === "releasing";

  return (
    <section className="engine-panel" aria-labelledby="engine-title">
      <div className="engine-panel__heading">
        <div>
          <p className="eyebrow">LOCAL INTELLIGENCE ENGINE / PHASE 03</p>
          <h2 id="engine-title">Run on this device.</h2>
          <p className="engine-panel__description">
            O modelo só é descarregado depois de escolher carregar. A inferência ocorre no browser, sem API remota.
          </p>
        </div>
        <span className="engine-panel__badge">WEBGPU / LOCAL</span>
      </div>

      <div className="model-strip">
        <div>
          <span className="model-strip__label">SELECTED MODEL</span>
          <strong>{LOCAL_MODEL_METADATA.name}</strong>
          <span className="model-strip__subline">
            {LOCAL_MODEL_METADATA.quantization} · {LOCAL_MODEL_METADATA.contextWindow.toLocaleString("en-US")} context
          </span>
        </div>
        <div className="model-strip__size">
          <strong>≈ {LOCAL_MODEL_METADATA.approximateListedArtifactSizeMb} MB</strong>
          <span>artefactos listados</span>
        </div>
      </div>

      <div className="engine-status">
        <div className="engine-status__row">
          <span className="engine-status__label">DEVICE COMPATIBILITY</span>
          <span className={capability?.status === "available" ? "engine-status__value is-ready" : "engine-status__value"}>
            {capability?.status === "available"
              ? "WEBGPU AVAILABLE"
              : capability?.status === "unavailable"
                ? "NOT AVAILABLE"
                : "NOT CHECKED"}
          </span>
        </div>
        {capability?.status === "available" ? (
          <div className="gpu-details">
            <span>{capability.adapter.vendor || "GPU vendor unavailable"}</span>
            <span>{capability.adapter.architecture || "Architecture unavailable"}</span>
            <span>
              Buffer limit: {capability.adapter.maxStorageBufferBindingSize === null
                ? "unknown"
                : Math.round(capability.adapter.maxStorageBufferBindingSize / 1_048_576) + " MB"}
            </span>
            <span>shader-f16: {capability.adapter.shaderF16 ? "yes" : "not exposed"}</span>
          </div>
        ) : capability?.status === "unavailable" ? (
          <p className="engine-panel__notice">{capability.message}</p>
        ) : (
          <p className="engine-panel__notice">
            Verifique primeiro se este browser e o equipamento disponibilizam WebGPU.
          </p>
        )}
        <div className="engine-status__row engine-status__row--cache">
          <span className="engine-status__label">LOCAL MODEL CACHE</span>
          <span className="engine-status__value">
            {cacheStatus === "checking"
              ? "CHECKING"
              : cacheStatus === "cached"
                ? "WEIGHTS FOUND"
                : cacheStatus === "not-cached"
                  ? "NOT FOUND"
                  : cacheStatus === "error"
                    ? "UNKNOWN"
                    : "NOT CHECKED"}
          </span>
        </div>
      </div>

      {status === "loading" ? (
        <div className="load-progress" aria-live="polite">
          <div className="load-progress__top">
            <span>{progressText}</span>
            <strong>{progress}%</strong>
          </div>
          <div
            className="load-progress__track"
            role="progressbar"
            aria-label="Model download and initialization progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <span style={{ width: progress + "%" }} />
          </div>
        </div>
      ) : null}

      {status === "ready" || status === "generating" ? (
        <div className="local-test">
          <label className="model-strip__label" htmlFor="local-test-prompt">
            LOCAL GENERATION TEST
          </label>
          <textarea
            id="local-test-prompt"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            maxLength={2000}
            rows={3}
            disabled={status === "generating"}
          />
          <div className="local-test__actions">
            {status === "generating" ? (
              <button className="button button--quiet" type="button" onClick={cancelGeneration}>
                Stop generation
              </button>
            ) : (
              <button className="button button--primary" type="button" onClick={() => void runLocalTest()} disabled={!prompt.trim()}>
                Generate locally
              </button>
            )}
            <button className="button button--quiet" type="button" onClick={() => void releaseModel()} disabled={isBusy}>
              Unload GPU model
            </button>
          </div>
          {answer ? (
            <div className="local-answer" aria-live="polite">
              <span className="model-strip__label">MODEL OUTPUT</span>
              <p>{answer}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="engine-panel__actions">
        {status === "loading" ? (
          <button className="button button--quiet" type="button" onClick={cancelLoad}>
            Cancel loading
          </button>
        ) : (
          <>
            <button
              className="button button--quiet"
              type="button"
              onClick={() => void checkCompatibility()}
              disabled={isBusy}
            >
              Check this device
            </button>
            {capability?.status === "available" && status === "idle" ? (
              <button className="button button--quiet" type="button" onClick={() => void checkModelCache()}>
                Check local cache
              </button>
            ) : null}
            {canLoad ? (
              <button className="button button--primary" type="button" onClick={() => void loadModel()}>
                Load local model
              </button>
            ) : null}
          </>
        )}
        {cacheStatus === "cached" || status === "ready" ? (
          <button className="button button--text" type="button" onClick={() => void clearCache()} disabled={isBusy}>
            Clear model cache
          </button>
        ) : null}
      </div>

      {notice ? <p className="engine-panel__feedback" role="status">{notice}</p> : null}
      {errorMessage ? <p className="engine-panel__error" role="alert">{errorMessage}</p> : null}

      <p className="engine-panel__footnote">
        Os ficheiros são obtidos de Hugging Face e do registry de artefactos SkillSafe AI. Isto é distribuição de pesos, não inferência na cloud. O browser pode remover a cache. O modelo ainda não contém a Knowledge Base de Kutuzov.
      </p>
    </section>
  );
}
