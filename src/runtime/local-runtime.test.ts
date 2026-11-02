import { describe, expect, it } from "vitest";

import { LOCAL_MODEL_ID, LOCAL_MODEL_APP_CONFIG, QWEN3_MODEL_RECORD } from "./model-config";
import { LocalInferenceRuntime, LocalRuntimeError } from "./local-runtime";

describe("Qwen3 WebLLM model configuration", () => {
  it("registers one compact Qwen3 model with a fixed 4K context profile", () => {
    expect(LOCAL_MODEL_APP_CONFIG.model_list).toHaveLength(1);
    expect(QWEN3_MODEL_RECORD.model_id).toBe(LOCAL_MODEL_ID);
    expect(QWEN3_MODEL_RECORD.overrides).toEqual({
      context_window_size: 4096,
      prefill_chunk_size: 1024,
    });
    expect(LOCAL_MODEL_APP_CONFIG.cacheBackend).toBe("cache");
  });

  it("requires integrity checks to fail closed for the config, WASM and tokenizer", () => {
    expect(QWEN3_MODEL_RECORD.integrity).toMatchObject({
      onFailure: "error",
      config: expect.stringMatching(/^sha256-/),
      model_lib: expect.stringMatching(/^sha256-/),
      tokenizer: {
        "tokenizer.json": expect.stringMatching(/^sha256-/),
      },
    });
  });

  it("does not expose any remote inference provider configuration", () => {
    expect(QWEN3_MODEL_RECORD.model).toContain("huggingface.co/skillsafe-ai/");
    expect(QWEN3_MODEL_RECORD.model_lib).toContain("/lib/");
    expect(LOCAL_MODEL_ID).toBe("qwen3-0.6b-q4f16");
  });
});

describe("LocalInferenceRuntime guard conditions", () => {
  it("does not report a model as ready before an explicit successful load", () => {
    const runtime = new LocalInferenceRuntime();
    expect(runtime.isReady).toBe(false);
  });

  it("rejects generation while no local model is loaded", async () => {
    const runtime = new LocalInferenceRuntime();

    await expect(runtime.generate("Teste", () => undefined)).rejects.toMatchObject({
      code: "MODEL_NOT_READY",
    } satisfies Partial<LocalRuntimeError>);
  });

  it("keeps the local model unloaded when the runtime is disposed", async () => {
    const runtime = new LocalInferenceRuntime();
    await runtime.dispose();
    expect(runtime.isReady).toBe(false);
  });
});
