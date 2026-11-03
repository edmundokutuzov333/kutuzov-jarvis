import { ConversationMessageSchema } from "../domain/conversation";
import {
  ConversationSessionSchema,
  ConversationSettingsSchema,
  MAX_SESSION_AGE_DAYS,
  MAX_STORED_MESSAGES_PER_SESSION,
  MAX_STORED_SESSIONS,
  MEMORY_DATABASE_NAME,
  MEMORY_DATABASE_VERSION,
  MEMORY_SETTINGS_KEY,
  MemoryStoreError,
  StoredConversationMessageSchema,
  type ConversationSession,
  type ConversationSettings,
  type NewConversationMessage,
  type StoredConversationMessage,
} from "./contracts";
import { toAgentHistory } from "./policy";
import type { AgentHistoryMessage } from "../agent/contracts";

const SESSIONS_STORE = "sessions";
const MESSAGES_STORE = "messages";
const SETTINGS_STORE = "settings";
const SESSION_INDEX = "bySessionId";

function createId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return "kj-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 14);
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

function transactionResult(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted."));
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed."));
  });
}

function deleteSessionMessages(transaction: IDBTransaction, sessionId: string): void {
  const index = transaction.objectStore(MESSAGES_STORE).index(SESSION_INDEX);
  const request = index.openCursor(IDBKeyRange.only(sessionId));
  request.onsuccess = () => {
    const cursor = request.result;
    if (!cursor) return;
    cursor.delete();
    cursor.continue();
  };
}

export interface LocalMemoryStatus {
  historyEnabled: boolean;
  sessionCount: number;
  messageCount: number;
}

export class LocalConversationStore {
  private databasePromise: Promise<IDBDatabase> | null = null;
  private readonly factory: IDBFactory | undefined;
  private readonly databaseName: string;

  constructor(options: { factory?: IDBFactory; databaseName?: string } = {}) {
    this.factory = options.factory ?? globalThis.indexedDB;
    this.databaseName = options.databaseName ?? MEMORY_DATABASE_NAME;
  }

  private getFactory(): IDBFactory {
    const factory = this.factory ?? globalThis.indexedDB;
    if (!factory) {
      throw new MemoryStoreError(
        "INDEXEDDB_UNAVAILABLE",
        "Este browser não disponibiliza IndexedDB. O histórico local não pode ser guardado.",
      );
    }
    return factory;
  }

