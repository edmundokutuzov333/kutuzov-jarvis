import { LocalEnginePanel } from "./LocalEnginePanel";

const systemStatus = [
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
          <span className="topbar__phase">PHASE 03</span>
        </div>
      </header>

      <section className="intro" aria-labelledby="intro-title">
        <p className="eyebrow">PERSONAL INTELLIGENCE / LOCAL INFERENCE</p>
        <h1 id="intro-title">
          Intelligence stays
          <br />
          on your device.
        </h1>
        <p className="intro__description">
          JARVIS is a focused digital assistant for exploring Kutuzov&apos;s
          professional work. The local language model is loaded only when you
          choose to start it.
        </p>
        <div className="foundation-note">
          <span className="foundation-note__index">03 / 10</span>
          <p>
            No remote inference API. No dedicated AI server. The first model
            load requires a compatible browser, WebGPU and a one-time download
            of the model files.
          </p>
        </div>
      </section>

      <LocalEnginePanel />

      <section className="systems" aria-labelledby="systems-title">
        <div className="systems__heading">
          <p className="eyebrow">NEXT SYSTEMS</p>
          <h2 id="systems-title">Not active in this phase</h2>
        </div>
        <div className="systems__grid systems__grid--two">
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
