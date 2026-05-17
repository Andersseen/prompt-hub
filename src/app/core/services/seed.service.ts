import { Injectable } from '@angular/core';

import { appDatabase } from '../db/app-database';
import {
  Agent,
  AppSettings,
  PromptBlock,
  PromptFramework,
  PromptFrameworkSection,
  PromptTemplate,
  Role,
  Skill,
  Workspace,
} from '../models/entities';
import { createId, withTimestamps } from '../utils/entity-utils';

const SCHEMA_VERSION = '1.0.0';

function section(
  key: string,
  label: string,
  order: number,
  description = ''
): PromptFrameworkSection {
  return {
    id: createId(),
    key,
    label,
    description,
    required: true,
    placeholder: `Describe ${label.toLowerCase()}...`,
    order,
  };
}

@Injectable({ providedIn: 'root' })
export class SeedService {
  async seedIfEmpty(): Promise<void> {
    const workspaceCount = await appDatabase.workspaces.count();

    if (workspaceCount > 0) {
      return;
    }

    const workspace = withTimestamps<Pick<Workspace, 'name' | 'description' | 'schemaVersion'>>({
      name: 'Prompt Hub',
      description: 'Local-first workspace for reusable prompts, skills, roles and agents.',
      schemaVersion: SCHEMA_VERSION,
    });

    const role = withTimestamps<Omit<Role, 'id' | 'createdAt' | 'updatedAt'>>({
      name: 'Senior Web Developer',
      description: 'Reusable role for frontend architecture and implementation work.',
      content:
        'You are a senior web developer specialized in Angular, TypeScript, clean architecture, maintainability and developer experience.',
      tags: ['angular', 'typescript', 'architecture'],
    });

    const fiveLayer = withTimestamps<Omit<PromptFramework, 'id' | 'createdAt' | 'updatedAt'>>({
      name: '5 Layer Prompt Framework',
      description: 'A compact structure for clear reusable prompts.',
      sections: [
        section('role', 'Role', 1),
        section('context', 'Context', 2),
        section('task', 'Task', 3),
        section('format', 'Format', 4),
        section('constraints', 'Constraints', 5),
      ],
      tags: ['general', 'structured'],
    });

    const developerTask = withTimestamps<Omit<PromptFramework, 'id' | 'createdAt' | 'updatedAt'>>({
      name: 'Developer Task Framework',
      description: 'A practical framework for implementation, refactor and review tasks.',
      sections: [
        section('role', 'Role', 1),
        section('goal', 'Goal', 2),
        section('currentContext', 'Current Context', 3),
        section('requirements', 'Requirements', 4),
        section('constraints', 'Constraints', 5),
        section('expectedOutput', 'Expected Output', 6),
        section('validationRules', 'Validation Rules', 7),
      ],
      tags: ['developer', 'task'],
    });

    const skill = withTimestamps<Omit<Skill, 'id' | 'createdAt' | 'updatedAt'>>({
      name: 'Code Review',
      description: 'Review code focusing on readability, maintainability, bugs and architecture.',
      instructions:
        'Inspect the code for correctness, maintainability, architecture risks, missing tests and developer experience issues. Lead with actionable findings.',
      inputFormat: 'Code diff, files, pull request or implementation notes.',
      outputFormat: 'Markdown findings ordered by severity with file references when available.',
      constraints: 'Do not rewrite unrelated code. Avoid style-only comments unless they affect clarity.',
      tags: ['review', 'code'],
    });

    const template = withTimestamps<Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>>({
      name: 'Angular Feature Implementation Prompt',
      description: 'Seed prompt for implementing Angular features with strict TypeScript.',
      frameworkId: developerTask.id,
      roleId: role.id,
      values: {
        role: role.content,
        goal: 'Implement a maintainable Angular feature.',
        currentContext: 'The project uses AnalogJS, standalone components, signals and Tailwind CSS.',
        requirements: 'Keep logic separated from components and persist data locally.',
        constraints: 'No backend, no auth, no remote sync. Use TypeScript strictly.',
        expectedOutput: 'A focused implementation with a short verification summary.',
        validationRules: 'Build succeeds and critical flows work locally.',
      },
      tags: ['angular', 'implementation'],
    });

    const agent = withTimestamps<Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>>({
      name: 'Angular Development Assistant',
      description: 'Reusable assistant for Angular architecture, implementation and review.',
      roleId: role.id,
      promptTemplateIds: [template.id],
      skillIds: [skill.id],
      defaultOutputFormat: 'Markdown with clear steps and code examples.',
      defaultConstraints:
        'Avoid unnecessary abstractions. Prefer standalone components. Use TypeScript strictly.',
      tags: ['angular', 'assistant'],
    });

    const blocks: PromptBlock[] = [
      ['Be direct and practical', 'tone'],
      ['Do not invent facts', 'constraint'],
      ['Ask clarification only when required', 'reasoning-rule'],
      ['Prefer TypeScript strict mode', 'coding-rule'],
      ['Prefer guard clauses', 'coding-rule'],
      ['Avoid deeply nested code', 'coding-rule'],
    ].map(([name, category]) =>
      withTimestamps<Omit<PromptBlock, 'id' | 'createdAt' | 'updatedAt'>>({
        name,
        description: '',
        content: name,
        category: category as PromptBlock['category'],
        tags: [category],
      })
    );

    const settings = withTimestamps<Omit<AppSettings, 'id' | 'createdAt' | 'updatedAt'>>({
      theme: 'dark',
      defaultExportFormat: 'markdown',
      defaultWorkspaceName: 'Prompt Hub',
      autosave: true,
    });

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
        await appDatabase.workspaces.add(workspace);
        await appDatabase.roles.add(role);
        await appDatabase.promptFrameworks.bulkAdd([fiveLayer, developerTask]);
        await appDatabase.promptTemplates.add(template);
        await appDatabase.agents.add(agent);
        await appDatabase.skills.add(skill);
        await appDatabase.promptBlocks.bulkAdd(blocks);
        await appDatabase.settings.add(settings);
      }
    );
  }
}
