import { z } from "zod";
import { PortfolioActionSchema } from "../actions/schemas";

export const AGENT_PROMPT_VERSION = "1.1.0";
export const MAX_AGENT_QUESTION_CHARACTERS = 2_000;
export const MAX_AGENT_HISTORY_MESSAGES = 6;
export const MAX_AGENT_HISTORY_MESSAGE_CHARACTERS = 500;
export const MAX_AGENT_MODEL_OUTPUT_CHARACTERS = 12_000;

export const AgentQuestionSchema = z.string().trim().min(1).max(MAX_AGENT_QUESTION_CHARACTERS);

export const AgentHistoryMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(MAX_AGENT_HISTORY_MESSAGE_CHARACTERS),
}).strict();

export const AgentHistorySchema = z.array(AgentHistoryMessageSchema).max(MAX_AGENT_HISTORY_MESSAGES);

export const AgentModelStatusSchema = z.enum(["answered", "insufficient_evidence", "action_proposed"]);

export const AgentModelOutputSchema = z.object({
  status: AgentModelStatusSchema,
  answer: z.string().trim().min(1).max(3_000).refine(
    (value) => !/<\/?[a-z][^>]*>/i.test(value),
    { message: "A resposta não pode conter HTML." },
  ),
  citationIds: z.array(z.string().min(3).max(120)).max(6),
  followUpQuestion: z.string().trim().min(1).max(240).nullable(),
  actionProposal: PortfolioActionSchema.nullable().default(null),
}).strict().superRefine((output, context) => {
  if (new Set(output.citationIds).size !== output.citationIds.length) {
    context.addIssue({ code: "custom", message: "As referências não podem estar duplicadas.", path: ["citationIds"] });
  }
  if (output.status === "answered" && output.citationIds.length === 0) {
    context.addIssue({ code: "custom", message: "Uma resposta factual tem de apresentar pelo menos uma referência.", path: ["citationIds"] });
  }
  if (output.status === "insufficient_evidence" && output.citationIds.length > 0) {
    context.addIssue({ code: "custom", message: "Uma resposta sem evidência não pode apresentar referências factuais.", path: ["citationIds"] });
  }
  if (output.status === "action_proposed" && (!output.actionProposal || output.citationIds.length > 0)) {
    context.addIssue({ code: "custom", message: "Uma proposta de acção sem resposta factual exige uma acção válida e não pode citar factos.", path: ["actionProposal"] });
  }
  if (output.status === "insufficient_evidence" && output.actionProposal !== null) {
    context.addIssue({ code: "custom", message: "Uma saída sem evidência e sem intenção de acção não pode propor comandos.", path: ["actionProposal"] });
  }
});

export type AgentQuestion = z.infer<typeof AgentQuestionSchema>;
export type AgentHistoryMessage = z.infer<typeof AgentHistoryMessageSchema>;
export type AgentModelOutput = z.infer<typeof AgentModelOutputSchema>;
