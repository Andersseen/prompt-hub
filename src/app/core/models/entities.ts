export type EntityType =
  | 'agents'
  | 'promptFrameworks'
  | 'promptTemplates'
  | 'skills'
  | 'roles'
  | 'promptBlocks'
  | 'settings';

export type ExportFormat = 'json' | 'yaml' | 'markdown';

export type Theme = 'light' | 'dark';

export interface TimestampedEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaggedEntity extends TimestampedEntity {
  tags: string[];
}

export interface Workspace extends TimestampedEntity {
  name: string;
  description: string;
  schemaVersion: string;
}

export interface Role extends TaggedEntity {
  name: string;
  description: string;
  content: string;
}

export interface PromptFrameworkSection {
  id: string;
  key: string;
  label: string;
  description: string;
  required: boolean;
  placeholder: string;
  order: number;
}

export interface PromptFramework extends TaggedEntity {
  name: string;
  description: string;
  sections: PromptFrameworkSection[];
}

export interface PromptTemplate extends TaggedEntity {
  name: string;
  description: string;
  frameworkId: string;
  roleId: string;
  values: Record<string, string>;
}

export interface Agent extends TaggedEntity {
  name: string;
  description: string;
  roleId: string;
  promptTemplateIds: string[];
  skillIds: string[];
  defaultOutputFormat: string;
  defaultConstraints: string;
}

export interface Skill extends TaggedEntity {
  name: string;
  description: string;
  instructions: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
}

export type PromptBlockCategory =
  | 'constraint'
  | 'tone'
  | 'output'
  | 'validation'
  | 'style'
  | 'coding-rule'
  | 'reasoning-rule';

export interface PromptBlock extends TaggedEntity {
  name: string;
  description: string;
  content: string;
  category: PromptBlockCategory;
}

export interface AppSettings extends TimestampedEntity {
  theme: Theme;
  defaultExportFormat: ExportFormat;
  defaultWorkspaceName: string;
  autosave: boolean;
}

export interface WorkspaceExport {
  schemaVersion: string;
  exportedAt: string;
  workspace: Workspace;
  roles: Role[];
  promptFrameworks: PromptFramework[];
  promptTemplates: PromptTemplate[];
  agents: Agent[];
  skills: Skill[];
  promptBlocks: PromptBlock[];
  settings: AppSettings;
}

export type WorkspaceEntity =
  | Role
  | PromptFramework
  | PromptTemplate
  | Agent
  | Skill
  | PromptBlock
  | AppSettings;

export interface EntityDraftMap {
  agents: Agent;
  promptFrameworks: PromptFramework;
  promptTemplates: PromptTemplate;
  skills: Skill;
  roles: Role;
  promptBlocks: PromptBlock;
  settings: AppSettings;
}
