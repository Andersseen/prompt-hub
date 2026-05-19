import { z } from 'zod';

export const TimestampedEntitySchema = z.object({
  id: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const TaggedEntitySchema = TimestampedEntitySchema.extend({
  tags: z.array(z.string()),
});

export const WorkspaceSchema = TimestampedEntitySchema.extend({
  name: z.string().min(1),
  description: z.string(),
  schemaVersion: z.string().min(1),
});

export const RoleSchema = TaggedEntitySchema.extend({
  name: z.string().min(1),
  description: z.string(),
  content: z.string(),
});

export const PromptFrameworkSectionSchema = z.object({
  id: z.string().min(1),
  key: z.string().min(1),
  label: z.string().min(1),
  description: z.string(),
  required: z.boolean(),
  placeholder: z.string(),
  order: z.number().int(),
});

export const PromptFrameworkSchema = TaggedEntitySchema.extend({
  name: z.string().min(1),
  description: z.string(),
  sections: z.array(PromptFrameworkSectionSchema),
});

export const PromptTemplateSchema = TaggedEntitySchema.extend({
  name: z.string().min(1),
  description: z.string(),
  frameworkId: z.string().min(1),
  roleId: z.string(),
  values: z.record(z.string(), z.string()),
});

export const AgentSchema = TaggedEntitySchema.extend({
  name: z.string().min(1),
  description: z.string(),
  roleId: z.string(),
  promptTemplateIds: z.array(z.string()),
  skillIds: z.array(z.string()),
  defaultOutputFormat: z.string(),
  defaultConstraints: z.string(),
});

export const SkillSchema = TaggedEntitySchema.extend({
  name: z.string().min(1),
  description: z.string(),
  instructions: z.string(),
  inputFormat: z.string(),
  outputFormat: z.string(),
  constraints: z.string(),
});

export const PromptBlockCategorySchema = z.enum([
  'constraint',
  'tone',
  'output',
  'validation',
  'style',
  'coding-rule',
  'reasoning-rule',
]);

export const PromptBlockSchema = TaggedEntitySchema.extend({
  name: z.string().min(1),
  description: z.string(),
  content: z.string(),
  category: PromptBlockCategorySchema,
});

export const AppSettingsSchema = TimestampedEntitySchema.extend({
  theme: z.enum(['light', 'dark']),
  defaultExportFormat: z.enum(['json', 'yaml', 'markdown']),
  defaultWorkspaceName: z.string().min(1),
  autosave: z.boolean(),
});

export const WorkspaceExportSchema = z.object({
  schemaVersion: z.string().min(1),
  exportedAt: z.string().min(1),
  workspace: WorkspaceSchema,
  roles: z.array(RoleSchema),
  promptFrameworks: z.array(PromptFrameworkSchema),
  promptTemplates: z.array(PromptTemplateSchema),
  agents: z.array(AgentSchema),
  skills: z.array(SkillSchema),
  promptBlocks: z.array(PromptBlockSchema),
  settings: AppSettingsSchema,
});

export type WorkspaceExportValidated = z.infer<typeof WorkspaceExportSchema>;
