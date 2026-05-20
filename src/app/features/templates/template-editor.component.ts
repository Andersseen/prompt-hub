import { ChangeDetectionStrategy, Component, effect, input, output, signal, untracked } from '@angular/core';
import { VoltBadge, VoltButton, VoltCard, VoltFormField, VoltInput, VoltLabel, VoltTextarea } from '@voltui/components';

import { PromptFramework, PromptFrameworkSection, PromptTemplate, Role } from '../../core/models/entities';
import { TagInputComponent } from '../../shared/components/tag-input.component';

type OutputMode = 'markdown' | 'json' | 'yaml' | 'raw';

@Component({
  selector: 'app-template-editor',
  imports: [
    TagInputComponent,
    VoltBadge,
    VoltButton,
    VoltCard,
    VoltFormField,
    VoltInput,
    VoltLabel,
    VoltTextarea,
  ],
  template: `
    <div class="editor-panel flex flex-col gap-5">
      <div class="flex items-center justify-between border-b border-border pb-3">
        <h3 class="text-sm font-semibold">Template Editor</h3>
        <div class="flex gap-2">
          <volt-button variant="solid" size="sm" [disabled]="saving()" (click)="saveCurrent()">Save</volt-button>
          <volt-button variant="outline" size="sm" (click)="copyOutput.emit()">Copy</volt-button>
        </div>
      </div>

      @if (draft(); as t) {
        <form class="flex flex-col gap-4" (submit)="submit($event)">
          <!-- Basic Info -->
          <div class="space-y-3">
            <volt-form-field>
              <volt-label>Name</volt-label>
              <volt-input name="templateName" [value]="t.name" (valueChange)="updateField('name', $event)" />
            </volt-form-field>

            <volt-form-field>
              <volt-label>Description</volt-label>
              <volt-textarea [rows]="3" [value]="t.description" (valueChange)="updateField('description', $event)" />
            </volt-form-field>
          </div>

          <!-- Configuration -->
          <div class="rounded-lg border border-border bg-background p-3">
            <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Configuration</h4>
            <div class="space-y-3">
              <div class="grid gap-3 sm:grid-cols-2">
                <volt-form-field>
                  <volt-label>Framework</volt-label>
                  <select
                    class="form-control"
                    name="templateFramework"
                    [value]="t.frameworkId"
                    (change)="updateFramework($event)"
                  >
                    @for (framework of frameworks(); track framework.id) {
                      <option [value]="framework.id">{{ framework.name }}</option>
                    }
                  </select>
                </volt-form-field>

                <volt-form-field>
                  <volt-label>Role</volt-label>
                  <select
                    class="form-control"
                    name="templateRole"
                    [value]="t.roleId"
                    (change)="updateRoleId($event)"
                  >
                    <option value="">No role</option>
                    @for (role of roles(); track role.id) {
                      <option [value]="role.id">{{ role.name }}</option>
                    }
                  </select>
                </volt-form-field>
              </div>
            </div>
          </div>

          <!-- Sections -->
          @if (sections().length > 0) {
            <div class="rounded-lg border border-border bg-background p-3">
              <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sections ({{ sections().length }})
              </h4>
              <div class="flex flex-col gap-3">
                @for (section of sections(); track section.id) {
                  <volt-form-field>
                    <volt-label>{{ section.label }}</volt-label>
                    <textarea
                      class="form-control min-h-[80px] text-sm"
                      name="value-{{ section.key }}"
                      [placeholder]="section.placeholder || 'Enter ' + section.label + '...'"
                      [value]="t.values[section.key] ?? ''"
                      (input)="updateSectionValue(section.key, readTextAreaValue($event))"
                    ></textarea>
                  </volt-form-field>
                }
              </div>
            </div>
          }

          <!-- Tags -->
          <app-tag-input name="templateTags" [tags]="t.tags" (tagsChange)="updateField('tags', $event)" />

          <!-- Output -->
          <div class="rounded-lg border border-border bg-background p-3">
            <div class="mb-2 flex items-center justify-between">
              <h4 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Output</h4>
              <select
                class="form-control w-auto text-xs"
                name="outputMode"
                [value]="outputMode()"
                (change)="outputModeChange.emit(readOutputMode($event))"
              >
                <option value="markdown">Markdown</option>
                <option value="yaml">YAML</option>
                <option value="json">JSON</option>
                <option value="raw">Raw</option>
              </select>
            </div>
            <pre class="max-h-[250px] overflow-auto rounded-md bg-black/30 p-3 text-[11px] leading-relaxed text-slate-300">{{ preview() }}</pre>
          </div>
        </form>
      } @else {
        <div class="flex flex-col items-center justify-center py-12 text-center">
          <svg class="mb-3 h-8 w-8 text-muted-foreground/50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-sm text-muted-foreground">Select a template to edit</p>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TemplateEditorComponent {
  readonly template = input<PromptTemplate | undefined>(undefined);
  readonly frameworks = input<PromptFramework[]>([]);
  readonly roles = input<Role[]>([]);
  readonly sections = input<PromptFrameworkSection[]>([]);
  readonly outputMode = input<OutputMode>('markdown');
  readonly preview = input('');
  readonly saving = input(false);

  readonly save = output<PromptTemplate>();
  readonly copyOutput = output<void>();
  readonly outputModeChange = output<OutputMode>();
  readonly frameworkChange = output<string>();
  readonly dirtyChange = output<boolean>();

  readonly draft = signal<PromptTemplate | undefined>(undefined);

  constructor() {
    effect(() => {
      const t = this.template();
      untracked(() => this.draft.set(t ? structuredClone(t) : undefined));
    });

    effect(() => {
      const d = this.draft();
      const t = untracked(this.template);
      const dirty = d && t ? JSON.stringify(d) !== JSON.stringify(t) : false;
      untracked(() => this.dirtyChange.emit(dirty));
    });
  }

  saveCurrent(): void {
    const t = this.draft();
    if (t) {
      this.save.emit(t);
    }
  }

  submit(event: Event): void {
    event.preventDefault();
    this.saveCurrent();
  }

  updateField<K extends keyof PromptTemplate>(key: K, value: PromptTemplate[K]): void {
    const d = this.draft();
    if (d) {
      this.draft.set({ ...d, [key]: value });
    }
  }

  updateFramework(event: Event): void {
    const d = this.draft();
    if (!d) return;
    const value = this.readSelectValue(event);
    this.draft.set({ ...d, frameworkId: value });
    this.frameworkChange.emit(value);
  }

  updateRoleId(event: Event): void {
    this.updateField('roleId', this.readSelectValue(event));
  }

  updateSectionValue(key: string, value: string): void {
    const d = this.draft();
    if (d) {
      this.draft.set({ ...d, values: { ...d.values, [key]: value } });
    }
  }

  readSelectValue(event: Event): string {
    return event.target instanceof HTMLSelectElement ? event.target.value : '';
  }

  readTextAreaValue(event: Event): string {
    return event.target instanceof HTMLTextAreaElement ? event.target.value : '';
  }

  readOutputMode(event: Event): OutputMode {
    const value = this.readSelectValue(event);
    const modes: OutputMode[] = ['markdown', 'yaml', 'json', 'raw'];
    return modes.includes(value as OutputMode) ? (value as OutputMode) : 'markdown';
  }
}
