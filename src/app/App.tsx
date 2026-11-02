const systemStatus = [
  {
    label: "Inference engine",
    value: "Not connected",
    detail: "WebLLM is reserved for Phase 3.",
  },
  {
    label: "Knowledge source",
    value: "Not loaded",
    detail: "Verified portfolio data will be added in Phase 4.",
  },
  {
    label: "Conversation memory",
    value: "Not configured",
    detail: "Local persistence will be implemented in Phase 7.",
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
          <span className="topbar__phase">PHASE 02</span>
        </div>
      </header>

      <section className="intro" aria-labelledby="intro-title">
        <p className="eyebrow">PERSONAL INTELLIGENCE / TECHNICAL FOUNDATION</p>
        <h1 id="intro-title">
          A focused system.
          <br />
          A single source of truth.
        </h1>
        <p className="intro__description">
          JARVIS is being built to help visitors understand Kutuzov&apos;s
          professional work through verified information and controlled
          navigation. It is not a general-purpose assistant.
        </p>
        <div className="foundation-note">
          <span className="foundation-note__index">02 / 10</span>
          <p>
            The application shell is online. Local inference, knowledge
            retrieval and conversation features are intentionally not active
            in this phase.
          </p>
        </div>
      </section>

      <section className="systems" aria-labelledby="systems-title">
        <div className="systems__heading">
          <p className="eyebrow">SYSTEM MAP</p>
          <h2 id="systems-title">Current foundations</h2>
        </div>
        <div className="systems__grid">
          {systemStatus.map((system, index) => (
            <article className="system-card" key={system.label}>
              <div className="system-card__top">
                <span className="system-card__number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="system-card__state">PENDING</span>
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
