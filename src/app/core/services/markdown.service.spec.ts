import { describe, expect, it } from 'vitest';

import { Agent, PromptFramework, PromptTemplate, Role, Skill } from '../models/entities';
import { MarkdownService } from './markdown.service';

const timestamp = '2026-01-01T00:00:00.000Z';

describe('MarkdownService', () => {
  const service = new MarkdownService();

  it('generates skill markdown with the expected sections', () => {
    const skill: Skill = {
      id: 'skill-1',
      name: 'Code Review',
      description: 'Review code carefully.',
      instructions: 'Lead with findings.',
      inputFormat: 'Diff',
      outputFormat: 'Markdown',
      constraints: 'Avoid noise.',
      tags: ['review'],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    expect(service.skill(skill)).toContain('# Skill: Code Review');
    expect(service.skill(skill)).toContain('## Instructions');
    expect(service.skill(skill)).toContain('Lead with findings.');
  });

  it('orders prompt template sections by framework order', () => {
    const framework: PromptFramework = {
      id: 'framework-1',
      name: 'Framework',
      description: '',
      tags: [],
      createdAt: timestamp,
      updatedAt: timestamp,
      sections: [
        {
          id: 'task',
          key: 'task',
          label: 'Task',
          description: '',
          required: true,
          placeholder: '',
          order: 2,
        },
        {
          id: 'role',
          key: 'role',
          label: 'Role',
          description: '',
          required: true,
          placeholder: '',
          order: 1,
        },
      ],
    };
    const template: PromptTemplate = {
      id: 'template-1',
      name: 'Template',
      description: '',
      frameworkId: framework.id,
      roleId: '',
      values: {
        role: 'Act as a senior engineer.',
        task: 'Review this implementation.',
      },
      tags: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const markdown = service.promptTemplate(template, framework);

    expect(markdown.indexOf('## Role')).toBeLessThan(markdown.indexOf('## Task'));
  });

  it('generates agent markdown with role, skills, instructions and defaults', () => {
    const role: Role = {
      id: 'role-1',
      name: 'Angular Expert',
      description: '',
      content: 'You are an Angular expert.',
      tags: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const agent: Agent = {
      id: 'agent-1',
      name: 'Angular Assistant',
      description: 'Helps with Angular.',
      roleId: role.id,
      promptTemplateIds: [],
      skillIds: ['skill-1'],
      defaultOutputFormat: 'Markdown',
      defaultConstraints: 'Use strict TypeScript.',
      tags: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const markdown = service.agent(agent, role, [], []);

    expect(markdown).toContain('# Agent: Angular Assistant');
    expect(markdown).toContain('You are an Angular expert.');
    expect(markdown).toContain('Use strict TypeScript.');
  });
});
