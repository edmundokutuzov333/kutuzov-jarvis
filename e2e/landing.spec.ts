import { expect, test } from "@playwright/test";

test("keeps the local model unloaded until the visitor explicitly starts it", async ({
  page,
}) => {
  const modelRequests: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (
      url.includes("huggingface.co/skillsafe-ai/") ||
      url.includes("models.skillsafe.ai")
    ) {
      modelRequests.push(url);
    }
  });

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /intelligence stays on your device/i }),
  ).toBeVisible();
  await expect(page.locator(".engine-status__value").first()).toHaveText("NOT CHECKED");
  await expect(
    page.getByRole("button", { name: "Check this device" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Load local model" }),
  ).toHaveCount(0);

  expect(modelRequests).toHaveLength(0);
});

test("checks browser WebGPU capability without downloading model artifacts", async ({
  page,
}) => {
  const artifactRequests: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (
      url.includes("huggingface.co/skillsafe-ai/") ||
      url.includes("models.skillsafe.ai")
    ) {
      artifactRequests.push(url);
    }
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Check this device" }).click();

  const compatibility = page.locator(".engine-status__value").first();
  await expect(compatibility).not.toHaveText("NOT CHECKED");

  const status = await compatibility.textContent();
  if (status === "WEBGPU AVAILABLE") {
    await expect(
      page.getByRole("button", { name: "Load local model" }),
    ).toBeVisible();
  } else {
    await expect(compatibility).toHaveText("NOT AVAILABLE");
    await expect(
      page.getByRole("button", { name: "Load local model" }),
    ).toHaveCount(0);
  }

  expect(artifactRequests).toHaveLength(0);
});