  private openDatabase(): Promise<IDBDatabase> {
    if (this.databasePromise) return this.databasePromise;

    let factory: IDBFactory;
    try {
      factory = this.getFactory();
    } catch (error) {
      return Promise.reject(error);
    }

    const promise = new Promise<IDBDatabase>((resolve, reject) => {
      let request: IDBOpenDBRequest;
      try {
        request = factory.open(this.databaseName, MEMORY_DATABASE_VERSION);
      } catch (error) {
        reject(new MemoryStoreError(
          "DATABASE_OPEN_FAILED",
          "Não foi possível abrir o armazenamento local deste browser.",
          { cause: error },
        ));
        return;
      }

      let settled = false;
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(SESSIONS_STORE)) {
          const sessions = database.createObjectStore(SESSIONS_STORE, { keyPath: "id" });
          sessions.createIndex("byUpdatedAt", "updatedAt");
        }
        if (!database.objectStoreNames.contains(MESSAGES_STORE)) {
          const messages = database.createObjectStore(MESSAGES_STORE, { keyPath: "id" });
          messages.createIndex(SESSION_INDEX, "sessionId");
          messages.createIndex("byCreatedAt", "createdAt");
        }
        if (!database.objectStoreNames.contains(SETTINGS_STORE)) {
          database.createObjectStore(SETTINGS_STORE, { keyPath: "id" });
        }
      };
      request.onblocked = () => {
        if (settled) return;
        settled = true;
        reject(new MemoryStoreError(
          "DATABASE_BLOCKED",
          "O armazenamento está aberto noutra janela. Feche outras janelas do JARVIS e tente novamente.",
        ));
      };
      request.onerror = () => {
        if (settled) return;
        settled = true;
        reject(new MemoryStoreError(
          "DATABASE_OPEN_FAILED",
          "O browser recusou abrir o armazenamento local.",
          { cause: request.error ?? undefined },
        ));
      };
      request.onsuccess = () => {
        const database = request.result;
        if (settled) {
          database.close();
          return;
        }
        settled = true;
        database.onversionchange = () => {
          database.close();
          this.databasePromise = null;
        };
        resolve(database);
      };
    });

    this.databasePromise = promise.catch((error: unknown) => {
      this.databasePromise = null;
      if (error instanceof MemoryStoreError) throw error;
      throw new MemoryStoreError(
        "DATABASE_OPEN_FAILED",
        "Falha ao iniciar o armazenamento local.",
        { cause: error },
      );
    });
    return this.databasePromise;
  }

  private async pruneExpiredSessions(): Promise<void> {
    const database = await this.openDatabase();
    const transaction = database.transaction([SESSIONS_STORE, MESSAGES_STORE], "readwrite");
    const done = transactionResult(transaction);
    const sessions = transaction.objectStore(SESSIONS_STORE);
    const request = sessions.getAll();
    request.onsuccess = () => {
      const cutoff = Date.now() - MAX_SESSION_AGE_DAYS * 24 * 60 * 60 * 1_000;
      for (const session of request.result as ConversationSession[]) {
        if (session.updatedAt < cutoff) {
          sessions.delete(session.id);
          deleteSessionMessages(transaction, session.id);
        }
      }
    };
    try {
      await done;
    } catch (error) {
      throw new MemoryStoreError(
        "TRANSACTION_FAILED",
        "Não foi possível aplicar a retenção da memória local.",
        { cause: error },
      );
    }
  }

  async getStatus(): Promise<LocalMemoryStatus> {
    await this.pruneExpiredSessions();
    const database = await this.openDatabase();
    const transaction = database.transaction(
      [SETTINGS_STORE, SESSIONS_STORE, MESSAGES_STORE],
      "readonly",
    );
    const done = transactionResult(transaction);
    const settingsRequest = requestResult(transaction.objectStore(SETTINGS_STORE).get(MEMORY_SETTINGS_KEY));
    const sessionsRequest = requestResult(transaction.objectStore(SESSIONS_STORE).getAll());
    const messagesRequest = requestResult(transaction.objectStore(MESSAGES_STORE).count());

    try {
      const [rawSettings, rawSessions, messageCount] = await Promise.all([
        settingsRequest,
        sessionsRequest,
        messagesRequest,
      ]);
      await done;
      const settings = rawSettings
        ? ConversationSettingsSchema.parse(rawSettings)
        : null;
      return {
        historyEnabled: settings?.historyEnabled ?? false,
        sessionCount: rawSessions.length,
        messageCount,
      };
    } catch (error) {
      throw new MemoryStoreError(
        "TRANSACTION_FAILED",
        "Não foi possível consultar o estado da memória local.",
        { cause: error },
      );
    }
  }

  async setHistoryEnabled(enabled: boolean): Promise<void> {
    const database = await this.openDatabase();
    const transaction = database.transaction(SETTINGS_STORE, "readwrite");
    const done = transactionResult(transaction);
    transaction.objectStore(SETTINGS_STORE).put({
      id: MEMORY_SETTINGS_KEY,
      historyEnabled: enabled,
      updatedAt: Date.now(),
    } satisfies ConversationSettings);

    try {
      await done;
    } catch (error) {
      throw new MemoryStoreError(
        "TRANSACTION_FAILED",
        "Não foi possível actualizar a preferência de histórico local.",
        { cause: error },
      );
    }
  }

  async createSession(): Promise<ConversationSession> {
    const database = await this.openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(
        [SETTINGS_STORE, SESSIONS_STORE, MESSAGES_STORE],
        "readwrite",
      );
      const sessions = transaction.objectStore(SESSIONS_STORE);
      let memoryDisabled = false;
      let created: ConversationSession | null = null;
      const settingsRequest = transaction.objectStore(SETTINGS_STORE).get(MEMORY_SETTINGS_KEY);

      settingsRequest.onsuccess = () => {
        const settings = settingsRequest.result
          ? ConversationSettingsSchema.parse(settingsRequest.result)
          : null;
        if (!settings?.historyEnabled) {
          memoryDisabled = true;
          transaction.abort();
          return;
        }

        const sessionsRequest = sessions.getAll();
        sessionsRequest.onsuccess = () => {
          const now = Date.now();
          created = ConversationSessionSchema.parse({
            id: createId(),
            title: "Nova conversa",
            createdAt: now,
            updatedAt: now,
            messageCount: 0,
          });

          const cutoff = now - MAX_SESSION_AGE_DAYS * 24 * 60 * 60 * 1_000;
          const retained = (sessionsRequest.result as ConversationSession[])
            .filter((session) => session.updatedAt >= cutoff)
            .sort((left, right) => right.updatedAt - left.updatedAt);
          const keepIds = new Set(retained.slice(0, MAX_STORED_SESSIONS - 1).map((session) => session.id));

          for (const session of sessionsRequest.result as ConversationSession[]) {
            if (!keepIds.has(session.id)) {
              sessions.delete(session.id);
              deleteSessionMessages(transaction, session.id);
            }
          }
          sessions.put(created);
        };
      };

      transaction.oncomplete = () => {
        if (created) resolve(created);
        else reject(new MemoryStoreError("TRANSACTION_FAILED", "A sessão não foi criada."));
      };
      transaction.onabort = () => reject(memoryDisabled
        ? new MemoryStoreError("MEMORY_DISABLED", "O histórico local está desactivado.")
        : new MemoryStoreError(
            "TRANSACTION_FAILED",
            "Não foi possível criar uma sessão local.",
            { cause: transaction.error ?? undefined },
          ));
      transaction.onerror = () => reject(new MemoryStoreError(
        "TRANSACTION_FAILED",
        "Não foi possível criar uma sessão local.",
        { cause: transaction.error ?? undefined },
      ));
    });
  }

  async appendMessage(
    sessionId: string,
    input: NewConversationMessage,
  ): Promise<StoredConversationMessage> {
    const database = await this.openDatabase();
    const now = input.createdAt ?? Date.now();
    let message: ReturnType<typeof ConversationMessageSchema.parse>;
    try {
      message = ConversationMessageSchema.parse({
        id: createId(),
        role: input.role,
        content: input.content,
        createdAt: now,
      });
    } catch (error) {
      throw new MemoryStoreError(
        "INVALID_MESSAGE",
        "A mensagem excede os limites ou não respeita o formato permitido.",
        { cause: error },
      );
    }
    const stored = StoredConversationMessageSchema.parse({ ...message, sessionId });

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(
        [SETTINGS_STORE, SESSIONS_STORE, MESSAGES_STORE],
        "readwrite",
      );
      const sessions = transaction.objectStore(SESSIONS_STORE);
      const messages = transaction.objectStore(MESSAGES_STORE);
      let memoryDisabled = false;
      let sessionMissing = false;

      const settingsRequest = transaction.objectStore(SETTINGS_STORE).get(MEMORY_SETTINGS_KEY);
      settingsRequest.onsuccess = () => {
        const settings = settingsRequest.result
          ? ConversationSettingsSchema.parse(settingsRequest.result)
          : null;
        if (!settings?.historyEnabled) {
          memoryDisabled = true;
          transaction.abort();
          return;
        }

        const sessionRequest = sessions.get(sessionId);
        sessionRequest.onsuccess = () => {
          const session = sessionRequest.result as ConversationSession | undefined;
          if (!session) {
            sessionMissing = true;
            transaction.abort();
            return;
          }

          stored.createdAt = Math.max(stored.createdAt, session.updatedAt + 1);
          const addRequest = messages.add(stored);
          addRequest.onsuccess = () => {
            const listRequest = messages.index(SESSION_INDEX).getAll(IDBKeyRange.only(sessionId));
            listRequest.onsuccess = () => {
              const ordered = (listRequest.result as StoredConversationMessage[])
                .sort((left, right) => left.createdAt - right.createdAt);
              const overflow = Math.max(0, ordered.length - MAX_STORED_MESSAGES_PER_SESSION);
              for (const oldMessage of ordered.slice(0, overflow)) {
                messages.delete(oldMessage.id);
              }
              sessions.put({
                ...session,
                updatedAt: Math.max(Date.now(), stored.createdAt),
                messageCount: ordered.length - overflow,
              } satisfies ConversationSession);
            };
          };
        };
      };

      transaction.oncomplete = () => resolve(stored);
      transaction.onabort = () => {
        const error = memoryDisabled
          ? new MemoryStoreError("MEMORY_DISABLED", "O histórico local está desactivado.")
          : sessionMissing
            ? new MemoryStoreError("SESSION_NOT_FOUND", "A sessão local já não existe.")
            : new MemoryStoreError(
                "TRANSACTION_FAILED",
                "Não foi possível guardar esta mensagem localmente.",
                { cause: transaction.error ?? undefined },
              );
        reject(error);
      };
      transaction.onerror = () => reject(new MemoryStoreError(
        "TRANSACTION_FAILED",
        "Não foi possível guardar esta mensagem localmente.",
        { cause: transaction.error ?? undefined },
      ));
    });
  }

  async listSessions(): Promise<ConversationSession[]> {
    const database = await this.openDatabase();
    const transaction = database.transaction(SESSIONS_STORE, "readonly");
    const done = transactionResult(transaction);
    try {
      const records = await requestResult(transaction.objectStore(SESSIONS_STORE).getAll());
      await done;
      return records
        .map((record) => ConversationSessionSchema.parse(record))
        .sort((left, right) => right.updatedAt - left.updatedAt);
    } catch (error) {
      throw new MemoryStoreError(
        "TRANSACTION_FAILED",
        "Não foi possível ler as sessões locais.",
        { cause: error },
      );
    }
  }

  async getMessages(sessionId: string): Promise<StoredConversationMessage[]> {
    const database = await this.openDatabase();
    const transaction = database.transaction(MESSAGES_STORE, "readonly");
    const done = transactionResult(transaction);
    try {
      const records = await requestResult(
        transaction.objectStore(MESSAGES_STORE)
          .index(SESSION_INDEX)
          .getAll(IDBKeyRange.only(sessionId)),
      );
      await done;
      return records
        .map((record) => StoredConversationMessageSchema.parse(record))
        .sort((left, right) => left.createdAt - right.createdAt);
    } catch (error) {
      throw new MemoryStoreError(
        "TRANSACTION_FAILED",
        "Não foi possível ler as mensagens locais.",
        { cause: error },
      );
    }
  }

  async getAgentHistory(sessionId: string): Promise<AgentHistoryMessage[]> {
    return toAgentHistory(await this.getMessages(sessionId));
  }

  async deleteSession(sessionId: string): Promise<void> {
    const database = await this.openDatabase();
    const transaction = database.transaction([SESSIONS_STORE, MESSAGES_STORE], "readwrite");
    const done = transactionResult(transaction);
    transaction.objectStore(SESSIONS_STORE).delete(sessionId);
    deleteSessionMessages(transaction, sessionId);
    try {
      await done;
    } catch (error) {
      throw new MemoryStoreError(
        "TRANSACTION_FAILED",
        "Não foi possível apagar esta sessão local.",
        { cause: error },
      );
    }
  }

  async deleteAllData(): Promise<void> {
    const database = await this.openDatabase();
    database.close();
    this.databasePromise = null;

    const factory = this.getFactory();
    await new Promise<void>((resolve, reject) => {
      let request: IDBOpenDBRequest;
      try {
        request = factory.deleteDatabase(this.databaseName);
      } catch (error) {
        reject(new MemoryStoreError(
          "DATABASE_OPEN_FAILED",
          "O browser não permitiu eliminar a base de dados local.",
          { cause: error },
        ));
        return;
      }

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new MemoryStoreError(
        "DATABASE_OPEN_FAILED",
        "Falhou a eliminação dos dados locais.",
        { cause: request.error ?? undefined },
      ));
      request.onblocked = () => reject(new MemoryStoreError(
        "DATABASE_BLOCKED",
        "Outra janela mantém a memória aberta. Feche as outras janelas do JARVIS e repita a eliminação.",
      ));
    });
  }
}
