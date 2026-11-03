import { describe, expect, it } from "vitest";

import { DemoPortfolioHostAdapter } from "./demo-adapter";

describe("isolated demo host adapter", () => {
  it("starts with a clean in-memory interface state", () => {
    const host = new DemoPortfolioHostAdapter();

    expect(host.environment).toBe("demo");
    expect(host.getSnapshot()).toEqual({
      view: "home",
      projectCategory: null,
      activeProjectSlug: null,
    });
    expect(host.getEventLog()).toEqual([]);
  });

  it("rejects invalid host commands received outside the registry", async () => {
    const host = new DemoPortfolioHostAdapter();
    const result = await host.dispatch({
      type: "projects.open",
      slug: "../../private",
    } as never);

    expect(result.status).toBe("rejected");
    expect(host.getSnapshot().view).toBe("home");
    expect(host.getEventLog()).toHaveLength(0);
  });

  it("does not expose mutable internal event log references", async () => {
    const host = new DemoPortfolioHostAdapter();
    await host.dispatch({ type: "projects.show" });
    const events = host.getEventLog() as Array<{ type: string }>;
    events[0]!.type = "contact.open";

    expect(host.getEventLog()).toEqual([{ type: "projects.show" }]);
  });
});
