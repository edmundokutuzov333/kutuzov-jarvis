import { useState } from "react";
import { ConversationWorkspace } from "./ConversationWorkspace";
import { FloatingWindow } from "./FloatingWindow";
import { MemoryPrivacyPanel } from "./MemoryPrivacyPanel";

type WindowId = "conversation" | "memory";
const labels: Record<WindowId, string> = { conversation: "Conversa", memory: "Privacidade" };

export function App() {
  const [historyEnabled, setHistoryEnabled] = useState(false);
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [visible, setVisible] = useState<Record<WindowId, boolean>>({ conversation: true, memory: false });
  const [active, setActive] = useState<WindowId>("conversation");

  function close(id: WindowId) {
    setVisible((current) => ({ ...current, [id]: false }));
  }
  function open(id: WindowId) {
    setVisible((current) => ({ ...current, [id]: true }));
    setActive(id);
  }

  return (
    <main className="jarvis-desktop" data-testid="jarvis-desktop">
      <div className="desktop-atmosphere" aria-hidden="true" />
      <header className="desktop-topbar">
        <a className="desktop-brand" href="/" aria-label="Edmundo Kutuzov, início">
          <span className="desktop-brand__mark">EK<span>.</span></span>
          <span className="desktop-brand__name">EDMUNDO KUTUZOV</span>
        </a>
      </header>
      <section className="core-stage" aria-label="Identidade visual de Edmundo Kutuzov">
        <div className="core-orb" data-testid="jarvis-core" data-state={assistantBusy ? "thinking" : "idle"} role="img" aria-label={assistantBusy ? "A preparar uma resposta" : "Animação visual de Edmundo Kutuzov"}>
          <div className="core-orb__aura" />
          <div className="core-orb__halo core-orb__halo--one" />
          <div className="core-orb__halo core-orb__halo--two" />
          <div className="core-orb__ring core-orb__ring--outer" />
          <div className="core-orb__ring core-orb__ring--middle" />
          <div className="core-orb__ring core-orb__ring--inner" />
          <div className="core-orb__orbit core-orb__orbit--one" />
          <div className="core-orb__orbit core-orb__orbit--two" />
          <div className="core-orb__energy">
            <span className="core-orb__plasma core-orb__plasma--one" />
            <span className="core-orb__plasma core-orb__plasma--two" />
            <span className="core-orb__plasma core-orb__plasma--three" />
            <span className="core-orb__plasma core-orb__plasma--four" />
            <span className="core-orb__filament core-orb__filament--one" />
            <span className="core-orb__filament core-orb__filament--two" />
            <span className="core-orb__filament core-orb__filament--three" />
            <span className="core-orb__light" />
          </div>
          <span className="core-orb__particle core-orb__particle--one" />
          <span className="core-orb__particle core-orb__particle--two" />
          <span className="core-orb__particle core-orb__particle--three" />
          <span className="core-orb__particle core-orb__particle--four" />
          <span className="core-orb__particle core-orb__particle--five" />
          <span className="core-orb__particle core-orb__particle--six" />
          <div className="core-orb__pulse core-orb__pulse--one" />
          <div className="core-orb__pulse core-orb__pulse--two" />
        </div>
        <div className="core-stage__identity">
          <span className="eyebrow">EDMUNDO KUTUZOV</span>
          <h1>Estou por aqui.</h1>
          <p>Vamos falar de ideias, projectos e trabalho.</p>
        </div>
      </section>
      {visible.conversation ? (
        <FloatingWindow id="conversation" title="Conversa comigo" initialClass="window--conversation" zIndex={active === "conversation" ? 16 : 10} onFocus={() => setActive("conversation")} onClose={() => close("conversation")}>
          <ConversationWorkspace historyEnabled={historyEnabled} onBusyChange={setAssistantBusy} />
        </FloatingWindow>
      ) : null}
      {visible.memory ? (
        <FloatingWindow id="memory" title="As suas conversas" initialClass="window--memory" zIndex={active === "memory" ? 16 : 9} onFocus={() => setActive("memory")} onClose={() => close("memory")}>
          <MemoryPrivacyPanel onHistoryEnabledChange={setHistoryEnabled} />
        </FloatingWindow>
      ) : null}
      <nav className="desktop-dock" aria-label="Opções">
        {(["conversation", "memory"] as WindowId[]).map((id) => (
          <button className={visible[id] ? "dock-app is-open" : "dock-app"} key={id} type="button" aria-label={"Abrir " + labels[id]} aria-pressed={visible[id] && active === id} onClick={() => visible[id] ? setActive(id) : open(id)}>
            <span aria-hidden="true">{id === "conversation" ? "◉" : "⌘"}</span>
            <small>{labels[id]}</small>
            {visible[id] ? <i /> : null}
          </button>
        ))}
      </nav>
    </main>
  );
}