import Dexie, { Table } from 'dexie';

import {
  Agent,
  AppSettings,
  PromptBlock,
  PromptFramework,
  PromptTemplate,
  Role,
  Skill,
  Workspace,
} from '../models/entities';

export class AppDatabase extends Dexie {
  workspaces!: Table<Workspace, string>;
  roles!: Table<Role, string>;
  promptFrameworks!: Table<PromptFramework, string>;
  promptTemplates!: Table<PromptTemplate, string>;
  agents!: Table<Agent, string>;
  skills!: Table<Skill, string>;
  promptBlocks!: Table<PromptBlock, string>;
  settings!: Table<AppSettings, string>;

  constructor() {
    super('PromptHubLocalDatabase');

    this.version(1).stores({
      workspaces: 'id, name, schemaVersion, updatedAt',
      roles: 'id, name, *tags, updatedAt',
      promptFrameworks: 'id, name, *tags, updatedAt',
      promptTemplates: 'id, name, frameworkId, roleId, *tags, updatedAt',
      agents: 'id, name, roleId, *promptTemplateIds, *skillIds, *tags, updatedAt',
      skills: 'id, name, *tags, updatedAt',
      promptBlocks: 'id, name, category, *tags, updatedAt',
      settings: 'id, theme, updatedAt',
    });
  }
}

export const appDatabase = new AppDatabase();
