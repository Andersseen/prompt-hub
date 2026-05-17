import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';
import { stringify } from 'yaml';

import { PromptTemplate } from '../../core/models/entities';
import { ClipboardService } from '../../core/services/clipboard.service';
import { MarkdownService } from '../../core/services/markdown.service';
import { WorkspaceStore } from '../../core/services/workspace-store.service';
import { withTimestamps } from '../../core/utils/entity-utils';
import { TemplateEditorComponent } from './template-editor.component';
import { TemplateListComponent } from './template-list.component';

type OutputMode = 'markdown' | 'json' | 'yaml' | 'raw';

@Component({
  selector: 'app-templates-page',
  imports: [TemplateEditorComponent, TemplateListComponent, ...MOVEMENT_DIRECTIVES],
  template: `
    <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_480px]">
      <app-template-list
        [templates]="filteredTemplates()"
        [frameworkName]="frameworkName()"
        (createNew)="startEdit(newTemplate())"
        (edit)="startEdit($event)"
        (duplicate)="duplicate($event)"
        (copyTemplate)="copyTemplate($event)"
        (remove)="remove($event)"
      />

      <app-template-editor
        [template]="editingTemplate()"
        [frameworks]="store.promptFrameworks()"
        [roles]="store.roles()"
        [sections]="sectionsForEditing()"
        [outputMode]="outputMode()"
        [preview]="preview()"
        (save)="save($event)"
        (copyOutput)="copyCurrent()"
        (outputModeChange)="setOutputMode($event)"
        (frameworkChange)="syncValues()"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplatesPageComponent implements OnInit {
  readonly store = inject(WorkspaceStore);
  private readonly markdown = inject(MarkdownService);
  private readonly clipboard = inject(ClipboardService);

  readonly editingTemplate = signal<PromptTemplate | undefined>(undefined);
  readonly outputMode = signal<OutputMode>('markdown');
  readonly filteredTemplates = computed(() => this.store.filterByQuery(this.store.promptTemplates()));

  readonly frameworkName = computed(() => {
    const t = this.editingTemplate();
    if (!t) return 'No framework';
    return this.store.promptFrameworks().find((fw) => fw.id === t.frameworkId)?.name ?? 'No framework';
  });

  readonly sectionsForEditing = computed(() => {
    const template = this.editingTemplate();
    if (!template) return [];
    const framework = this.store.promptFrameworks().find((fw) => fw.id === template.frameworkId);
    if (!framework) return [];
    return [...framework.sections].sort((a, b) => a.order - b.order);
  });

  readonly preview = computed(() => {
    const template = this.editingTemplate();
    if (!template) return '';
    const framework = this.store.promptFrameworks().find((fw) => fw.id === template.frameworkId);
    const role = this.store.roles().find((r) => r.id === template.roleId);
    const mode = this.outputMode();

    if (mode === 'raw') {
      return this.markdown.rawPrompt(template, framework);
    }
    if (mode === 'json') {
      return JSON.stringify(template, null, 2);
    }
    if (mode === 'yaml') {
      return stringify(template);
    }
    return this.markdown.promptTemplate(template, framework, role);
  });

  ngOnInit(): void {
    const first = this.store.promptTemplates()[0];
    this.editingTemplate.set(first ? structuredClone(first) : this.newTemplate());
  }

  startEdit(template: PromptTemplate): void {
    this.syncTemplateValues(template);
    this.editingTemplate.set(structuredClone(template));
  }

  async save(template: PromptTemplate): Promise<void> {
    this.syncTemplateValues(template);
    await this.store.saveTemplate(template);
    this.editingTemplate.set(structuredClone(template));
  }

  async duplicate(id: string): Promise<void> {
    await this.store.duplicate('promptTemplates', id);
  }

  async remove(id: string): Promise<void> {
    if (!window.confirm('Delete this template from local IndexedDB?')) {
      return;
    }
    await this.store.delete('promptTemplates', id);
  }

  async copyTemplate(template: PromptTemplate): Promise<void> {
    await this.copyText(this.templateOutput(template));
  }

  async copyCurrent(): Promise<void> {
    await this.copyText(this.preview());
  }

  setOutputMode(mode: OutputMode): void {
    this.outputMode.set(mode);
  }

  syncValues(): void {
    const template = this.editingTemplate();
    if (template) {
      this.syncTemplateValues(template);
    }
  }

  newTemplate(): PromptTemplate {
    const framework = this.store.promptFrameworks()[0];
    const template = withTimestamps({
      name: 'New Prompt Template',
      description: '',
      frameworkId: framework?.id ?? '',
      roleId: '',
      values: {},
      tags: [],
    });
    this.syncTemplateValues(template);
    return template;
  }

  private syncTemplateValues(template: PromptTemplate): void {
    const framework = this.store.promptFrameworks().find((fw) => fw.id === template.frameworkId);
    if (!framework) return;
    for (const section of framework.sections) {
      template.values[section.key] ??= '';
    }
  }

  private templateOutput(template: PromptTemplate): string {
    const framework = this.store.promptFrameworks().find((fw) => fw.id === template.frameworkId);
    const role = this.store.roles().find((r) => r.id === template.roleId);
    const mode = this.outputMode();

    if (mode === 'raw') {
      return this.markdown.rawPrompt(template, framework);
    }
    if (mode === 'json') {
      return JSON.stringify(template, null, 2);
    }
    if (mode === 'yaml') {
      return stringify(template);
    }
    return this.markdown.promptTemplate(template, framework, role);
  }

  private async copyText(value: string): Promise<void> {
    await this.clipboard.copy(value);
    this.store.notify('Copied to clipboard.');
  }
}
