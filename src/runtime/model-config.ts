import type { AppConfig, ModelRecord } from "@mlc-ai/web-llm";

/**
 * SkillSafe AI's browser-ready Qwen3-0.6B q4f16_1 artifact.
 *
 * The SRI hashes below are published by the artifact maintainer. They protect
 * the model config, WebGPU module and tokenizer. Parameter shards are checked
 * by the MLC tensor-cache metadata during model loading.
 */
export const LOCAL_MODEL_ID = "qwen3-0.6b-q4f16";

export const QWEN3_MODEL_RECORD = {
  model: "https://huggingface.co/skillsafe-ai/qwen3-0.6b-q4f16",
  model_id: LOCAL_MODEL_ID,
  model_lib:
    "https://huggingface.co/skillsafe-ai/qwen3-0.6b-q4f16/resolve/main/lib/Qwen3-0.6B-q4f16_1-ctx4k_cs1k-webgpu.wasm",
  // prefill_chunk_size is required by this compiled artifact but is not yet
  // represented in WebLLM's public ChatOptions type.
  overrides: {
    context_window_size: 4096,
    prefill_chunk_size: 1024,
  } as ModelRecord["overrides"],
  integrity: {
    config: "sha256-GQpRxWuaB6jYchJm+ORZvNGxaJvN/ylHlc0r/6ID/y0=",
    model_lib: "sha256-elHP+ArV/hU54DOoO5p9JAlX0349jmIMa0NkirqQoMw=",
    tokenizer: {
      "tokenizer.json": "sha256-rrEzB6cazY/oGGHZStVKtonfdzMYgJ7tPL55S0SS2uQ=",
    },
    onFailure: "error",
  },
} satisfies ModelRecord;

export const LOCAL_MODEL_APP_CONFIG = {
  cacheBackend: "cache",
  model_list: [QWEN3_MODEL_RECORD],
} satisfies AppConfig;

export const LOCAL_MODEL_METADATA = {
  name: "Qwen3-0.6B",
  quantization: "q4f16_1",
  modelPublisher: "Alibaba Cloud / MLC",
  artifactPublisher: "SkillSafe AI",
  modelLicense: "Apache-2.0",
  approximateListedArtifactSizeMb: 335,
  modelLibrarySizeMb: 5.49,
  contextWindow: 4096,
  prefillChunkSize: 1024,
  inferenceLocation: "browser",
  weightRegistry: "https://models.skillsafe.ai",
} as const;
