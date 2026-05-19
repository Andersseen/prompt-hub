import { Injectable, inject } from '@angular/core';
import { parse, stringify } from 'yaml';

import { appDatabase } from '../db/app-database';
import { WorkspaceExportSchema, type WorkspaceExportValidated } from '../models/entity-schemas';
import { MarkdownService } from './markdown.service';

@Injectable({ providedIn: 'root' })
export class ExportImportService {
  private readonly markdown = inject(MarkdownService);

  async collectWorkspace(): Promise<WorkspaceExportValidated> {
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

  parseImport(value: string): WorkspaceExportValidated {
    const trimmed = value.trim();

    let parsed: unknown;
    if (trimmed.startsWith('{')) {
      try {
        parsed = JSON.parse(trimmed);
      } catch {
        throw new Error('Invalid JSON format.');
      }
    } else {
      try {
        parsed = parse(trimmed);
      } catch {
        throw new Error('Invalid YAML format.');
      }
    }

    const result = WorkspaceExportSchema.safeParse(parsed);
    if (!result.success) {
      const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).slice(0, 3);
      throw new Error(`Import validation failed: ${issues.join('; ')}`);
    }

    return result.data;
  }

  async replaceWorkspace(data: WorkspaceExportValidated): Promise<void> {
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
}
