import { Injectable } from '@angular/core';

import {
  Agent,
  PromptFramework,
  PromptTemplate,
  Role,
  Skill,
  WorkspaceExport,
} from '../models/entities';

@Injectable({ providedIn: 'root' })
export class MarkdownService {
  role(role: Role): string {
    return [`# Role: ${role.name}`, role.description, '## Content', role.content].filter(Boolean).join('\n\n');
  }

  skill(skill: Skill): string {
    return [
      `# Skill: ${skill.name}`,
      '## Description',
      skill.description,
      '## Instructions',
      skill.instructions,
      '## Input Format',
      skill.inputFormat,
      '## Output Format',
      skill.outputFormat,
      '## Constraints',
      skill.constraints,
    ].join('\n\n');
  }

  promptTemplate(template: PromptTemplate, framework?: PromptFramework, role?: Role): string {
    const sections = [...(framework?.sections ?? [])].sort((a, b) => a.order - b.order);
    const body = sections.length
      ? sections
          .map((section) => `## ${section.label}\n\n${template.values[section.key] ?? ''}`.trim())
          .join('\n\n')
      : Object.entries(template.values)
          .map(([key, value]) => `## ${this.titleCase(key)}\n\n${value}`)
          .join('\n\n');

    return [
      `# Prompt: ${template.name}`,
      template.description,
      role ? `## Linked Role\n\n${role.content}` : '',
      body,
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  rawPrompt(template: PromptTemplate, framework?: PromptFramework): string {
    const sections = [...(framework?.sections ?? [])].sort((a, b) => a.order - b.order);

    if (!sections.length) {
      return Object.values(template.values).filter(Boolean).join('\n\n');
    }

    return sections.map((section) => template.values[section.key]).filter(Boolean).join('\n\n');
  }

  agent(
    agent: Agent,
    role: Role | undefined,
    skills: Skill[],
    templates: { template: PromptTemplate; framework?: PromptFramework }[]
  ): string {
    return [
      `# Agent: ${agent.name}`,
      agent.description,
      '## Role',
      role?.content ?? 'No linked role.',
      '## Skills',
      skills.length ? skills.map((skill) => `- ${skill.name}: ${skill.description}`).join('\n') : '- No linked skills.',
      '## Instructions',
      templates.length
        ? templates
            .map(({ template, framework }) => this.promptTemplate(template, framework))
            .join('\n\n---\n\n')
        : 'No linked prompt templates.',
      '## Constraints',
      agent.defaultConstraints,
      '## Output Format',
      agent.defaultOutputFormat,
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  workspace(data: WorkspaceExport): string {
    return [
      `# Workspace: ${data.workspace.name}`,
      data.workspace.description,
      `Schema version: ${data.schemaVersion}`,
      `Exported at: ${data.exportedAt}`,
      '## Roles',
      data.roles.map((role) => `- ${role.name}: ${role.description}`).join('\n'),
      '## Prompt Frameworks',
      data.promptFrameworks.map((framework) => `- ${framework.name}: ${framework.description}`).join('\n'),
      '## Prompt Templates',
      data.promptTemplates.map((template) => `- ${template.name}: ${template.description}`).join('\n'),
      '## Skills',
      data.skills.map((skill) => `- ${skill.name}: ${skill.description}`).join('\n'),
      '## Agents',
      data.agents.map((agent) => `- ${agent.name}: ${agent.description}`).join('\n'),
      '## Prompt Blocks',
      data.promptBlocks.map((block) => `- ${block.name}: ${block.content}`).join('\n'),
    ].join('\n\n');
  }

  private titleCase(value: string): string {
    return value.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase());
  }
}
