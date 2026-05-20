import { Injectable } from '@angular/core';
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

const DB_NAME = 'PromptHubLocalDatabase';
const DB_VERSION = 1;

/**
 * Dexie database for Prompt Hub.
 *
 * To add a future migration:
 * 1. Increment DB_VERSION.
 * 2. Add a new `this.version(N).stores({...}).upgrade(tx => {...})` block.
 * 3. The upgrade callback receives a Dexie transaction; use it to transform data.
 *
 * Example:
 * ```ts
 * this.version(2).stores({
 *   ...existingStores,
 *   newTable: 'id, name',
 * }).upgrade(async (tx) => {
 *   await tx.table('roles').toCollection().modify(role => {
 *     role.newField = 'default';
 *   });
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
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
    super(DB_NAME);

    this.version(DB_VERSION).stores({
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
