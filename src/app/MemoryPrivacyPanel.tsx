import { useEffect, useMemo, useState } from "react";
import { LocalConversationStore, MemoryStoreError, type LocalMemoryStatus } from "../memory";

interface MemoryPrivacyPanelProps { onHistoryEnabledChange?: (enabled: boolean) => void; }

function describeError(error: unknown): string {
  if (error instanceof MemoryStoreError) return error.message;
  if (error instanceof Error) return error.message;
  return "Não foi possível actualizar as suas definições. Tente novamente.";
}

export function MemoryPrivacyPanel({ onHistoryEnabledChange }: MemoryPrivacyPanelProps) {
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
    setStatus((current) => current ? { ...current, historyEnabled: enabled } : current);
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
    const accepted = window.confirm("Apagar as conversas guardadas neste dispositivo? Não será possível recuperá-las.");
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
          <h2 id="memory-panel-title">As suas conversas ficam sob o seu controlo.</h2>
          <p className="memory-panel__description">
            Escolha se pretende guardar as conversas neste dispositivo. Quando desactivada, esta opção não guarda o histórico depois de fechar o site.
          </p>
        </div>
      </div>
      <div className="memory-panel__control">
        <div>
          <strong>Guardar conversas neste dispositivo</strong>
          <p>As mensagens que envia são processadas por um serviço externo para gerar respostas. O histórico só fica guardado neste dispositivo quando activa esta opção.</p>
        </div>
        <label className="memory-toggle">
          <input aria-label="Guardar conversas neste dispositivo" checked={status?.historyEnabled ?? false} disabled={busy || status === null} onChange={(event) => void changePreference(event.target.checked)} type="checkbox" />
          <span aria-hidden="true" />
        </label>
      </div>
      <p className="memory-panel__status" aria-live="polite">
        {status === null ? "A carregar as definições." : status.historyEnabled ? "As conversas ficam guardadas neste dispositivo." : "As conversas não estão a ser guardadas."}
      </p>
      <div className="memory-panel__footer">
        <button className="button button--quiet" data-testid="memory-delete-all" disabled={busy || status === null || (status.sessionCount === 0 && status.messageCount === 0)} onClick={() => void deleteHistory()} type="button">Apagar conversas guardadas</button>
      </div>
      {error ? <p className="engine-panel__error" role="alert">{error}</p> : null}
      {busy ? <p className="engine-panel__feedback" role="status">A actualizar as definições...</p> : null}
    </section>
  );
}
