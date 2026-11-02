import { LocalEnginePanel } from "./LocalEnginePanel";

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
          <span className="topbar__phase">PHASE 05</span>
        </div>
      </header>

      <section className="intro" aria-labelledby="intro-title">
        <p className="eyebrow">PERSONAL INTELLIGENCE / AGENT CORE</p>
        <h1 id="intro-title">
          Knowledge into
          <br />
          grounded answers.
        </h1>
        <p className="intro__description">
          JARVIS retrieves verified information about Kutuzov, prepares a
          bounded context and validates the local model&apos;s structured answer.
          Inference remains on this device and starts only after you load the model.
        </p>
        <div className="foundation-note">
          <span className="foundation-note__index">05 / 10</span>
          <p>
            No remote inference API. No dedicated AI server. The Agent Core
            is implemented; physical model validation and the conversational
            interface remain pending.
          </p>
        </div>
      </section>

      <LocalEnginePanel />

      <section className="systems" aria-labelledby="systems-title">
        <div className="systems__heading">
          <p className="eyebrow">CURRENT CORE SYSTEMS</p>
          <h2 id="systems-title">Core implementation status</h2>
        </div>
        <div className="systems__grid systems__grid--two">
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
