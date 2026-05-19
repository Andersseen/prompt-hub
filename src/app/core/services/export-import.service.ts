import { Injectable, inject } from '@angular/core';
import { parse, stringify } from 'yaml';

import { AppDatabase } from '../db/app-database';
import { WorkspaceExportSchema, type WorkspaceExportValidated } from '../models/entity-schemas';
import { MarkdownService } from './markdown.service';

@Injectable({ providedIn: 'root' })
export class ExportImportService {
  private readonly db = inject(AppDatabase);
  private readonly markdown = inject(MarkdownService);

  async collectWorkspace(): Promise<WorkspaceExportValidated> {
    const [workspace] = await this.db.workspaces.toArray();
    const [settings] = await this.db.settings.toArray();

    if (!workspace || !settings) {
      throw new Error('Workspace is not initialized.');
    }

    return {
      schemaVersion: workspace.schemaVersion,
      exportedAt: new Date().toISOString(),
      workspace,
      roles: await this.db.roles.toArray(),
      promptFrameworks: await this.db.promptFrameworks.toArray(),
      promptTemplates: await this.db.promptTemplates.toArray(),
      agents: await this.db.agents.toArray(),
      skills: await this.db.skills.toArray(),
      promptBlocks: await this.db.promptBlocks.toArray(),
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
    await this.db.transaction(
      'rw',
      [
        this.db.workspaces,
        this.db.roles,
        this.db.promptFrameworks,
        this.db.promptTemplates,
        this.db.agents,
        this.db.skills,
        this.db.promptBlocks,
        this.db.settings,
      ],
      async () => {
        await this.db.workspaces.clear();
        await this.db.roles.clear();
        await this.db.promptFrameworks.clear();
        await this.db.promptTemplates.clear();
        await this.db.agents.clear();
        await this.db.skills.clear();
        await this.db.promptBlocks.clear();
        await this.db.settings.clear();

        await this.db.workspaces.add(data.workspace);
        await this.db.roles.bulkAdd(data.roles);
        await this.db.promptFrameworks.bulkAdd(data.promptFrameworks);
        await this.db.promptTemplates.bulkAdd(data.promptTemplates);
        await this.db.agents.bulkAdd(data.agents);
        await this.db.skills.bulkAdd(data.skills);
        await this.db.promptBlocks.bulkAdd(data.promptBlocks);
        await this.db.settings.add(data.settings);
      }
    );
  }
}
