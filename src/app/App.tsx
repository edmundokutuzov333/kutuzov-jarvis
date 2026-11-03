import { useState } from "react";

import { ActionEnginePanel } from "./ActionEnginePanel";
import { ConversationWorkspace } from "./ConversationWorkspace";
import { MemoryPrivacyPanel } from "./MemoryPrivacyPanel";

export function App() {
  const [historyEnabled, setHistoryEnabled] = useState(false);

  return (
    <main className="shell">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="Kutuzov JARVIS, início">
          <span className="wordmark__symbol" aria-hidden="true">K.</span>
          <span className="wordmark__name">KUTUZOV JARVIS</span>
        </a>
        <div className="topbar__meta">
          <span className="status-dot" aria-hidden="true" />
          <span>PERSONAL INTELLIGENCE</span>
          <span className="topbar__phase">PHASE 08</span>
        </div>
      </header>

      <section className="intro" aria-labelledby="intro-title">
        <p className="eyebrow">A DIGITAL ASSISTANT / BUILT AROUND REAL WORK</p>
        <h1 id="intro-title">Conheça o trabalho.<br /><span>Explore as ideias.</span></h1>
        <p className="intro__description">
          Uma forma directa de explorar o percurso, os projectos e as competências
          de Kutuzov. As respostas usam informação pública e verificada. A inteligência
          artificial, quando activada, funciona no seu próprio dispositivo.
        </p>
        <div className="intro__metadata" aria-label="Princípios do sistema">
          <span><i aria-hidden="true" /> SEM API DE IA REMOTA</span>
          <span>CONHECIMENTO LOCAL</span>
          <span>PRIVACIDADE POR ESCOLHA</span>
        </div>
      </section>

      <ConversationWorkspace historyEnabled={historyEnabled} />

      <section className="control-section" aria-labelledby="control-section-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">CONTROL & TRANSPARENCY</p>
            <h2 id="control-section-title">O visitante mantém o controlo.</h2>
          </div>
          <p>Memória local opcional. Acções limitadas e confirmadas.</p>
        </div>
        <div className="control-grid">
          <MemoryPrivacyPanel onHistoryEnabledChange={setHistoryEnabled} />
          <ActionEnginePanel />
        </div>
      </section>

      <footer className="footer">
        <span>KUTUZOV JARVIS / 2026</span>
        <span>BROWSER-FIRST · LOCAL INTELLIGENCE · ZERO AI API</span>
      </footer>
    </main>
  );
}
