import { ChangeDetectionStrategy, Component, effect, input, output, signal, untracked } from '@angular/core';
import { VoltBadge, VoltButton, VoltCard, VoltFormField, VoltInput, VoltLabel, VoltTextarea } from '@voltui/components';

import { Agent, PromptTemplate, Role, Skill } from '../../core/models/entities';
import { TagInputComponent } from '../../shared/components/tag-input.component';

@Component({
  selector: 'app-agent-editor',
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
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-border pb-3">
        <h3 class="text-sm font-semibold">Agent Editor</h3>
        <div class="flex gap-2">
          <volt-button variant="solid" size="sm" type="submit" (click)="saveCurrent()">Save</volt-button>
          <volt-button variant="outline" size="sm" (click)="copyMarkdown.emit()">Copy</volt-button>
        </div>
      </div>

      @if (draft(); as a) {
        <form class="flex flex-col gap-4" (submit)="submit($event)">
          <!-- Basic Info -->
          <div class="space-y-3">
            <volt-form-field>
              <volt-label>Name</volt-label>
              <volt-input name="agentName" [value]="a.name" (valueChange)="updateField('name', $event)" />
            </volt-form-field>

            <volt-form-field>
              <volt-label>Description</volt-label>
              <volt-textarea [rows]="3" [value]="a.description" (valueChange)="updateField('description', $event)" />
            </volt-form-field>
          </div>

          <!-- Configuration -->
          <div class="rounded-lg border border-border bg-background p-3">
            <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Configuration</h4>
            <div class="space-y-3">
              <volt-form-field>
                <volt-label>Role</volt-label>
                <select class="form-control" name="agentRole" [value]="a.roleId" (change)="updateRoleId($event)">
                  <option value="">No role assigned</option>
                  @for (role of roles(); track role.id) {
                    <option [value]="role.id">{{ role.name }}</option>
                  }
                </select>
              </volt-form-field>

              <div class="grid gap-3 sm:grid-cols-2">
                <volt-form-field>
                  <volt-label>Skills ({{ a.skillIds.length }})</volt-label>
                  <select class="form-control min-h-[120px]" multiple name="agentSkills" (change)="updateSkillIds($event)">
                    @for (skill of skills(); track skill.id) {
                      <option [value]="skill.id" [selected]="a.skillIds.includes(skill.id)">{{ skill.name }}</option>
                    }
                  </select>
                  <p class="mt-1 text-[10px] text-muted-foreground">Hold Ctrl/Cmd to select multiple</p>
                </volt-form-field>

                <volt-form-field>
                  <volt-label>Prompts ({{ a.promptTemplateIds.length }})</volt-label>
                  <select class="form-control min-h-[120px]" multiple name="agentTemplates" (change)="updateTemplateIds($event)">
                    @for (template of templates(); track template.id) {
                      <option [value]="template.id" [selected]="a.promptTemplateIds.includes(template.id)">{{ template.name }}</option>
                    }
                  </select>
                  <p class="mt-1 text-[10px] text-muted-foreground">Hold Ctrl/Cmd to select multiple</p>
                </volt-form-field>
              </div>
            </div>
          </div>

          <!-- Output Settings -->
          <div class="rounded-lg border border-border bg-background p-3">
            <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Output Settings</h4>
            <div class="space-y-3">
              <volt-form-field>
                <volt-label>Default Constraints</volt-label>
                <volt-textarea [rows]="3" [value]="a.defaultConstraints" (valueChange)="updateField('defaultConstraints', $event)" />
              </volt-form-field>

              <volt-form-field>
                <volt-label>Output Format</volt-label>
                <volt-textarea [rows]="3" [value]="a.defaultOutputFormat" (valueChange)="updateField('defaultOutputFormat', $event)" />
              </volt-form-field>
            </div>
          </div>

          <!-- Tags -->
          <app-tag-input name="agentTags" [tags]="a.tags" (tagsChange)="updateField('tags', $event)" />

          <!-- Preview -->
          @if (markdownPreview()) {
            <div class="rounded-lg border border-border bg-background p-3">
              <h4 class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preview</h4>
              <pre class="max-h-[300px] overflow-auto rounded-md bg-black/30 p-3 text-[11px] leading-relaxed text-slate-300">{{ markdownPreview() }}</pre>
            </div>
          }
        </form>
      } @else {
        <div class="flex flex-col items-center justify-center py-12 text-center">
          <svg class="mb-3 h-8 w-8 text-muted-foreground/50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 2.26L13.684 16.6zm-7.892 2.257l-.57 9.47m0 0l2.51-2.225m-2.51 2.225l5.227-2.26m0 0l-.57-9.47m0 0l-2.51 2.225" />
          </svg>
          <p class="text-sm text-muted-foreground">Select an agent to edit</p>
          <p class="mt-1 text-xs text-muted-foreground">or create a new one</p>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentEditorComponent {
  readonly agent = input<Agent | undefined>(undefined);
  readonly roles = input<Role[]>([]);
  readonly skills = input<Skill[]>([]);
  readonly templates = input<PromptTemplate[]>([]);
  readonly markdownPreview = input('');

  readonly save = output<Agent>();
  readonly copyMarkdown = output<void>();

  readonly draft = signal<Agent | undefined>(undefined);

  constructor() {
    effect(() => {
      const a = this.agent();
      untracked(() => this.draft.set(a ? structuredClone(a) : undefined));
    });
  }

  saveCurrent(): void {
    const a = this.draft();
    if (a) {
      this.save.emit(a);
    }
  }

  submit(event: Event): void {
    event.preventDefault();
    this.saveCurrent();
  }

  updateField<K extends keyof Agent>(key: K, value: Agent[K]): void {
    const d = this.draft();
    if (d) {
      this.draft.set({ ...d, [key]: value });
    }
  }

  updateRoleId(event: Event): void {
    this.updateField('roleId', this.readSelectValue(event));
  }

  updateSkillIds(event: Event): void {
    this.updateField('skillIds', this.readSelectedValues(event));
  }

  updateTemplateIds(event: Event): void {
    this.updateField('promptTemplateIds', this.readSelectedValues(event));
  }

  private readSelectValue(event: Event): string {
    return event.target instanceof HTMLSelectElement ? event.target.value : '';
  }

  private readSelectedValues(event: Event): string[] {
    if (!(event.target instanceof HTMLSelectElement)) {
      return [];
    }
    return Array.from(event.target.selectedOptions).map((option) => option.value);
  }
}
