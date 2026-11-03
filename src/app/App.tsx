import { useState } from "react";
import { ActionEnginePanel } from "./ActionEnginePanel";
import { ConversationWorkspace } from "./ConversationWorkspace";
import { FloatingWindow } from "./FloatingWindow";
import { MemoryPrivacyPanel } from "./MemoryPrivacyPanel";

type WindowId = "conversation" | "memory" | "actions";
const labels: Record<WindowId, string> = {
  conversation: "CONVERSA",
  memory: "MEMÓRIA & PRIVACIDADE",
  actions: "COMMAND CENTER",
};

export function App() {
  const [historyEnabled, setHistoryEnabled] = useState(false);
  const [visible, setVisible] = useState<Record<WindowId, boolean>>({ conversation: true, memory: true, actions: true });
  const [active, setActive] = useState<WindowId>("conversation");
  const close = (id: WindowId) => setVisible((current) => ({ ...current, [id]: false }));
  const open = (id: WindowId) => { setVisible((current) => ({ ...current, [id]: true })); setActive(id); };

  return (
    <main className="jarvis-desktop" data-testid="jarvis-desktop">
      <div className="desktop-atmosphere" aria-hidden="true" />
      <header className="desktop-topbar">
        <a className="desktop-brand" href="/" aria-label="Kutuzov JARVIS, início">
          <span className="desktop-brand__mark">EK<span>.</span></span>
          <span className="desktop-brand__name">KUTUZOV <b>JARVIS</b></span>
        </a>
        <div className="desktop-topbar__center"><span className="live-indicator" /><span>PERSONAL INTELLIGENCE SYSTEM</span><span className="desktop-topbar__divider">/</span><span>LOCAL INSTANCE</span></div>
        <div className="desktop-topbar__right"><span className="desktop-clock">MAPUTO · MOZ</span><span className="desktop-topbar__version">BUILD 09.11</span></div>
      </header>

      <aside className="desktop-rail" aria-label="Navegação do sistema">
        <div className="desktop-rail__section">
          <span className="desktop-rail__label">WORKSPACE</span>
          {(["conversation", "memory", "actions"] as WindowId[]).map((id) => (
            <button className={visible[id] && active === id ? "rail-launcher is-active" : "rail-launcher"} key={id} type="button" title={labels[id]} aria-label={"Abrir " + labels[id]} aria-pressed={visible[id] && active === id} onClick={() => open(id)}>
              <span>{id === "conversation" ? "◉" : id === "memory" ? "⌘" : "⌁"}</span><small>{id === "conversation" ? "01" : id === "memory" ? "02" : "03"}</small>
            </button>
          ))}
        </div>
        <div className="desktop-rail__bottom"><span className="desktop-rail__label">SYSTEM</span><span className="rail-system-light" /><small>LOCAL</small></div>
      </aside>

      <section className="core-stage" aria-label="Núcleo do JARVIS">
        <div className="core-stage__coordinates" aria-hidden="true"><span>EK / PERSONAL INTELLIGENCE</span><span>25°58' S · 32°35' E</span></div>
        <div className="core-orb" data-testid="jarvis-core" role="img" aria-label="Núcleo visual JARVIS">
          <div className="core-orb__aura" /><div className="core-orb__ring core-orb__ring--outer" /><div className="core-orb__ring core-orb__ring--middle" /><div className="core-orb__ring core-orb__ring--inner" /><div className="core-orb__orbit core-orb__orbit--one" /><div className="core-orb__orbit core-orb__orbit--two" />
          <div className="core-orb__core"><span className="core-orb__monogram">J</span><span className="core-orb__core-light" /></div><div className="core-orb__scan" />
        </div>
        <div className="core-stage__identity"><span className="eyebrow">KUTUZOV / DIGITAL COUNTERPART</span><h1>Intelligence <em>in motion.</em></h1><p>Um espaço para explorar ideias, trabalho e conhecimento.</p></div>
        <div className="core-stage__readout" aria-hidden="true"><span><i /> CORE STANDBY</span><span>WEBGPU · BROWSER-FIRST</span></div>
      </section>

      {visible.conversation ? <FloatingWindow id="conversation" title="Personal Intelligence" subtitle="CONVERSATION INTERFACE" initialClass="window--conversation" zIndex={active === "conversation" ? 16 : 10} onFocus={() => setActive("conversation")} onClose={() => close("conversation")}><ConversationWorkspace historyEnabled={historyEnabled} /></FloatingWindow> : null}
      {visible.memory ? <FloatingWindow id="memory" title="Memory & Privacy" subtitle="LOCAL STORAGE / USER CONTROL" initialClass="window--memory" zIndex={active === "memory" ? 16 : 9} onFocus={() => setActive("memory")} onClose={() => close("memory")}><MemoryPrivacyPanel onHistoryEnabledChange={setHistoryEnabled} /></FloatingWindow> : null}
      {visible.actions ? <FloatingWindow id="actions" title="Command Center" subtitle="ACTION ENGINE / SANDBOX" initialClass="window--actions" zIndex={active === "actions" ? 16 : 8} onFocus={() => setActive("actions")} onClose={() => close("actions")}><ActionEnginePanel /></FloatingWindow> : null}

      <nav className="desktop-dock" aria-label="Janelas do JARVIS">
        {(["conversation", "memory", "actions"] as WindowId[]).map((id) => <button className={visible[id] ? "dock-app is-open" : "dock-app"} key={id} type="button" onClick={() => visible[id] ? setActive(id) : open(id)}><span>{id === "conversation" ? "◉" : id === "memory" ? "⌘" : "⌁"}</span><small>{labels[id]}</small>{visible[id] ? <i /> : null}</button>)}
      </nav>
      <footer className="desktop-footer"><span>KUTUZOV JARVIS © 2026</span><span>DESIGNED AROUND REAL WORK · PRIVATE BY DEFAULT</span></footer>
    </main>
  );
}
