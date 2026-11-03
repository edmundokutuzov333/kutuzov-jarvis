import { LocalEnginePanel } from "./LocalEnginePanel";
import { ActionEnginePanel } from "./ActionEnginePanel";
import { MemoryPrivacyPanel } from "./MemoryPrivacyPanel";

const systemStatus = [
  {
    label: "Knowledge Engine",
    value: "Connected to Agent Core",
    detail: "Lexical retrieval, evidence context and public source references feed the Agent Core.",
    state: "IMPLEMENTED",
  },
  {
    label: "Agent Core",
    value: "Implemented / model validation pending",
    detail: "Versioned prompt, bounded conversation context, structured JSON validation, citation checks and deterministic abstention. UI integration belongs to Phase 8.",
    state: "MODEL TEST PENDING",
  },
  {
    label: "Action Engine",
    value: "Demo adapter active",
    detail: "Nine allowlisted commands, strict schemas, explicit confirmation and an isolated sandbox host.",
    state: "SANDBOX / DEMO",
  },
  {
    label: "Memory & Privacy",
    value: "IndexedDB / opt-in",
    detail: "Conversation history is disabled by default, bounded on-device and removable by the visitor.",
    state: "LOCAL / PRIVATE",
  },
] as const;

export function App() {
  return (
    <main className="shell">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="Kutuzov JARVIS home">
          <span className="wordmark__symbol">K</span>
          <span className="wordmark__name">KUTUZOV JARVIS</span>
        </a>
        <div className="topbar__meta">
          <span className="status-dot" aria-hidden="true" />
          <span>INDEPENDENT BUILD</span>
          <span className="topbar__phase">PHASE 07</span>
        </div>
      </header>

      <section className="intro" aria-labelledby="intro-title">
        <p className="eyebrow">PERSONAL INTELLIGENCE / MEMORY & PRIVACY</p>
        <h1 id="intro-title">
          Memory without
          <br />
          compromise.
        </h1>
        <p className="intro__description">
          O JARVIS pode guardar o histórico de conversação no próprio dispositivo,
          mas só depois de autorização explícita. O visitante mantém o controlo
          sobre o que fica guardado e pode apagar todos os registos locais.
        </p>
        <div className="foundation-note">
          <span className="foundation-note__index">07 / 10</span>
          <p>
            A memória está desactivada por defeito. Não existe sincronização,
            backend de conversação ou envio de mensagens para serviços externos.
          </p>
        </div>
      </section>

      <LocalEnginePanel />

      <ActionEnginePanel />

      <MemoryPrivacyPanel />

      <section className="systems" aria-labelledby="systems-title">
        <div className="systems__heading">
          <p className="eyebrow">CURRENT CORE SYSTEMS</p>
          <h2 id="systems-title">Core implementation status</h2>
        </div>
        <div className="systems__grid">
          {systemStatus.map((system, index) => (
            <article className="system-card" key={system.label}>
              <div className="system-card__top">
                <span className="system-card__number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="system-card__state">{system.state}</span>
              </div>
              <h3>{system.label}</h3>
              <p className="system-card__value">{system.value}</p>
              <p className="system-card__detail">{system.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="footer">
        <span>KUTUZOV JARVIS / 2026</span>
        <span>LOCAL-FIRST BY DESIGN</span>
      </footer>
    </main>
  );
}
