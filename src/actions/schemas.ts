import { z } from "zod";

export const PROJECT_CATEGORIES = [
  "Campaign Design",
  "Social Media",
  "Content Creation",
  "Art Direction",
] as const;

export const PUBLISHED_PROJECT_SLUGS = [
  "diga-yes",
  "jogue-venca-repita",
  "datas-que-ligam",
  "somos-uma",
] as const;

export const ProjectCategorySchema = z.enum(PROJECT_CATEGORIES);
export const PublishedProjectSlugSchema = z.enum(PUBLISHED_PROJECT_SLUGS);

const EmptyParametersSchema = z.object({}).strict();

export const PortfolioActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("SHOW_PROJECTS"), parameters: EmptyParametersSchema }).strict(),
  z.object({
    action: z.literal("FILTER_PROJECTS"),
    parameters: z.object({ category: ProjectCategorySchema }).strict(),
  }).strict(),
  z.object({
    action: z.literal("OPEN_PROJECT"),
    parameters: z.object({ slug: PublishedProjectSlugSchema }).strict(),
  }).strict(),
  z.object({ action: z.literal("SHOW_CLIENTS"), parameters: EmptyParametersSchema }).strict(),
  z.object({ action: z.literal("SHOW_EXPERIENCE"), parameters: EmptyParametersSchema }).strict(),
  z.object({ action: z.literal("SHOW_SERVICES"), parameters: EmptyParametersSchema }).strict(),
  z.object({ action: z.literal("SHOW_ABOUT"), parameters: EmptyParametersSchema }).strict(),
  z.object({ action: z.literal("OPEN_CONTACT"), parameters: EmptyParametersSchema }).strict(),
  z.object({ action: z.literal("RESET_INTERFACE"), parameters: EmptyParametersSchema }).strict(),
]);

export type PortfolioActionProposal = z.infer<typeof PortfolioActionSchema>;
export type PortfolioActionId = PortfolioActionProposal["action"];
export type ProjectCategory = z.infer<typeof ProjectCategorySchema>;
export type PublishedProjectSlug = z.infer<typeof PublishedProjectSlugSchema>;

export const HostCommandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("projects.show") }).strict(),
  z.object({ type: z.literal("projects.filter"), category: ProjectCategorySchema }).strict(),
  z.object({ type: z.literal("projects.open"), slug: PublishedProjectSlugSchema }).strict(),
  z.object({ type: z.literal("clients.show") }).strict(),
  z.object({ type: z.literal("experience.show") }).strict(),
  z.object({ type: z.literal("services.show") }).strict(),
  z.object({ type: z.literal("about.open") }).strict(),
  z.object({ type: z.literal("contact.open") }).strict(),
  z.object({ type: z.literal("interface.reset") }).strict(),
]);

export type HostCommand = z.infer<typeof HostCommandSchema>;

export const PortfolioActionIdSchema = z.enum([
  "SHOW_PROJECTS",
  "FILTER_PROJECTS",
  "OPEN_PROJECT",
  "SHOW_CLIENTS",
  "SHOW_EXPERIENCE",
  "SHOW_SERVICES",
  "SHOW_ABOUT",
  "OPEN_CONTACT",
  "RESET_INTERFACE",
]);

export const ACTION_PROPOSAL_CONTRACT = {
  allowedActions: PortfolioActionIdSchema.options,
  emptyParameters: [
    "SHOW_PROJECTS",
    "SHOW_CLIENTS",
    "SHOW_EXPERIENCE",
    "SHOW_SERVICES",
    "SHOW_ABOUT",
    "OPEN_CONTACT",
    "RESET_INTERFACE",
  ],
  filterProjectCategories: PROJECT_CATEGORIES,
  openProjectSlugs: PUBLISHED_PROJECT_SLUGS,
  rule: "Return one exact action proposal or null. Parameters must match the schemas. Never dispatch or claim execution.",
} as const;
