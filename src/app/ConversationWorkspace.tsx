import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import { askGeminiAssistant, getGeminiAvailability } from "../agent/gemini-api";
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
import { buildDeterministicFallback } from "./conversation-utils";
import { ProjectDeck } from "./ProjectDeck";
import { VoicePill } from "./VoicePill";
import { useLiveVoice } from "../voice/live-session";

interface ChatMessage extends ConversationMessage { projects?: KnowledgeEntry[]; }

const SUGGESTIONS = [
  { label: "Conhecer o meu percurso", question: "Conta-me sobre o meu percurso profissional." },
  { label: "Explorar os meus projectos", question: "Quais são os projectos publicados no meu portefólio?" },
  { label: "Ver as marcas com que trabalhei", question: "Com que marcas trabalhei?" },
];

function createId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return "kj-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
}

function describeError(error: unknown): string {
  if (error instanceof MemoryStoreError) {
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

interface ConversationWorkspaceProps {
  historyEnabled: boolean;
  onBusyChange?: (busy: boolean) => void;
}

export function ConversationWorkspace({ historyEnabled, onBusyChange }: ConversationWorkspaceProps) {
  const store = useMemo(() => new LocalConversationStore(), []);
  const abortRef = useRef<AbortController | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const preferenceRef = useRef(historyEnabled);
  const [geminiStatus, setGeminiStatus] = useState<"checking" | "available" | "unavailable">("checking");
  const geminiAvailable = geminiStatus === "available";
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const voiceOutputRef = useRef("");
  const voice = useLiveVoice({
    onInputTranscript: (text) => setInput(text.slice(0, 2_000)),
    onOutputTranscript: (text) => {
      voiceOutputRef.current += text;
      setNotice(voiceOutputRef.current.slice(-600));
    },
    onError: (message) => setNotice(message),
  });

  useEffect(() => {
    let active = true;
    void getGeminiAvailability().then((remote) => {
      if (active) setGeminiStatus(remote.available ? "available" : "unavailable");
    }).catch(() => {
      if (active) setGeminiStatus("unavailable");
    });
    return () => {
      active = false;
      abortRef.current?.abort();
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
    onBusyChange?.(busy || voice.state === "processing" || voice.state === "listening" || voice.state === "speaking");
    return () => onBusyChange?.(false);
  }, [busy, onBusyChange, voice.state]);

  useEffect(() => {
    if (preferenceRef.current === historyEnabled) return;
    preferenceRef.current = historyEnabled;
    setCurrentSessionId(null);
    setHistoryOpen(false);
    if (historyEnabled) {
      setNotice("As próximas mensagens serão guardadas neste dispositivo.");
    } else {
      setNotice("As próximas mensagens não serão guardadas.");
    }
  }, [historyEnabled]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "end",
    });
  }, [messages, busy]);

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
      setNotice("Conversa recuperada.");
    } catch (reason) {
      setError(describeError(reason));
    }
  }

  function startNewConversation() {
    setCurrentSessionId(null);
    setMessages([]);
    setInput("");
    setNotice("");
    setHistoryOpen(false);
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
          for (const previous of previousMessages.slice(-6)) {
            await store.appendMessage(activeSessionId, {
              role: previous.role,
              content: previous.content,
              createdAt: previous.createdAt,
            });
          }
        }
        await store.appendMessage(activeSessionId, {
          role: "user",
          content: question,
          createdAt: userMessage.createdAt,
        });
        const savedHistory = await store.getAgentHistory(activeSessionId);
        history = savedHistory.slice(0, -1);
        void refreshSessions();
      } catch {
        activeSessionId = null;
        setCurrentSessionId(null);
        setNotice("Não consegui guardar esta conversa neste dispositivo. Pode continuar normalmente.");
      }
    } else {
      setCurrentSessionId(null);
    }

    let assistantMessage: ChatMessage;

    let canUseGemini = geminiAvailable;
    if (!canUseGemini) {
      const availability = await getGeminiAvailability();
      canUseGemini = availability.available;
      setGeminiStatus(availability.available ? "available" : "unavailable");
    }

    if (canUseGemini) {
      try {
        const result = await askGeminiAssistant(question, history, controller.signal);
        if (result.state === "cancelled") {
          assistantMessage = makeMessage("assistant", "A geração foi interrompida. Pode voltar a enviar a pergunta.");
        } else {
          const projects = searchKnowledge(question, {
            limit: 3,
            minScore: 2,
            kinds: ["project"],
          }).map((item) => item.record);
            ...makeMessage("assistant", result.response.answer),
            projects,
          };
        }
      } catch {
        if (controller.signal.aborted) {
          assistantMessage = makeMessage("assistant", "A geração foi interrompida. Pode voltar a enviar a pergunta.");
        } else {
          const fallback = buildDeterministicFallback(question);          assistantMessage = makeMessage("assistant", fallback.answer);
          assistantMessage.projects = fallback.projects;
          setNotice("Não consegui responder a tudo neste momento. Partilho a informação confirmada que encontrei.");
          setError("");
        }
      }
    } else {
      const fallback = buildDeterministicFallback(question);      assistantMessage = makeMessage("assistant", fallback.answer);
      assistantMessage.projects = fallback.projects;
    }

    if (controller.signal.aborted) {
      assistantMessage = makeMessage("assistant", "A resposta foi interrompida.");    }

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

    if (historyEnabled) {
      window.dispatchEvent(new Event("jarvis-memory-updated"));
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

  const assistantStatusText = geminiStatus === "checking" ? "A preparar" : geminiAvailable ? "Disponível" : "Informação publicada";

  return (
    <section className="conversation-workspace" aria-label="Conversa com Edmundo Kutuzov">
      <div className="chat-column">
        <div className="chat-toolbar">
          <div className="chat-toolbar__actions">
            {historyEnabled && sessions.length > 0 ? (
              <button className="text-control" type="button" aria-expanded={historyOpen} onClick={() => setHistoryOpen((open) => !open)}>Conversas anteriores</button>
            ) : null}
            <button className="new-chat-button" type="button" onClick={startNewConversation}>Nova conversa</button>
          </div>
        </div>

        {historyOpen && historyEnabled ? (
          <div className="history-popover" aria-label="Conversas anteriores">
            {sessions.map((session) => (
              <button type="button" key={session.id} onClick={() => void selectSession(session.id)}>
                <span>Conversa</span>
                <time dateTime={new Date(session.updatedAt).toISOString()}>
                  {new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(session.updatedAt)}
                </time>
              </button>
            ))}
          </div>
        ) : null}

        <div className="assistant-presence" data-testid="conversation-status" aria-label="Disponibilidade">
          <span className={geminiAvailable ? "assistant-presence__dot is-active" : "assistant-presence__dot"} />
          <span>{assistantStatusText}</span>
        </div>

        {error ? <p className="chat-error" role="alert">{error}</p> : null}
        {notice ? <p className="chat-notice" role="status">{notice}</p> : null}

        <div className="chat-transcript" aria-live="polite" aria-relevant="additions" aria-busy={busy}>
          {messages.length === 0 ? (
            <div className="welcome-state">
              <h3>Olá. Sou o Kutuzov.</h3>
              <p className="welcome-state__description">O que gostaria de conhecer sobre o meu percurso, os meus projectos ou o meu trabalho?</p>
              <div className="suggestion-grid">
                {SUGGESTIONS.map((suggestion) => (
                  <button type="button" key={suggestion.label} onClick={() => void submitQuestion(suggestion.question)}>
                    <span>{suggestion.label}</span><b aria-hidden="true">↗</b>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((message) => (
                <article className={message.role === "user" ? "chat-message chat-message--user" : "chat-message chat-message--assistant"} key={message.id}>
                  <div className="chat-message__meta"><span>{message.role === "user" ? "VOCÊ" : "KUTUZOV"}</span></div>
                  <p className="chat-message__body">{message.content}</p>
                  {message.projects && message.projects.length > 0 ? (
                    <ProjectDeck projects={message.projects} />
                  ) : null}
                </article>
              ))}
            </div>
          )}

          {busy ? (
            <div className="thinking-indicator" role="status">
              <span className="thinking-indicator__dots"><i /><i /><i /></span>
              <span>Estou a preparar uma resposta...</span>
            </div>
          ) : null}
          <div ref={transcriptEndRef} />
        </div>

        <form className="chat-composer" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="kutuzov-message">Escreva a sua mensagem</label>
          <div className="chat-composer__box">
            <textarea id="kutuzov-message" aria-label="Escreva a sua mensagem" value={input} onChange={(event) => setInput(event.target.value.slice(0, 2_000))} onKeyDown={handleInputKeyDown} placeholder="Escreva-me uma mensagem..." maxLength={2_000} rows={2} disabled={busy} />
            <div className="chat-composer__footer">
              <VoicePill
                state={voice.state}
                supported={voice.supported}
                onStart={() => { voiceOutputRef.current = ""; setNotice(""); void voice.start(); }}
                onStop={voice.stop}
              />
              <div>
                {busy ? <button className="button button--quiet" type="button" onClick={() => abortRef.current?.abort()}>Parar</button> : null}
                <button className="send-button" type="submit" disabled={!input.trim() || busy}>Enviar <span aria-hidden="true">↗</span></button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
