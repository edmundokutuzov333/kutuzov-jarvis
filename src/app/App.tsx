import { useState } from "react";
import { ActionEnginePanel } from "./ActionEnginePanel";
import { ConversationWorkspace } from "./ConversationWorkspace";
import { FloatingWindow } from "./FloatingWindow";
import { MemoryPrivacyPanel } from "./MemoryPrivacyPanel";

type WindowId = "conversation" | "memory" | "actions";
const labels: Record<WindowId, string> = { conversation: "Conversa", memory: "Memória", actions: "Comandos" };

export function App() {
  const [historyEnabled, setHistoryEnabled] = useState(false);
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [visible, setVisible] = useState<Record<WindowId, boolean>>({ conversation: true, memory: true, actions: true });
  const [active, setActive] = useState<WindowId>("conversation");
  function close(id: WindowId) { setVisible((current) => ({ ...current, [id]: false })); }
  function open(id: WindowId) { setVisible((current) => ({ ...current, [id]: true })); setActive(id); }

  return (
    <main className="jarvis-desktop" data-testid="jarvis-desktop">
      <div className="desktop-atmosphere" aria-hidden="true" />
      <header className="desktop-topbar">
        <a className="desktop-brand" href="/" aria-label="Kutuzov JARVIS, início">
          <span className="desktop-brand__mark">EK<span>.</span></span>
          <span className="desktop-brand__name">KUTUZOV <b>JARVIS</b></span>
        </a>
        <div className="desktop-topbar__right"><span className="live-indicator" /><span className="desktop-clock">LOCAL INTELLIGENCE</span></div>
      </header>
      <aside className="desktop-rail" aria-label="Navegação do sistema">
        <div className="desktop-rail__section">
          {(["conversation", "memory", "actions"] as WindowId[]).map((id) => (
            <button className={visible[id] && active === id ? "rail-launcher is-active" : "rail-launcher"} key={id} type="button" title={labels[id]} aria-label={"Abrir " + labels[id]} aria-pressed={visible[id] && active === id} onClick={() => open(id)}>
              <span>{id === "conversation" ? "◉" : id === "memory" ? "⌘" : "⌁"}</span>
            </button>
          ))}
        </div>
        <div className="desktop-rail__bottom"><span className="rail-system-light" /><small>ONLINE</small></div>
      </aside>
      <section className="core-stage" aria-label="Núcleo do JARVIS">
        <div className="core-orb" data-testid="jarvis-core" data-state={assistantBusy ? "thinking" : "idle"} role="img" aria-label={assistantBusy ? "JARVIS está a preparar uma resposta" : "Núcleo visual JARVIS"}>
          <div className="core-orb__aura" /><div className="core-orb__halo core-orb__halo--one" /><div className="core-orb__halo core-orb__halo--two" />
          <div className="core-orb__ring core-orb__ring--outer" /><div className="core-orb__ring core-orb__ring--middle" /><div className="core-orb__ring core-orb__ring--inner" />
          <div className="core-orb__orbit core-orb__orbit--one" /><div className="core-orb__orbit core-orb__orbit--two" />
          <div className="core-orb__energy">
            <span className="core-orb__plasma core-orb__plasma--one" /><span className="core-orb__plasma core-orb__plasma--two" /><span className="core-orb__plasma core-orb__plasma--three" /><span className="core-orb__plasma core-orb__plasma--four" />
            <span className="core-orb__filament core-orb__filament--one" /><span className="core-orb__filament core-orb__filament--two" /><span className="core-orb__filament core-orb__filament--three" /><span className="core-orb__light" />
          </div>
          <span className="core-orb__particle core-orb__particle--one" /><span className="core-orb__particle core-orb__particle--two" /><span className="core-orb__particle core-orb__particle--three" />
          <span className="core-orb__particle core-orb__particle--four" /><span className="core-orb__particle core-orb__particle--five" /><span className="core-orb__particle core-orb__particle--six" />
          <div className="core-orb__pulse core-orb__pulse--one" /><div className="core-orb__pulse core-orb__pulse--two" />
        </div>
        <div className="core-stage__identity"><span className="eyebrow">KUTUZOV / PERSONAL INTELLIGENCE</span><h1>Intelligence <em>in motion.</em></h1></div>
      </section>
      {visible.conversation ? <FloatingWindow id="conversation" title="Falar com JARVIS" subtitle="CONVERSA" initialClass="window--conversation" zIndex={active === "conversation" ? 16 : 10} onFocus={() => setActive("conversation")} onClose={() => close("conversation")}><ConversationWorkspace historyEnabled={historyEnabled} onBusyChange={setAssistantBusy} /></FloatingWindow> : null}
      {visible.memory ? <FloatingWindow id="memory" title="A minha memória" subtitle="PRIVACIDADE" initialClass="window--memory" zIndex={active === "memory" ? 16 : 9} onFocus={() => setActive("memory")} onClose={() => close("memory")}><MemoryPrivacyPanel onHistoryEnabledChange={setHistoryEnabled} /></FloatingWindow> : null}
      {visible.actions ? <FloatingWindow id="actions" title="O que posso fazer" subtitle="ACÇÕES" initialClass="window--actions" zIndex={active === "actions" ? 16 : 8} onFocus={() => setActive("actions")} onClose={() => close("actions")}><ActionEnginePanel /></FloatingWindow> : null}
      <nav className="desktop-dock" aria-label="Janelas do JARVIS">
        {(["conversation", "memory", "actions"] as WindowId[]).map((id) => (
          <button className={visible[id] ? "dock-app is-open" : "dock-app"} key={id} type="button" aria-label={labels[id]} onClick={() => visible[id] ? setActive(id) : open(id)}>
            <span>{id === "conversation" ? "◉" : id === "memory" ? "⌘" : "⌁"}</span><small>{labels[id]}</small>{visible[id] ? <i /> : null}
          </button>
        ))}
      </nav>
      <footer className="desktop-footer"><span>KUTUZOV JARVIS</span><span>PRIVATE BY DEFAULT</span></footer>
    </main>
  );
}
