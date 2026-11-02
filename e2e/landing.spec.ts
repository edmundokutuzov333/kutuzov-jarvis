import { expect, test } from "@playwright/test";

test("shows the independent JARVIS foundation without claiming AI is active", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /a focused system/i }),
  ).toBeVisible();

  await expect(page.getByText("Not connected")).toBeVisible();
  await expect(page.getByText("Not loaded")).toBeVisible();
  await expect(page.getByText("Not configured")).toBeVisible();
});
