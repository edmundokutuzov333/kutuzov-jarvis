import { describe, expect, it, vi } from "vitest";

import { inspectWebGpu, type WebGpuHost } from "./webgpu";

describe("inspectWebGpu", () => {
  it("rejects an insecure context before checking the GPU", async () => {
    const requestAdapter = vi.fn();

    const result = await inspectWebGpu({
      isSecureContext: false,
      navigator: { gpu: { requestAdapter } },
    });

    expect(result).toMatchObject({
      status: "unavailable",
      reason: "insecure-context",
    });
    expect(requestAdapter).not.toHaveBeenCalled();
  });

  it("reports when the browser has no WebGPU API", async () => {
    const result = await inspectWebGpu({
      isSecureContext: true,
      navigator: {},
    });

    expect(result).toMatchObject({
      status: "unavailable",
      reason: "api-missing",
    });
  });

  it("reports when no GPU adapter is available", async () => {
    const host: WebGpuHost = {
      isSecureContext: true,
      navigator: { gpu: { requestAdapter: async () => null } },
    };

    const result = await inspectWebGpu(host);

    expect(result).toMatchObject({
      status: "unavailable",
      reason: "adapter-missing",
    });
  });

  it("returns adapter limits and supported features", async () => {
    const result = await inspectWebGpu({
      isSecureContext: true,
      navigator: {
        gpu: {
          requestAdapter: async () => ({
            info: { vendor: "test-vendor", architecture: "test-architecture" },
            limits: {
              maxStorageBufferBindingSize: 268_435_456,
              maxBufferSize: 536_870_912,
            },
            features: { has: (feature) => feature === "shader-f16" },
          }),
        },
      },
    });

    expect(result).toEqual({
      status: "available",
      adapter: {
        vendor: "test-vendor",
        architecture: "test-architecture",
        maxStorageBufferBindingSize: 268_435_456,
        maxBufferSize: 536_870_912,
        shaderF16: true,
      },
    });
  });

  it("turns adapter query errors into an unavailable capability", async () => {
    const result = await inspectWebGpu({
      isSecureContext: true,
      navigator: {
        gpu: {
          requestAdapter: async () => {
            throw new Error("GPU adapter unavailable");
          },
        },
      },
    });

    expect(result).toMatchObject({
      status: "unavailable",
      reason: "adapter-error",
    });
  });
});
