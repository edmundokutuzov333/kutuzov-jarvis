import { expect, test } from "@playwright/test";

test("starts with a clean visitor conversation and no session menu", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Olá. Sou o Kutuzov." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Falar com Kutuzov" })).toBeVisible();
  await expect(page.getByText("Sessão")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Abrir Sessão" })).toHaveCount(0);
  await expect(page.locator('[data-window-id="session"]')).toHaveCount(0);
});

test("keeps the voice console central and usable on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const voice = page.getByRole("button", { name: "Falar com Kutuzov" });
  await expect(voice).toBeVisible();
  await expect(page.getByText("CLIQUE PARA FALAR COMIGO")).toBeVisible();
  await expect(page.locator(".voice-console__bars i")).toHaveCount(15);
});
