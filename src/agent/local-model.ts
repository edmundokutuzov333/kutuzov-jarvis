import type { LocalInferenceRuntime } from "../runtime/local-runtime";
import type { AgentModelPort } from "./model-port";

export function createLocalAgentModel(runtime: LocalInferenceRuntime): AgentModelPort {
  return {
    async generate(request) {
      const result = await runtime.generate(
        request.userPrompt,
        request.onToken,
        request.signal,
        {
          systemPrompt: request.systemPrompt,
          maxTokens: request.maxTokens,
          temperature: request.temperature,
          topP: request.topP,
        },
      );
      return { cancelled: result.cancelled };
    },
  };
}
