import type { AppConfig, ModelRecord } from "@mlc-ai/web-llm";

/**
 * Official MLC Qwen3-0.6B q4f16_1 model record from WebLLM 0.2.87.
 *
 * The weights URL is pinned to the verified Hugging Face revision.
 * The WebGPU library URL is pinned to the binary-mlc-llm-libs commit used
 * for WebLLM model-library version v0_2_87/base.
 */
export const LOCAL_MODEL_ID = "Qwen3-0.6B-q4f16_1-MLC";

export const QWEN3_MODEL_RECORD = {
  model:
    "https://huggingface.co/mlc-ai/Qwen3-0.6B-q4f16_1-MLC/resolve/8c14ce481d4c692769976ad52afea453a102df19",
  model_id: LOCAL_MODEL_ID,
  model_lib:
    "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/146ed9cd4b4062e967b017fd2291f7106b50599f/web-llm-models/v0_2_87/base/Qwen3-0.6B-q4f16_1_cs1k-webgpu.wasm",
  vram_required_MB: 1403.34,
  low_resource_required: true,
  overrides: {
    context_window_size: 4096,
  },
  integrity: {
    config: "sha256-GQpRxWuaB6jYchJm+ORZvNGxaJvN/ylHlc0r/6ID/y0=",
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
  artifactPublisher: "MLC-LLM / WebLLM",
  modelLicense: "Apache-2.0",
  approximateListedArtifactSizeMb: 352,
  modelLibrarySizeMb: 6.56,
  vramRequiredMb: 1403.34,
  contextWindow: 4096,
  webllmVersion: "0.2.87",
  modelRevision: "8c14ce481d4c692769976ad52afea453a102df19",
  modelLibraryCommit: "146ed9cd4b4062e967b017fd2291f7106b50599f",
  modelLibraryGitBlob: "bccc95f5fa0cac4a5bfa7a6305c6195eea23f7f7",
  inferenceLocation: "browser",
} as const;
