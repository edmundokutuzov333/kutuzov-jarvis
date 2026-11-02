import { describe, expect, it } from "vitest";

import {
  LOCAL_MODEL_ID,
  LOCAL_MODEL_APP_CONFIG,
  LOCAL_MODEL_METADATA,
  QWEN3_MODEL_RECORD,
} from "./model-config";
import { LocalInferenceRuntime, LocalRuntimeError } from "./local-runtime";

describe("Qwen3 WebLLM model configuration", () => {
  it("uses the official MLC Qwen3 model revision with the 4K context profile", () => {
    expect(LOCAL_MODEL_APP_CONFIG.model_list).toHaveLength(1);
    expect(QWEN3_MODEL_RECORD.model_id).toBe(LOCAL_MODEL_ID);
    expect(LOCAL_MODEL_ID).toBe("Qwen3-0.6B-q4f16_1-MLC");
    expect(QWEN3_MODEL_RECORD.overrides).toEqual({
      context_window_size: 4096,
    });
    expect(QWEN3_MODEL_RECORD.low_resource_required).toBe(true);
    expect(QWEN3_MODEL_RECORD.vram_required_MB).toBe(1403.34);
    expect(LOCAL_MODEL_APP_CONFIG.cacheBackend).toBe("cache");
  });

  it("pins model weights and WebGPU library to immutable revisions", () => {
    expect(QWEN3_MODEL_RECORD.model).toContain(LOCAL_MODEL_METADATA.modelRevision);
    expect(QWEN3_MODEL_RECORD.model_lib).toContain(LOCAL_MODEL_METADATA.modelLibraryCommit);
    expect(LOCAL_MODEL_METADATA.modelLibraryGitBlob).toBe(
      "bccc95f5fa0cac4a5bfa7a6305c6195eea23f7f7",
    );
  });

  it("verifies the published model config and tokenizer and fails closed", () => {
    expect(QWEN3_MODEL_RECORD.integrity).toMatchObject({
      onFailure: "error",
      config: expect.stringMatching(/^sha256-/),
      tokenizer: {
        "tokenizer.json": expect.stringMatching(/^sha256-/),
      },
    });
    expect(QWEN3_MODEL_RECORD.integrity).not.toHaveProperty("model_lib");
  });

  it("keeps model weight and GPU memory estimates separate", () => {
    expect(LOCAL_MODEL_METADATA.approximateListedArtifactSizeMb).toBe(352);
    expect(LOCAL_MODEL_METADATA.vramRequiredMb).toBe(1403.34);
    expect(LOCAL_MODEL_METADATA.modelLibrarySizeMb).toBe(6.56);
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
