import { useEffect, useMemo, useState } from "react";

import {
  LocalConversationStore,
  MemoryStoreError,
  type LocalMemoryStatus,
} from "../memory";

interface MemoryPrivacyPanelProps {
  onHistoryEnabledChange?: (enabled: boolean) => void;
}

function describeError(error: unknown): string {
  if (error instanceof MemoryStoreError) return error.message;
  if (error instanceof Error) return error.message;
  return "Não foi possível aceder à memória local deste browser.";
}

export function MemoryPrivacyPanel({
  onHistoryEnabledChange,
}: MemoryPrivacyPanelProps) {
  const store = useMemo(() => new LocalConversationStore(), []);
  const [status, setStatus] = useState<LocalMemoryStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function refreshStatus() {
    try {
      const next = await store.getStatus();
      setStatus(next);
      onHistoryEnabledChange?.(next.historyEnabled);
      setError("");
    } catch (reason) {
      setError(describeError(reason));
    }
  }

  useEffect(() => {
    let active = true;
    const applyStatus = (next: LocalMemoryStatus) => {
      if (!active) return;
      setStatus(next);
      onHistoryEnabledChange?.(next.historyEnabled);
    };
    const handleMemoryUpdate = () => {
      void store.getStatus().then(applyStatus).catch((reason: unknown) => {
        if (active) setError(describeError(reason));
      });
    };

    void store.getStatus().then(applyStatus).catch((reason: unknown) => {
      if (active) setError(describeError(reason));
    });
    window.addEventListener("jarvis-memory-updated", handleMemoryUpdate);
    return () => {
      active = false;
      window.removeEventListener("jarvis-memory-updated", handleMemoryUpdate);
    };
  }, [onHistoryEnabledChange, store]);

  async function changePreference(enabled: boolean) {
    const previousStatus = status;
    setStatus((currentStatus) => currentStatus
      ? { ...currentStatus, historyEnabled: enabled }
      : currentStatus);
    setBusy(true);
    setError("");
    try {
      await store.setHistoryEnabled(enabled);
      await refreshStatus();
    } catch (reason) {
      setStatus(previousStatus);
      setError(describeError(reason));
    } finally {
      setBusy(false);
    }
  }

  async function deleteHistory() {
    const accepted = window.confirm(
      "Apagar definitivamente todas as sessões e mensagens guardadas neste browser? Esta operação não pode ser anulada.",
    );
    if (!accepted) return;

    setBusy(true);
    setError("");
    try {
      await store.deleteAllData();
      await refreshStatus();
    } catch (reason) {
      setError(describeError(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="memory-panel" aria-labelledby="memory-panel-title">
      <div className="memory-panel__heading">
        <div>
          <p className="eyebrow">PRIVACIDADE</p>
          <h2 id="memory-panel-title">A sua memória, sob o seu controlo.</h2>
          <p className="memory-panel__description">
            As conversas ficam apenas neste dispositivo. Não são enviadas nem sincronizadas.
          </p>
        </div>
        <span className="memory-panel__badge">LOCAL</span>
      </div>

      <div className="memory-panel__control">
        <div>
          <strong>Guardar conversas</strong>
          <p>
            As conversas ficam guardadas apenas neste browser. Pode apagar tudo quando quiser.
          </p>
        </div>
        <label className="memory-toggle">
          <input
            aria-label="Guardar histórico neste dispositivo"
            checked={status?.historyEnabled ?? false}
            disabled={busy || status === null}
            onChange={(event) => void changePreference(event.target.checked)}
            type="checkbox"
          />
          <span aria-hidden="true" />
        </label>
      </div>

      <div className="memory-panel__stats" aria-live="polite">
        <div>
          <span>CONVERSAS</span>
          <strong data-testid="memory-session-count">
            {status?.sessionCount ?? "—"}
          </strong>
        </div>
        <div>
          <span>MENSAGENS</span>
          <strong data-testid="memory-message-count">
            {status?.messageCount ?? "—"}
          </strong>
        </div>
        <div>
          <span>ESTADO</span>
          <strong data-testid="memory-state">
            {status === null ? "A VERIFICAR" : status.historyEnabled ? "ACTIVO" : "DESACTIVADO"}
          </strong>
        </div>
      </div>

      <div className="memory-panel__footer">
        <p>
          O histórico permanece neste dispositivo e pode ser eliminado a qualquer momento.
        </p>
        <button
          className="button button--quiet"
          data-testid="memory-delete-all"
          disabled={busy || status === null || (status.sessionCount === 0 && status.messageCount === 0)}
          onClick={() => void deleteHistory()}
          type="button"
        >
          Apagar histórico
        </button>
      </div>

      {error ? <p className="engine-panel__error" role="alert">{error}</p> : null}
      {busy ? <p className="engine-panel__feedback" role="status">A actualizar as definições de memória local...</p> : null}
    </section>
  );
}
