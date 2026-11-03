import { useMemo, useState } from "react";

import { ACTION_REGISTRY, dispatchAction } from "../actions";
import type { PortfolioActionProposal, HostCommand } from "../actions/schemas";
import { DemoPortfolioHostAdapter, type DemoPortfolioState } from "../actions/host";
import type { ActionDispatchResult } from "../actions";

const demoButtons: Array<{
  label: string;
  testId: string;
  proposal: PortfolioActionProposal;
}> = [
  {
    label: "Mostrar projectos",
    testId: "action-show-projects",
    proposal: { action: "SHOW_PROJECTS", parameters: {} },
  },
  {
    label: "Filtrar: Campaign Design",
    testId: "action-filter-projects",
    proposal: { action: "FILTER_PROJECTS", parameters: { category: "Campaign Design" } },
  },
  {
    label: "Abrir: Diga YES",
    testId: "action-open-project",
    proposal: { action: "OPEN_PROJECT", parameters: { slug: "diga-yes" } },
  },
  {
    label: "Mostrar clientes",
    testId: "action-show-clients",
    proposal: { action: "SHOW_CLIENTS", parameters: {} },
  },
  {
    label: "Mostrar experiência",
    testId: "action-show-experience",
    proposal: { action: "SHOW_EXPERIENCE", parameters: {} },
  },
  {
    label: "Mostrar serviços",
    testId: "action-show-services",
    proposal: { action: "SHOW_SERVICES", parameters: {} },
  },
  {
    label: "Abrir About",
    testId: "action-show-about",
    proposal: { action: "SHOW_ABOUT", parameters: {} },
  },
  {
    label: "Abrir Contact",
    testId: "action-open-contact",
    proposal: { action: "OPEN_CONTACT", parameters: {} },
  },
  {
    label: "Repor interface",
    testId: "action-reset-interface",
    proposal: { action: "RESET_INTERFACE", parameters: {} },
  },
];

function getStateLabel(state: DemoPortfolioState): string {
  const details = [
    state.view,
    state.projectCategory ? `category=${state.projectCategory}` : null,
    state.activeProjectSlug ? `slug=${state.activeProjectSlug}` : null,
  ].filter(Boolean);

  return details.join(" / ");
}

export function ActionEnginePanel() {
  const host = useMemo(() => new DemoPortfolioHostAdapter(), []);
  const [state, setState] = useState<DemoPortfolioState>(() => ({ ...host.getSnapshot() }));
  const [events, setEvents] = useState<readonly HostCommand[]>([]);
  const [lastResult, setLastResult] = useState<ActionDispatchResult | null>(null);
  const [busy, setBusy] = useState(false);

  async function execute(proposal: PortfolioActionProposal) {
    if (busy) return;
    setBusy(true);
    try {
      const result = await dispatchAction(proposal, host, { confirmed: true });
      setLastResult(result);
      setState({ ...host.getSnapshot() });
      setEvents([...host.getEventLog()]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="action-lab" aria-labelledby="action-lab-title">
      <div className="action-lab__heading">
        <div>
          <p className="eyebrow">ACTION ENGINE / HOST ADAPTER</p>
          <h2 id="action-lab-title">Controlled navigation commands.</h2>
          <p className="action-lab__description">
            Nine registered commands. Every parameter is validated. Each button
            is an explicit approval to dispatch one command to this isolated demo host.
          </p>
        </div>
        <span className="action-lab__badge">SANDBOX / DEMO ONLY</span>
      </div>

      <div className="action-lab__warning" role="note">
        This is an isolated in-memory demonstration. It does not access the official
        portfolio, real routes, CMS data or published website.
      </div>

      <div className="action-lab__meta">
        <span>{ACTION_REGISTRY.length} REGISTERED ACTIONS</span>
        <span>CONFIRMATION REQUIRED</span>
        <span>NO ARBITRARY URLS</span>
      </div>

      <div className="action-lab__buttons">
        {demoButtons.map((button) => (
          <button
            className="button button--quiet"
            data-testid={button.testId}
            disabled={busy}
            key={button.testId}
            onClick={() => void execute(button.proposal)}
            type="button"
          >
            {button.label}
          </button>
        ))}
      </div>

      <div className="action-lab__state">
        <div className="action-lab__state-heading">
          <span className="action-lab__label">DEMO HOST STATE</span>
          <span className="action-lab__environment">ENVIRONMENT: DEMO</span>
        </div>
        <output data-testid="demo-host-state">{getStateLabel(state)}</output>
      </div>

      {lastResult ? (
        <div className="action-lab__result" role="status" aria-live="polite">
          <strong data-testid="action-result-status">{lastResult.status.toUpperCase()}</strong>
          <span>{lastResult.message}</span>
        </div>
      ) : null}

      <div className="action-lab__events">
        <div className="action-lab__state-heading">
          <span className="action-lab__label">HOST COMMAND LOG</span>
          <span>{events.length} EVENTS</span>
        </div>
        {events.length === 0 ? (
          <p className="action-lab__empty">No commands dispatched in this session.</p>
        ) : (
          <ol>
            {events.slice(-6).map((event, index) => (
              <li key={index}>
                <code>{event.type}</code>
                {"category" in event ? <span>{event.category}</span> : null}
                {"slug" in event ? <span>{event.slug}</span> : null}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
