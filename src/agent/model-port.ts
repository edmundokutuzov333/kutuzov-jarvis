export interface AgentGenerationRequest {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  signal: AbortSignal;
  onToken: (token: string) => void;
}

export interface AgentGenerationResult {
  cancelled: boolean;
}

export interface AgentModelPort {
  generate(request: AgentGenerationRequest): Promise<AgentGenerationResult>;
}
