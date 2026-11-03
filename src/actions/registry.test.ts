import { describe, expect, it } from "vitest";

import {
  ACTION_REGISTRY,
  dispatchAction,
} from "./registry";
import { DemoPortfolioHostAdapter } from "./host/demo-adapter";
import {
  PUBLISHED_PROJECT_SLUGS,
  PROJECT_CATEGORIES,
  type PortfolioActionProposal,
} from "./schemas";

describe("closed Action Engine registry", () => {
  it("registers exactly the nine approved navigation actions", () => {
    expect(ACTION_REGISTRY.map((entry) => entry.id)).toEqual([
      "SHOW_PROJECTS",
      "FILTER_PROJECTS",
      "OPEN_PROJECT",
      "SHOW_CLIENTS",
      "SHOW_EXPERIENCE",
      "SHOW_SERVICES",
      "SHOW_ABOUT",
      "OPEN_CONTACT",
      "RESET_INTERFACE",
    ]);
    expect(ACTION_REGISTRY.every((entry) => entry.confirmationRequired)).toBe(true);
  });

  it("rejects an unknown action before contacting the host", async () => {
    const host = new DemoPortfolioHostAdapter();
    const result = await dispatchAction({
      action: "DELETE_DATABASE",
      parameters: {},
    }, host, { confirmed: true });

    expect(result).toMatchObject({ status: "rejected", code: "UNKNOWN_ACTION" });
    expect(host.getEventLog()).toHaveLength(0);
  });

  it("rejects extra and malformed parameters", async () => {
    const host = new DemoPortfolioHostAdapter();
    const extra = await dispatchAction({
      action: "SHOW_PROJECTS",
      parameters: {},
      url: "javascript:alert(1)",
    }, host, { confirmed: true });
    const invalidCategory = await dispatchAction({
      action: "FILTER_PROJECTS",
      parameters: { category: "Unknown Category" },
    }, host, { confirmed: true });
    const invalidSlug = await dispatchAction({
      action: "OPEN_PROJECT",
      parameters: { slug: "../../admin" },
    }, host, { confirmed: true });
    const extraParameters = await dispatchAction({
      action: "OPEN_PROJECT",
      parameters: { slug: "diga-yes", path: "/admin" },
    }, host, { confirmed: true });

    expect(extra).toMatchObject({ status: "rejected", code: "INVALID_PARAMETERS" });
    expect(invalidCategory).toMatchObject({ status: "rejected", code: "INVALID_PARAMETERS" });
    expect(invalidSlug).toMatchObject({ status: "rejected", code: "INVALID_PARAMETERS" });
    expect(extraParameters).toMatchObject({ status: "rejected", code: "INVALID_PARAMETERS" });
    expect(host.getEventLog()).toHaveLength(0);
  });

  it("requires explicit confirmation before dispatch", async () => {
    const host = new DemoPortfolioHostAdapter();
    const result = await dispatchAction({
      action: "SHOW_PROJECTS",
      parameters: {},
    }, host);

    expect(result).toMatchObject({ status: "rejected", code: "CONFIRMATION_REQUIRED" });
    expect(host.getEventLog()).toHaveLength(0);
  });

  it("maps each approved action to a typed host command", async () => {
    const host = new DemoPortfolioHostAdapter();
    const proposals: PortfolioActionProposal[] = [
      { action: "SHOW_PROJECTS", parameters: {} },
      { action: "FILTER_PROJECTS", parameters: { category: PROJECT_CATEGORIES[0] } },
      { action: "OPEN_PROJECT", parameters: { slug: PUBLISHED_PROJECT_SLUGS[0] } },
      { action: "SHOW_CLIENTS", parameters: {} },
      { action: "SHOW_EXPERIENCE", parameters: {} },
      { action: "SHOW_SERVICES", parameters: {} },
      { action: "SHOW_ABOUT", parameters: {} },
      { action: "OPEN_CONTACT", parameters: {} },
      { action: "RESET_INTERFACE", parameters: {} },
    ];

    const results: Array<Awaited<ReturnType<typeof dispatchAction>>> = [];
    for (const proposal of proposals) {
      results.push(await dispatchAction(proposal, host, { confirmed: true }));
    }

    expect(results.every((result) => result.status === "executed")).toBe(true);
    expect(host.getEventLog()).toHaveLength(9);
    expect(host.getSnapshot()).toEqual({
      view: "home",
      projectCategory: null,
      activeProjectSlug: null,
    });
  });

  it("filters a project list using only published category values", async () => {
    const host = new DemoPortfolioHostAdapter();
    const result = await dispatchAction({
      action: "FILTER_PROJECTS",
      parameters: { category: "Social Media" },
    }, host, { confirmed: true });

    expect(result.status).toBe("executed");
    expect(host.getSnapshot()).toEqual({
      view: "projects",
      projectCategory: "Social Media",
      activeProjectSlug: null,
    });
  });

  it("opens only one of the four audited published project slugs", async () => {
    const host = new DemoPortfolioHostAdapter();
    const result = await dispatchAction({
      action: "OPEN_PROJECT",
      parameters: { slug: "diga-yes" },
    }, host, { confirmed: true });

    expect(result.status).toBe("executed");
    expect(host.getSnapshot().activeProjectSlug).toBe("diga-yes");
  });

  it("resets only the demo interface state and keeps the event log", async () => {
    const host = new DemoPortfolioHostAdapter();
    await dispatchAction({ action: "OPEN_CONTACT", parameters: {} }, host, { confirmed: true });
    await dispatchAction({ action: "RESET_INTERFACE", parameters: {} }, host, { confirmed: true });

    expect(host.getSnapshot().view).toBe("home");
    expect(host.getEventLog()).toHaveLength(2);
  });

  it("marks all demonstration executions as demo, never portfolio", async () => {
    const host = new DemoPortfolioHostAdapter();
    const result = await dispatchAction({
      action: "SHOW_PROJECTS",
      parameters: {},
    }, host, { confirmed: true });

    expect(result).toMatchObject({
      status: "executed",
      environment: "demo",
      message: expect.stringContaining("Nenhuma página ou dado do portefólio real"),
    });
  });
});
