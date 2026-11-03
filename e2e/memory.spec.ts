import { expect, test } from "@playwright/test";

test("local memory is opt-in, persists in IndexedDB and can be fully deleted", async ({ page }) => {
  await page.goto("/");

  const externalRequests: string[] = [];
  const origin = new URL(page.url()).origin;
  page.on("request", (request) => {
    if (new URL(request.url()).origin !== origin) {
      externalRequests.push(request.url());
    }
  });

  const historyToggle = page.getByRole("checkbox", {
    name: "Guardar histórico neste dispositivo",
  });
  await expect(historyToggle).not.toBeChecked();
  await expect(page.getByTestId("memory-state")).toHaveText("DESACTIVADO");

  const disabledWrite = await page.evaluate(async () => {
    const { LocalConversationStore } = await import("/src/memory/local-store.ts");
    const store = new LocalConversationStore();
    try {
      await store.createSession();
      return "unexpected-success";
    } catch (error) {
      return error instanceof Error && "code" in error
        ? String(error.code)
        : "unknown-error";
    }
  });
  expect(disabledWrite).toBe("MEMORY_DISABLED");

  await historyToggle.check();
  await expect(page.getByTestId("memory-state")).toHaveText("ACTIVO");

  const stored = await page.evaluate(async () => {
    const { LocalConversationStore } = await import("/src/memory/local-store.ts");
    const store = new LocalConversationStore();
    const session = await store.createSession();
    for (let index = 0; index < 106; index += 1) {
      await store.appendMessage(session.id, {
        role: index % 2 === 0 ? "user" : "assistant",
        content: "Mensagem de teste " + index,
      });
    }
    const messages = await store.getMessages(session.id);
    const history = await store.getAgentHistory(session.id);
    const status = await store.getStatus();
    return {
      sessionId: session.id,
      storedMessages: messages.length,
      historyLength: history.length,
      firstContextMessage: history[0]?.content,
      lastContextMessage: history[history.length - 1]?.content,
      sessionCount: status.sessionCount,
      messageCount: status.messageCount,
      enabled: status.historyEnabled,
    };
  });

  expect(stored.storedMessages).toBe(100);
  expect(stored.historyLength).toBe(6);
  expect(stored.firstContextMessage).toBe("Mensagem de teste 100");
  expect(stored.lastContextMessage).toBe("Mensagem de teste 105");
  expect(stored.sessionCount).toBe(1);
  expect(stored.messageCount).toBe(100);
  expect(stored.enabled).toBe(true);

  await page.reload();
  await expect(page.getByRole("checkbox", {
    name: "Guardar histórico neste dispositivo",
  })).toBeChecked();
  await expect(page.getByTestId("memory-session-count")).toHaveText("1");
  await expect(page.getByTestId("memory-message-count")).toHaveText("100");

  await historyToggle.uncheck();
  await expect(page.getByTestId("memory-state")).toHaveText("DESACTIVADO");
  await expect(page.getByTestId("memory-session-count")).toHaveText("1");
  await expect(page.getByTestId("memory-message-count")).toHaveText("100");
  await historyToggle.check();
  await expect(page.getByTestId("memory-state")).toHaveText("ACTIVO");

  page.on("dialog", (dialog) => dialog.accept());
  await page.getByTestId("memory-delete-all").click();
  await expect(page.getByTestId("memory-session-count")).toHaveText("0");
  await expect(page.getByTestId("memory-message-count")).toHaveText("0");
  await expect(page.getByTestId("memory-state")).toHaveText("DESACTIVADO");
  await expect(page.getByRole("checkbox", {
    name: "Guardar histórico neste dispositivo",
  })).not.toBeChecked();

  const afterDelete = await page.evaluate(async () => {
    const { LocalConversationStore } = await import("/src/memory/local-store.ts");
    const store = new LocalConversationStore();
    const status = await store.getStatus();
    return status;
  });
  expect(afterDelete).toEqual({
    historyEnabled: false,
    sessionCount: 0,
    messageCount: 0,
  });
  expect(externalRequests).toEqual([]);
});

test("privacy controls remain usable at a mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const panel = page.getByRole("region", { name: "Your conversations stay yours." });
  await expect(panel).toBeVisible();
  await expect(page.getByRole("checkbox", {
    name: "Guardar histórico neste dispositivo",
  })).toBeVisible();
  await expect(page.getByTestId("memory-delete-all")).toBeVisible();
});

test("retains no more than twenty local conversation sessions", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { LocalConversationStore } = await import("/src/memory/local-store.ts");
    const store = new LocalConversationStore();
    await store.setHistoryEnabled(true);
    for (let index = 0; index < 21; index += 1) {
      await store.createSession();
    }
    const sessions = await store.listSessions();
    return {
      count: sessions.length,
      allTitlesAreGeneric: sessions.every((session) => session.title === "Nova conversa"),
    };
  });

  expect(result.count).toBe(20);
  expect(result.allTitlesAreGeneric).toBe(true);
});

test("gracefully reports when IndexedDB is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "indexedDB", {
      configurable: true,
      value: undefined,
    });
  });
  await page.goto("/");

  await expect(page.getByRole("region", {
    name: "Your conversations stay yours.",
  })).toBeVisible();
  await expect(page.getByRole("alert")).toContainText(
    "não disponibiliza IndexedDB",
  );
  await expect(page.getByRole("checkbox", {
    name: "Guardar histórico neste dispositivo",
  })).toBeDisabled();
});
