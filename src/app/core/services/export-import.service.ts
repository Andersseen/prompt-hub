import { Injectable, inject } from '@angular/core';
import { parse, stringify } from 'yaml';

import { appDatabase } from '../db/app-database';
import { WorkspaceExport } from '../models/entities';
import { MarkdownService } from './markdown.service';

@Injectable({ providedIn: 'root' })
export class ExportImportService {
  private readonly markdown = inject(MarkdownService);

  async collectWorkspace(): Promise<WorkspaceExport> {
    const [workspace] = await appDatabase.workspaces.toArray();
    const [settings] = await appDatabase.settings.toArray();

    if (!workspace || !settings) {
      throw new Error('Workspace is not initialized.');
    }

    return {
      schemaVersion: workspace.schemaVersion,
      exportedAt: new Date().toISOString(),
      workspace,
      roles: await appDatabase.roles.toArray(),
      promptFrameworks: await appDatabase.promptFrameworks.toArray(),
      promptTemplates: await appDatabase.promptTemplates.toArray(),
      agents: await appDatabase.agents.toArray(),
      skills: await appDatabase.skills.toArray(),
      promptBlocks: await appDatabase.promptBlocks.toArray(),
      settings,
    };
  }

  async exportJson(): Promise<string> {
    return JSON.stringify(await this.collectWorkspace(), null, 2);
  }

  async exportYaml(): Promise<string> {
    return stringify(await this.collectWorkspace());
  }

  async exportMarkdown(): Promise<string> {
    return this.markdown.workspace(await this.collectWorkspace());
  }

  parseImport(value: string): WorkspaceExport {
    const trimmed = value.trim();
    const parsed = trimmed.startsWith('{') ? JSON.parse(trimmed) : parse(trimmed);
    this.validateWorkspaceExport(parsed);
    return parsed;
  }

  async replaceWorkspace(data: WorkspaceExport): Promise<void> {
    this.validateWorkspaceExport(data);

    await appDatabase.transaction(
      'rw',
      [
        appDatabase.workspaces,
        appDatabase.roles,
        appDatabase.promptFrameworks,
        appDatabase.promptTemplates,
        appDatabase.agents,
        appDatabase.skills,
        appDatabase.promptBlocks,
        appDatabase.settings,
      ],
      async () => {
        await appDatabase.workspaces.clear();
        await appDatabase.roles.clear();
        await appDatabase.promptFrameworks.clear();
        await appDatabase.promptTemplates.clear();
        await appDatabase.agents.clear();
        await appDatabase.skills.clear();
        await appDatabase.promptBlocks.clear();
        await appDatabase.settings.clear();

        await appDatabase.workspaces.add(data.workspace);
        await appDatabase.roles.bulkAdd(data.roles);
        await appDatabase.promptFrameworks.bulkAdd(data.promptFrameworks);
        await appDatabase.promptTemplates.bulkAdd(data.promptTemplates);
        await appDatabase.agents.bulkAdd(data.agents);
        await appDatabase.skills.bulkAdd(data.skills);
        await appDatabase.promptBlocks.bulkAdd(data.promptBlocks);
        await appDatabase.settings.add(data.settings);
      }
    );
  }

  private validateWorkspaceExport(value: unknown): asserts value is WorkspaceExport {
    if (!value || typeof value !== 'object') {
      throw new Error('Import must be a JSON or YAML object.');
    }

    const data = value as Partial<WorkspaceExport>;
    const arrayKeys: (keyof WorkspaceExport)[] = [
      'roles',
      'promptFrameworks',
      'promptTemplates',
      'agents',
      'skills',
      'promptBlocks',
    ];

    if (!data.schemaVersion) {
      throw new Error('schemaVersion is required.');
    }

    if (!data.workspace?.id) {
      throw new Error('workspace.id is required.');
    }

    for (const key of arrayKeys) {
      if (!Array.isArray(data[key])) {
        throw new Error(`${key} must be an array.`);
      }

      for (const entity of data[key] as { id?: string; name?: string }[]) {
        if (!entity.id) {
          throw new Error(`${key} contains an entity without id.`);
        }

        if (!entity.name) {
          throw new Error(`${key} contains an entity without name.`);
        }
      }
    }

    if (!data.settings?.id) {
      throw new Error('settings.id is required.');
    }

    // TODO: add merge import strategy after replace is stable.
  }
}
