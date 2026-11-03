import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import { AgentCoreError, runAgentTurn } from "../agent/agent-core";
import type { AgentReference } from "../agent/response";
import type { AgentModelPort } from "../agent/model-port";
import {
  ACTION_REGISTRY,
  dispatchAction,
} from "../actions";
import type { PortfolioActionProposal } from "../actions/schemas";
import {
  DemoPortfolioHostAdapter,
  type DemoPortfolioState,
} from "../actions/host";
import {
  ConversationMessageSchema,
  type ConversationMessage,
} from "../domain/conversation";
import {
  LocalConversationStore,
  MemoryStoreError,
  type ConversationSession,
  type StoredConversationMessage,
} from "../memory";
import { searchKnowledge } from "../knowledge/search";
import type { KnowledgeEntry } from "../knowledge/schema";
import { inspectWebGpu, type WebGpuSupport } from "../platform/webgpu";
import { LocalInferenceRuntime, LocalRuntimeError } from "../runtime/local-runtime";
import { LOCAL_MODEL_METADATA } from "../runtime/model-config";
import { buildDeterministicFallback } from "./conversation-utils";

interface ChatMessage extends ConversationMessage {
  references?: AgentReference[];
  projects?: KnowledgeEntry[];
  mode?: "local-ai" | "deterministic";
  actionProposal?: PortfolioActionProposal | null;
  actionResult?: string | undefined;
  actionStatus?: "executed" | "rejected" | "declined" | undefined;
}

type ModelStatus = "checking" | "unsupported" | "idle" | "loading" | "ready" | "error";

const SUGGESTIONS = [
  "Quem é Kutuzov?",
  "Quais são os principais projectos?",
  "Com que marcas trabalhou?",
  "Que serviços disponibiliza?",
];

function createId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return "kj-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
}

function describeError(error: unknown): string {
  if (error instanceof MemoryStoreError || error instanceof LocalRuntimeError || error instanceof AgentCoreError) {
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Ocorreu um erro inesperado. Tente novamente.";
}

function toChatMessage(message: StoredConversationMessage): ChatMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    createdAt: message.createdAt,
  };
}

function makeMessage(role: ConversationMessage["role"], content: string): ChatMessage {
  return ConversationMessageSchema.parse({
    id: createId(),
    role,
    content,
    createdAt: Date.now(),
  });
}

function getActionTitle(proposal: PortfolioActionProposal): string {
  return ACTION_REGISTRY.find((item) => item.id === proposal.action)?.title ?? "Acção autorizada";
}

