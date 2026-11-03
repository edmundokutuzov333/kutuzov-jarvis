import { expect, test } from "@playwright/test";

test("keeps the local model unloaded until the visitor explicitly starts it", async ({
  page,
}) => {
  const modelRequests: string[] = [];
  const runtimeRequests: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (
      url.includes("huggingface.co/mlc-ai/Qwen3-0.6B-q4f16_1-MLC") ||
      url.includes("binary-mlc-llm-libs")
    ) {
      modelRequests.push(url);
    }
    if (/\/assets\/lib-[^/]+\.js/.test(url) || /\/assets\/webllm\.worker-[^/]+\.js/.test(url)) {
      runtimeRequests.push(url);
    }
  });

  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /intent into controlled action/i }),
  ).toBeVisible();
  await expect(page.locator(".engine-status__value").first()).toHaveText("NOT CHECKED");
  await expect(
    page.getByRole("button", { name: "Check this device" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Load local model" }),
  ).toHaveCount(0);

  expect(modelRequests).toHaveLength(0);
  expect(runtimeRequests).toHaveLength(0);
});

test("checks browser WebGPU capability without downloading model artifacts", async ({
  page,
}) => {
  const artifactRequests: string[] = [];
  const runtimeRequests: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (
      url.includes("huggingface.co/mlc-ai/Qwen3-0.6B-q4f16_1-MLC") ||
      url.includes("binary-mlc-llm-libs")
    ) {
      artifactRequests.push(url);
    }
    if (/\/assets\/lib-[^/]+\.js/.test(url) || /\/assets\/webllm\.worker-[^/]+\.js/.test(url)) {
      runtimeRequests.push(url);
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
  expect(runtimeRequests).toHaveLength(0);
});


test("runs all nine allowlisted actions only inside the isolated demo host", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("SANDBOX / DEMO ONLY")).toBeVisible();
  await expect(page.getByTestId("demo-host-state")).toHaveText("home");

  await page.getByTestId("action-show-projects").click();
  await expect(page.getByTestId("demo-host-state")).toHaveText("projects");

  await page.getByTestId("action-filter-projects").click();
  await expect(page.getByTestId("demo-host-state")).toHaveText("projects / category=Campaign Design");

  await page.getByTestId("action-open-project").click();
  await expect(page.getByTestId("demo-host-state")).toHaveText("projects / slug=diga-yes");

  await page.getByTestId("action-show-clients").click();
  await expect(page.getByTestId("demo-host-state")).toHaveText("clients");

  await page.getByTestId("action-show-experience").click();
  await expect(page.getByTestId("demo-host-state")).toHaveText("experience");

  await page.getByTestId("action-show-services").click();
  await expect(page.getByTestId("demo-host-state")).toHaveText("services");

  await page.getByTestId("action-show-about").click();
  await expect(page.getByTestId("demo-host-state")).toHaveText("about");

  await page.getByTestId("action-open-contact").click();
  await expect(page.getByTestId("demo-host-state")).toHaveText("contact");

  await page.getByTestId("action-reset-interface").click();
  await expect(page.getByTestId("demo-host-state")).toHaveText("home");

  await expect(page.getByTestId("action-result-status")).toHaveText("EXECUTED");
  await expect(page.getByText("ENVIRONMENT: DEMO")).toBeVisible();
  await expect(page.getByText("9 EVENTS")).toBeVisible();
});
