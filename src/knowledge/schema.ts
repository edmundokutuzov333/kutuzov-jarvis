import { z } from "zod";

export const KNOWLEDGE_SCHEMA_VERSION = 1;

export const KnowledgeKindSchema = z.enum([
  "identity",
  "experience",
  "project",
  "client",
  "service",
  "skill",
  "discipline",
  "principle",
  "process_step",
  "metric",
  "limitation",
]);

export const KnowledgeVisibilitySchema = z.enum([
  "public_fact",
  "internal_guardrail",
]);

export const KnowledgeVerificationSchema = z.enum([
  "verified_snapshot",
  "pending_editorial",
]);

export const KnowledgeSourceSchema = z
  .object({
    type: z.enum(["portfolio_cms_snapshot", "portfolio_audit_note"]),
    path: z.string().min(1).max(240),
    entity: z.string().min(1).max(120),
    capturedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  })
  .strict();

export const KnowledgeMetadataValueSchema = z.union([
  z.string(),
  z.number().finite(),
  z.boolean(),
  z.array(z.string()),
]);

export const KnowledgeEntrySchema = z
  .object({
    id: z.string().min(3).max(120),
    kind: KnowledgeKindSchema,
    title: z.string().trim().min(1).max(180),
    content: z.string().trim().min(1).max(2_000),
    keywords: z.array(z.string().trim().min(1).max(80)).max(40),
    entities: z.array(z.string().trim().min(1).max(120)).max(20),
    published: z.boolean(),
    visibility: KnowledgeVisibilitySchema,
    verification: KnowledgeVerificationSchema,
    source: KnowledgeSourceSchema,
    metadata: z.record(z.string(), KnowledgeMetadataValueSchema),
  })
  .strict()
  .refine(
    (record) =>
      record.visibility !== "public_fact" ||
      (record.published && record.verification === "verified_snapshot"),
    {
      message: "Public facts must be published and verified against the CMS snapshot.",
      path: ["verification"],
    },
  )
  .refine(
    (record) =>
      record.visibility !== "internal_guardrail" ||
      (!record.published && record.verification === "pending_editorial"),
    {
      message: "Internal guardrails must not be presented as published facts.",
      path: ["visibility"],
    },
  );

export const KnowledgeCatalogSchema = z
  .object({
    schemaVersion: z.literal(KNOWLEDGE_SCHEMA_VERSION),
    snapshotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    sourceDocument: z.string().min(1).max(240),
    records: z.array(KnowledgeEntrySchema).min(1).max(500),
  })
  .strict()
  .superRefine((catalog, context) => {
    const ids = new Set<string>();

    catalog.records.forEach((record, index) => {
      if (ids.has(record.id)) {
        context.addIssue({
          code: "custom",
          message: "Knowledge record ids must be unique.",
          path: ["records", index, "id"],
        });
      }
      ids.add(record.id);
    });
  });

export type KnowledgeKind = z.infer<typeof KnowledgeKindSchema>;
export type KnowledgeVisibility = z.infer<typeof KnowledgeVisibilitySchema>;
export type KnowledgeVerification = z.infer<typeof KnowledgeVerificationSchema>;
export type KnowledgeSource = z.infer<typeof KnowledgeSourceSchema>;
export type KnowledgeEntry = z.infer<typeof KnowledgeEntrySchema>;
export type KnowledgeCatalog = z.infer<typeof KnowledgeCatalogSchema>;