function getProjectMetadata(record: KnowledgeEntry, key: string): string {
  const value = record.metadata[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

interface ConversationWorkspaceProps {
  historyEnabled: boolean;
}

export function ConversationWorkspace({ historyEnabled }: ConversationWorkspaceProps) {
  const store = useMemo(() => new LocalConversationStore(), []);
  const host = useMemo(() => new DemoPortfolioHostAdapter(), []);
  const runtimeRef = useRef<LocalInferenceRuntime | null>(null);
  if (runtimeRef.current === null) runtimeRef.current = new LocalInferenceRuntime();

  const abortRef = useRef<AbortController | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const preferenceRef = useRef(historyEnabled);
  const [modelStatus, setModelStatus] = useState<ModelStatus>("checking");
  const [capability, setCapability] = useState<WebGpuSupport | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadMessage, setLoadMessage] = useState("A verificar a compatibilidade deste browser.");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sandboxState, setSandboxState] = useState<DemoPortfolioState>(() => ({
    ...host.getSnapshot(),
  }));

  useEffect(() => {
    let active = true;
    void inspectWebGpu().then((result) => {
      if (!active) return;
      setCapability(result);
      setModelStatus(result.status === "available" ? "idle" : "unsupported");
      setLoadMessage(
        result.status === "available"
          ? "WebGPU disponível. O modelo só será descarregado após a sua autorização."
          : "WebGPU não está disponível. A pesquisa local continua funcional.",
      );
    }).catch((reason: unknown) => {
      if (!active) return;
      setModelStatus("unsupported");
      setLoadMessage(describeError(reason));
    });

    return () => {
      active = false;
      abortRef.current?.abort();
      void runtimeRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!historyEnabled) return;

    void store.listSessions().then(async (availableSessions) => {
      if (!active) return;
      setSessions(availableSessions);
      const latest = availableSessions[0];
      if (!latest) return;
      const storedMessages = await store.getMessages(latest.id);
      if (!active) return;
      setCurrentSessionId(latest.id);
      setMessages(storedMessages.map(toChatMessage));
    }).catch((reason: unknown) => {
      if (active) setNotice(describeError(reason));
    });

    return () => {
      active = false;
    };
  }, [historyEnabled, store]);

  useEffect(() => {
    if (preferenceRef.current === historyEnabled) return;
    preferenceRef.current = historyEnabled;
    setCurrentSessionId(null);
    setHistoryOpen(false);
    if (historyEnabled) {
      setMessages([]);
      setNotice("Histórico activado. A nova conversa começará a ser guardada a partir da próxima mensagem.");
    } else {
      setNotice("Histórico desactivado. As próximas mensagens ficam apenas nesta sessão do browser.");
    }
  }, [historyEnabled]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "end",
    });
  }, [messages, busy]);

  async function loadModel() {
    setModelStatus("loading");
    setLoadProgress(0);
    setError("");
    setNotice("");
    setLoadMessage("A preparar o motor WebLLM...");
    try {
      await runtimeRef.current?.initialize((report) => {
        setLoadProgress(Math.max(0, Math.min(100, Math.round(report.progress * 100))));
        setLoadMessage(report.text);
      });
      setModelStatus("ready");
      setLoadMessage("Modelo inicializado. As respostas com IA são geradas neste dispositivo.");
    } catch (reason) {
      if (reason instanceof LocalRuntimeError && reason.code === "LOAD_CANCELLED") {
        setModelStatus(capability?.status === "available" ? "idle" : "unsupported");
        setLoadMessage("O carregamento foi cancelado.");
        return;
      }
      setModelStatus("error");
      setError(describeError(reason));
    }
  }

  function cancelModelLoad() {
    runtimeRef.current?.cancelLoading();
    setModelStatus(capability?.status === "available" ? "idle" : "unsupported");
    setLoadMessage("Pedido de cancelamento enviado.");
  }

  async function releaseModel() {
    setModelStatus("checking");
    try {
      await runtimeRef.current?.release();
      setModelStatus(capability?.status === "available" ? "idle" : "unsupported");
      setLoadMessage("Modelo removido da memória GPU. Os ficheiros em cache foram preservados.");
    } catch (reason) {
      setModelStatus("error");
      setError(describeError(reason));
    }
  }

  async function refreshSessions() {
    if (!historyEnabled) return;
    try {
      setSessions(await store.listSessions());
    } catch (reason) {
      setNotice(describeError(reason));
    }
  }

  async function selectSession(sessionId: string) {
    setError("");
    try {
      const storedMessages = await store.getMessages(sessionId);
      setCurrentSessionId(sessionId);
      setMessages(storedMessages.map(toChatMessage));
      setHistoryOpen(false);
      setNotice("Conversa local recuperada deste browser.");
    } catch (reason) {
      setError(describeError(reason));
    }
  }

  function startNewConversation() {
    setCurrentSessionId(null);
    setMessages([]);
    setInput("");
    setNotice(historyEnabled
      ? "Nova conversa. O histórico será guardado localmente quando enviar a primeira mensagem."
      : "Nova conversa temporária. O histórico local está desactivado.");
    setHistoryOpen(false);
  }

  async function confirmAction(messageId: string, proposal: PortfolioActionProposal) {
    const result = await dispatchAction(proposal, host, { confirmed: true });
    setSandboxState({ ...host.getSnapshot() });
    setMessages((current) => current.map((message) => message.id === messageId
      ? {
          ...message,
          actionStatus: result.status,
          actionResult: result.message,
        }
      : message));
  }

  async function submitQuestion(rawQuestion: string) {
    const question = rawQuestion.trim();
    if (!question || busy) return;
    if (question.length > 2_000) {
      setError("A pergunta excede o limite de 2.000 caracteres.");
      return;
    }

    const userMessage = makeMessage("user", question);
    const previousMessages = messages;
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setBusy(true);
    setError("");
    setNotice("");

    const controller = new AbortController();
    abortRef.current = controller;

    let activeSessionId = currentSessionId;
    let history: Array<{ role: "user" | "assistant"; content: string }> =
      previousMessages.slice(-6).map((message) => ({
        role: message.role,
        content: message.content.slice(0, 500),
      }));

    if (historyEnabled) {
      try {
        if (!activeSessionId) {
          const session = await store.createSession();
          activeSessionId = session.id;
          setCurrentSessionId(session.id);
        }
        await store.appendMessage(activeSessionId, {
          role: "user",
          content: question,
          createdAt: userMessage.createdAt,
        });
        const savedHistory = await store.getAgentHistory(activeSessionId);
        history = savedHistory.slice(0, -1);
        void refreshSessions();
      } catch (reason) {
        activeSessionId = null;
        setCurrentSessionId(null);
        setNotice("Não foi possível guardar esta mensagem. A conversa continuará apenas nesta sessão. " + describeError(reason));
      }
    } else {
      setCurrentSessionId(null);
    }

    let assistantMessage: ChatMessage;

    if (runtimeRef.current?.isReady) {
      const modelPort: AgentModelPort = {
        generate: (request) => runtimeRef.current!.generate(
          request.userPrompt,
          request.onToken,
          request.signal,
          {
            systemPrompt: request.systemPrompt,
            maxTokens: request.maxTokens,
            temperature: request.temperature,
            topP: request.topP,
          },
        ),
      };

      try {
        const result = await runAgentTurn(question, {
          model: modelPort,
          history,
          signal: controller.signal,
        });
        if (result.state === "cancelled") {
          assistantMessage = makeMessage("assistant", "A geração foi interrompida. Pode voltar a enviar a pergunta.");
        } else {
          const projects = searchKnowledge(question, {
            limit: 3,
            minScore: 2,
            kinds: ["project"],
          }).map((item) => item.record);
          assistantMessage = {
            ...makeMessage("assistant", result.response.answer),
            references: result.response.references,
            projects,
            mode: "local-ai",
            actionProposal: result.response.actionProposal,
          };
        }
      } catch (reason) {
        const fallback = buildDeterministicFallback(question);
        assistantMessage = {
          ...makeMessage("assistant", fallback.answer),
          references: fallback.references,
          projects: fallback.projects,
          actionProposal: fallback.actionProposal,
          mode: "deterministic",
        };
        setNotice(
          "A resposta do modelo local não passou pela validação ou não pôde ser concluída. A pesquisa determinística foi usada em alternativa.",
        );
        setError(describeError(reason));
      }
    } else {
      const fallback = buildDeterministicFallback(question);
      assistantMessage = {
        ...makeMessage("assistant", fallback.answer),
        references: fallback.references,
        projects: fallback.projects,
        actionProposal: fallback.actionProposal,
        mode: "deterministic",
      };
    }

    if (controller.signal.aborted && !assistantMessage.content) {
      assistantMessage = makeMessage("assistant", "A geração foi interrompida.");
    }

    setMessages((current) => [...current, assistantMessage]);

    if (historyEnabled && activeSessionId) {
      try {
        await store.appendMessage(activeSessionId, {
          role: "assistant",
          content: assistantMessage.content.slice(0, 2_000),
          createdAt: assistantMessage.createdAt,
        });
        void refreshSessions();
      } catch (reason) {
        setNotice("A resposta foi apresentada, mas não ficou guardada no histórico local. " + describeError(reason));
      }
    }

    abortRef.current = null;
    setBusy(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitQuestion(input);
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submitQuestion(input);
    }
  }

  const modelLabel = modelStatus === "ready"
    ? "IA LOCAL ACTIVA"
    : modelStatus === "loading"
      ? "A CARREGAR MODELO"
      : modelStatus === "checking"
        ? "A VERIFICAR"
        : modelStatus === "unsupported"
          ? "PESQUISA LOCAL"
          : modelStatus === "error"
            ? "MODELO INDISPONÍVEL"
            : "MODELO NÃO CARREGADO";

  return (
    <section className="conversation-workspace" aria-label="Conversa com Kutuzov JARVIS">
      <aside className="conversation-rail">
        <div className="rail-profile">
          <div className="rail-avatar" aria-hidden="true">K.</div>
          <div>
            <strong>KUTUZOV JARVIS</strong>
            <span>ASSISTENTE DIGITAL</span>
          </div>
        </div>

        <div className="rail-section">
          <p className="rail-label">ESTADO DO SISTEMA</p>
          <div className="rail-status">
            <span className={modelStatus === "ready" ? "rail-status__dot is-active" : "rail-status__dot"} />
            <span>{modelLabel}</span>
          </div>
          <p className="rail-copy">
            {modelStatus === "ready"
              ? "O Qwen3 está carregado e a inferência ocorre localmente."
              : "Sem descarregar qualquer modelo, a pesquisa determinística continua disponível."}
          </p>
        </div>

        <div className="rail-divider" />

        <div className="rail-section">
          <p className="rail-label">MODO DE OPERAÇÃO</p>
          <div className="rail-fact"><span>Inference</span><strong>Browser-first</strong></div>
          <div className="rail-fact"><span>AI API</span><strong>Zero</strong></div>
          <div className="rail-fact"><span>Knowledge</span><strong>Local snapshot</strong></div>
          <div className="rail-fact"><span>Memory</span><strong>{historyEnabled ? "Opt-in active" : "Not stored"}</strong></div>
        </div>

        <div className="rail-bottom">
          <span className="rail-label">PORTFOLIO CONNECTION</span>
          <strong>NOT CONNECTED</strong>
          <p>As acções disponíveis nesta versão usam exclusivamente um adaptador sandbox.</p>
        </div>
      </aside>

      <div className="chat-column">
        <div className="chat-toolbar">
          <div>
            <p className="rail-label">PERSONAL KNOWLEDGE INTERFACE</p>
            <h2>Conversa</h2>
          </div>
          <div className="chat-toolbar__actions">
            {historyEnabled ? (
              <button
                className="text-control"
                type="button"
                aria-expanded={historyOpen}
                onClick={() => setHistoryOpen((open) => !open)}
              >
                Histórico local <span>{sessions.length}</span>
              </button>
            ) : (
              <span className="toolbar-note">SESSÃO TEMPORÁRIA</span>
            )}
            <button className="new-chat-button" type="button" onClick={startNewConversation}>
              + Nova conversa
            </button>
          </div>
        </div>

        {historyOpen && historyEnabled ? (
          <div className="history-popover" aria-label="Conversas guardadas localmente">
            {sessions.length === 0 ? (
              <p>Ainda não existem conversas guardadas.</p>
            ) : (
              sessions.map((session) => (
                <button
                  type="button"
                  key={session.id}
                  onClick={() => void selectSession(session.id)}
                >
                  <span>Conversa local</span>
                  <time dateTime={new Date(session.updatedAt).toISOString()}>
                    {new Intl.DateTimeFormat("pt-PT", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    }).format(session.updatedAt)}
                  </time>
                </button>
              ))
            )}
          </div>
        ) : null}

        <div className="model-control" aria-label="Estado do modelo local">
          <div className="model-control__identity">
            <span className={modelStatus === "ready" ? "model-indicator is-ready" : "model-indicator"} />
            <div>
              <strong>{LOCAL_MODEL_METADATA.name} <span>{LOCAL_MODEL_METADATA.quantization}</span></strong>
              <small>{LOCAL_MODEL_METADATA.approximateListedArtifactSizeMb} MB listados · {LOCAL_MODEL_METADATA.contextWindow.toLocaleString("pt-PT")} tokens de contexto</small>
            </div>
          </div>
          <div className="model-control__actions">
            {modelStatus === "checking" ? (
              <span className="toolbar-note">A verificar WebGPU...</span>
            ) : modelStatus === "loading" ? (
              <button className="button button--quiet" type="button" onClick={cancelModelLoad}>Cancelar</button>
            ) : modelStatus === "ready" ? (
              <button className="button button--quiet" type="button" onClick={() => void releaseModel()}>Libertar GPU</button>
            ) : capability?.status === "available" ? (
              <button className="button button--primary" type="button" onClick={() => void loadModel()}>
                Carregar modelo local
              </button>
            ) : (
              <span className="toolbar-note">WebGPU indisponível</span>
            )}
          </div>
        </div>

        {modelStatus === "loading" ? (
          <div className="model-progress" aria-live="polite">
            <div><span>{loadMessage}</span><strong>{loadProgress}%</strong></div>
            <div className="model-progress__track" role="progressbar" aria-label="Progresso do carregamento do modelo" aria-valuemin={0} aria-valuemax={100} aria-valuenow={loadProgress}>
              <span style={{ width: loadProgress + "%" }} />
            </div>
          </div>
        ) : null}

        {modelStatus === "unsupported" ? (
          <p className="mode-explanation" role="status">
            {capability?.status === "unavailable"
              ? capability.message
              : "Este browser não disponibiliza WebGPU. Está activo o modo de pesquisa determinística, sem inferência artificial."}
          </p>
        ) : null}

        {error ? <p className="chat-error" role="alert">{error}</p> : null}
        {notice ? <p className="chat-notice" role="status">{notice}</p> : null}

        <div className="chat-transcript" aria-live="polite" aria-relevant="additions" aria-busy={busy}>
          {messages.length === 0 ? (
            <div className="welcome-state">
              <div className="welcome-state__index"><span>01</span><span>INÍCIO DE SESSÃO</span></div>
              <p className="welcome-state__eyebrow">KUTUZOV / PERSONAL INTELLIGENCE</p>
              <h3>O que gostaria de conhecer sobre Kutuzov?</h3>
              <p className="welcome-state__description">
                Percurso profissional, projectos, marcas, competências, serviços e abordagem criativa. As respostas factuais usam apenas informação publicada e verificada.
              </p>
              <div className="suggestion-grid">
                {SUGGESTIONS.map((suggestion, index) => (
                  <button
                    type="button"
                    key={suggestion}
                    onClick={() => void submitQuestion(suggestion)}
                  >
                    <span>0{index + 1}</span>{suggestion}<b aria-hidden="true">↗</b>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((message) => (
                <article className={message.role === "user" ? "chat-message chat-message--user" : "chat-message chat-message--assistant"} key={message.id}>
                  <div className="chat-message__meta">
                    <span>{message.role === "user" ? "VOCÊ" : "JARVIS"}</span>
                    <time dateTime={new Date(message.createdAt).toISOString()}>
                      {new Intl.DateTimeFormat("pt-PT", {
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(message.createdAt)}
                    </time>
                    {message.mode === "local-ai" ? <span className="message-mode">IA LOCAL</span> : null}
                    {message.mode === "deterministic" ? <span className="message-mode">PESQUISA LOCAL</span> : null}
                  </div>
                  <p className="chat-message__body">{message.content}</p>

                  {message.projects && message.projects.length > 0 ? (
                    <div className="project-card-grid" aria-label="Projectos relacionados">
                      {message.projects.map((project) => {
                        const slug = getProjectMetadata(project, "slug");
                        return (
                          <article className="project-card" key={project.id}>
                            <span className="project-card__kind">PROJECT / {getProjectMetadata(project, "year") || "PUBLICADO"}</span>
                            <h4>{project.title}</h4>
                            <p>{getProjectMetadata(project, "client")}</p>
                            <div className="project-card__footer">
                              <span>{getProjectMetadata(project, "discipline")}</span>
                              {slug ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const proposal = {
                                      action: "OPEN_PROJECT",
                                      parameters: { slug },
                                    } as PortfolioActionProposal;
                                    setMessages((current) => current.map((item) => item.id === message.id
                                      ? { ...item, actionProposal: proposal, actionStatus: undefined, actionResult: undefined }
                                      : item));
                                  }}
                                >
                                  Preparar abertura ↗
                                </button>
                              ) : null}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : null}

                  {message.references && message.references.length > 0 ? (
                    <div className="reference-list">
                      <p className="rail-label">FONTES CONSULTADAS</p>
                      {message.references.map((reference) => (
                        <div className="reference-item" key={reference.recordId}>
                          <span className="reference-item__mark">↗</span>
                          <div>
                            <strong>{reference.label}</strong>
                            <small>{reference.path} · snapshot {reference.capturedAt}</small>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {message.actionProposal ? (
                    <div className="action-confirmation">
                      <div className="action-confirmation__top">
                        <span className="rail-label">ACÇÃO PROPOSTA</span>
                        <span className="sandbox-tag">SANDBOX ONLY</span>
                      </div>
                      <strong>{getActionTitle(message.actionProposal)}</strong>
                      <p>
                        {message.actionStatus === "executed"
                          ? "Comando enviado para o adaptador de demonstração."
                          : "A acção não altera o portefólio oficial. Confirme apenas se pretende testar o comando no ambiente isolado."}
                      </p>
                      {message.actionResult ? (
                        <p className="action-confirmation__result" role="status">{message.actionResult}</p>
                      ) : null}
                      {message.actionStatus === undefined ? (
                        <div className="action-confirmation__buttons">
                          <button
                            type="button"
                            className="button button--primary"
                            onClick={() => void confirmAction(message.id, message.actionProposal!)}
                          >
                            Confirmar no sandbox
                          </button>
                          <button
                            type="button"
                            className="button button--quiet"
                            onClick={() => setMessages((current) => current.map((item) => item.id === message.id
                              ? { ...item, actionProposal: null, actionStatus: "declined", actionResult: "Acção recusada pelo visitante." }
                              : item))}
                          >
                            Recusar
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          )}

          {busy ? (
            <div className="thinking-indicator" role="status">
              <span className="thinking-indicator__dots"><i /><i /><i /></span>
              <span>{modelStatus === "ready" ? "A gerar e validar a resposta no dispositivo..." : "A pesquisar a base de conhecimento local..."}</span>
            </div>
          ) : null}
          <div ref={transcriptEndRef} />
        </div>

        {sandboxState.view !== "home" ? (
          <div className="sandbox-feedback" role="status">
            <span className="sandbox-tag">DEMO STATE</span>
            <strong>{sandboxState.view}</strong>
            {sandboxState.projectCategory ? <span>{sandboxState.projectCategory}</span> : null}
            {sandboxState.activeProjectSlug ? <span>{sandboxState.activeProjectSlug}</span> : null}
            <span>Esta alteração existe apenas em memória nesta demonstração.</span>
          </div>
        ) : null}

        <form className="chat-composer" onSubmit={handleSubmit}>
          <label htmlFor="jarvis-message">Escreva a sua pergunta</label>
          <div className="chat-composer__box">
            <textarea
              id="jarvis-message"
              value={input}
              onChange={(event) => setInput(event.target.value.slice(0, 2_000))}
              onKeyDown={handleInputKeyDown}
              placeholder="Pergunte sobre o percurso, os projectos ou os serviços..."
              maxLength={2_000}
              rows={2}
              disabled={busy}
            />
            <div className="chat-composer__footer">
              <span>{input.length.toLocaleString("pt-PT")} / 2.000 · Shift + Enter para nova linha</span>
              <div>
                {busy ? (
                  <button className="button button--quiet" type="button" onClick={() => {
                    abortRef.current?.abort();
                    runtimeRef.current?.cancelGeneration();
                  }}>
                    Parar
                  </button>
                ) : null}
                <button className="send-button" type="submit" disabled={!input.trim() || busy}>
                  Enviar <span aria-hidden="true">↗</span>
                </button>
              </div>
            </div>
          </div>
        </form>

        <div className="chat-footnote">
          <span>JARVIS NÃO É KUTUZOV. É UM ASSISTENTE DIGITAL.</span>
          <span>{modelStatus === "ready" ? "INFERÊNCIA LOCAL ACTIVA" : "MODO DETERMINÍSTICO / SEM MODELO"}</span>
        </div>
      </div>
    </section>
  );
}
