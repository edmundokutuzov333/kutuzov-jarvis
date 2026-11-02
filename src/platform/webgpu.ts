export interface WebGpuAdapterLike {
  readonly limits?: {
    readonly maxStorageBufferBindingSize?: number;
    readonly maxBufferSize?: number;
  };
  readonly features?: {
    has(feature: string): boolean;
  };
  readonly info?: {
    readonly vendor?: string;
    readonly architecture?: string;
  };
}

export interface WebGpuHost {
  readonly isSecureContext?: boolean;
  readonly navigator?: {
    readonly gpu?: {
      requestAdapter(options?: { powerPreference?: "low-power" | "high-performance" }): Promise<WebGpuAdapterLike | null>;
    };
  };
}

export type WebGpuSupport =
  | {
      status: "available";
      adapter: {
        vendor: string | null;
        architecture: string | null;
        maxStorageBufferBindingSize: number | null;
        maxBufferSize: number | null;
        shaderF16: boolean;
      };
    }
  | {
      status: "unavailable";
      reason: "insecure-context" | "api-missing" | "adapter-missing" | "adapter-error";
      message: string;
    };

export async function inspectWebGpu(
  host: WebGpuHost = globalThis as unknown as WebGpuHost,
): Promise<WebGpuSupport> {
  if (host.isSecureContext !== true) {
    return {
      status: "unavailable",
      reason: "insecure-context",
      message: "WebGPU exige um contexto seguro. Abra o site através de HTTPS ou localhost.",
    };
  }

  const gpu = host.navigator?.gpu;
  if (!gpu) {
    return {
      status: "unavailable",
      reason: "api-missing",
      message: "Este browser não disponibiliza a API WebGPU.",
    };
  }

  try {
    const adapter = await gpu.requestAdapter({ powerPreference: "low-power" });
    if (!adapter) {
      return {
        status: "unavailable",
        reason: "adapter-missing",
        message: "O browser suporta a API WebGPU, mas não encontrou um adaptador gráfico disponível.",
      };
    }

    return {
      status: "available",
      adapter: {
        vendor: adapter.info?.vendor || null,
        architecture: adapter.info?.architecture || null,
        maxStorageBufferBindingSize: adapter.limits?.maxStorageBufferBindingSize ?? null,
        maxBufferSize: adapter.limits?.maxBufferSize ?? null,
        shaderF16: adapter.features?.has("shader-f16") ?? false,
      },
    };
  } catch {
    return {
      status: "unavailable",
      reason: "adapter-error",
      message: "O browser não conseguiu inicializar a consulta ao adaptador WebGPU.",
    };
  }
}
