import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';

import { Agent } from '../../core/models/entities';
import { ClipboardService } from '../../core/services/clipboard.service';
import { MarkdownService } from '../../core/services/markdown.service';
import { WorkspaceStore } from '../../core/services/workspace-store.service';
import { withTimestamps } from '../../core/utils/entity-utils';
import { AgentEditorComponent } from './agent-editor.component';
import { AgentListComponent } from './agent-list.component';

@Component({
  selector: 'app-agents-page',
  imports: [AgentListComponent, AgentEditorComponent, ...MOVEMENT_DIRECTIVES],
  template: `
    <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_440px]">
      <app-agent-list
        [agents]="filteredAgents()"
        [roleMap]="roleMap()"
        (createNew)="startEdit(newAgent())"
        (edit)="startEdit($event)"
        (duplicate)="duplicate($event)"
        (copyMarkdown)="copyMarkdown()"
        (export)="exportAgent()"
        (remove)="remove($event)"
      />

      <app-agent-editor
        [agent]="editingAgent()"
        [roles]="store.roles()"
        [skills]="store.skills()"
        [templates]="store.promptTemplates()"
        [markdownPreview]="markdownPreview()"
        (save)="save($event)"
        (copyMarkdown)="copyMarkdown()"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentsPageComponent implements OnInit {
  readonly store = inject(WorkspaceStore);
  private readonly markdown = inject(MarkdownService);
  private readonly clipboard = inject(ClipboardService);

  readonly editingAgent = signal<Agent | undefined>(undefined);
  readonly filteredAgents = computed(() => this.store.filterByQuery(this.store.agents()));

  readonly roleMap = computed(() => {
    const map: Record<string, string> = {};
    for (const role of this.store.roles()) {
      map[role.id] = role.name;
    }
    return map;
  });

  readonly markdownPreview = computed(() => {
    const agent = this.editingAgent();
    if (!agent) {
      return '';
    }
    return this.markdown.agent(
      agent,
      this.store.roles().find((role) => role.id === agent.roleId),
      this.store.skills().filter((skill) => agent.skillIds.includes(skill.id)),
      this.store
        .promptTemplates()
        .filter((template) => agent.promptTemplateIds.includes(template.id))
        .map((template) => ({
          template,
          framework: this.store.promptFrameworks().find((fw) => fw.id === template.frameworkId),
        }))
    );
  });

  ngOnInit(): void {
    const first = this.store.agents()[0];
    this.editingAgent.set(first ? structuredClone(first) : this.newAgent());
  }

  startEdit(agent: Agent): void {
    this.editingAgent.set(structuredClone(agent));
  }

  async save(agent: Agent): Promise<void> {
    await this.store.saveAgent(agent);
    this.editingAgent.set(structuredClone(agent));
  }

  async duplicate(id: string): Promise<void> {
    await this.store.duplicate('agents', id);
  }

  async remove(id: string): Promise<void> {
    if (!window.confirm('Delete this agent from local IndexedDB?')) {
      return;
    }
    await this.store.delete('agents', id);
  }

  async copyMarkdown(): Promise<void> {
    await this.clipboard.copy(this.markdownPreview());
    this.store.notify('Copied to clipboard.');
  }

  async exportAgent(): Promise<void> {
    await this.clipboard.copy(this.markdownPreview());
    this.store.notify('Copied to clipboard.');
  }

  newAgent(): Agent {
    return withTimestamps({
      name: 'New Agent',
      description: '',
      roleId: this.store.roles()[0]?.id ?? '',
      promptTemplateIds: [],
      skillIds: [],
      defaultOutputFormat: 'Markdown with clear sections.',
      defaultConstraints: '',
      tags: [],
    });
  }
}
