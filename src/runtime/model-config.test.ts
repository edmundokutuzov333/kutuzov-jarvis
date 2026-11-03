import { describe, expect, it } from "vitest";

import {
  LOCAL_MODEL_APP_CONFIG,
  LOCAL_MODEL_ID,
  LOCAL_MODEL_METADATA,
  QWEN3_MODEL_RECORD,
} from "./model-config";

describe("pinned local model configuration", () => {
  it("uses one fixed Qwen3 model and a pinned model library", () => {
    expect(LOCAL_MODEL_ID).toBe("Qwen3-0.6B-q4f16_1-MLC");
    expect(LOCAL_MODEL_APP_CONFIG.model_list).toHaveLength(1);
    expect(QWEN3_MODEL_RECORD.model).toContain(
      "8c14ce481d4c692769976ad52afea453a102df19",
    );
    expect(QWEN3_MODEL_RECORD.model_lib).toContain(
      "146ed9cd4b4062e967b017fd2291f7106b50599f",
    );
    expect(QWEN3_MODEL_RECORD.model).not.toContain("/resolve/main");
    expect(QWEN3_MODEL_RECORD.model_lib).not.toContain("/main/");
  });

  it("fails closed when configured SRI checks fail", () => {
    expect(QWEN3_MODEL_RECORD.integrity.onFailure).toBe("error");
    expect(QWEN3_MODEL_RECORD.integrity.config).toMatch(/^sha256-/);
    expect(QWEN3_MODEL_RECORD.integrity.tokenizer["tokenizer.json"]).toMatch(/^sha256-/);
  });

  it("keeps model and runtime resource budgets explicit", () => {
    expect(LOCAL_MODEL_METADATA.webllmVersion).toBe("0.2.87");
    expect(LOCAL_MODEL_METADATA.contextWindow).toBe(4_096);
    expect(LOCAL_MODEL_METADATA.approximateListedArtifactSizeMb).toBe(352);
    expect(LOCAL_MODEL_METADATA.vramRequiredMb).toBeGreaterThan(1_000);
    expect(LOCAL_MODEL_METADATA.inferenceLocation).toBe("browser");
  });
});
