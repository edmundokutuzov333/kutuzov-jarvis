import { expect, test } from "@playwright/test";

async function openSession(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Abrir Sessão" }).click();
  await expect(page.getByRole("region", { name: "Uma conversa nova, sempre." })).toBeVisible();
}

test("starts every visitor with an ephemeral session", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Abrir Sessão" })).toBeVisible();
  await openSession(page);
  await expect(page.getByText("Sem histórico persistente")).toBeVisible();
  await expect(page.getByText("Voz por consentimento")).toBeVisible();
  await expect(page.getByText("Conhecimento público")).toBeVisible();

  const disabledWrite = await page.evaluate(async () => {
    const { LocalConversationStore } = await import("/src/memory/local-store.ts");
    try {
      await new LocalConversationStore().createSession();
      return "unexpected-success";
    } catch (error) {
      return error instanceof Error && "code" in error ? String(error.code) : "unknown-error";
    }
  });
  expect(disabledWrite).toBe("MEMORY_DISABLED");
});

test("keeps the ephemeral-session panel usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await openSession(page);
  await expect(page.getByText("Estado: sessão limpa")).toBeVisible();
  await expect(page.getByRole("button", { name: "Abrir Conversa" })).toBeVisible();
});
