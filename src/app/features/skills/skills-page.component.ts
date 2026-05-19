import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal, type Signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';
import {
  SplitterContainerDirective,
  SplitterHandleDirective,
  SplitterPanelDirective,
} from 'quartz-headless';

import { Skill } from '../../core/models/entities';
import { type HasDirtyCheck } from '../../core/guards/dirty-check.guard';
import { ClipboardService } from '../../core/services/clipboard.service';
import { MarkdownService } from '../../core/services/markdown.service';
import { WorkspaceStore } from '../../core/services/workspace-store.service';
import { withTimestamps } from '../../core/utils/entity-utils';
import { TagInputComponent } from '../../shared/components/tag-input.component';
import { VoltButton, VoltCard, VoltFormField, VoltInput, VoltLabel, VoltTextarea } from '@voltui/components';

@Component({
  selector: 'app-skills-page',
  imports: [
    TagInputComponent,
    VoltButton,
    VoltCard,
    VoltFormField,
    VoltInput,
    VoltLabel,
    VoltTextarea,
    SplitterContainerDirective,
    SplitterHandleDirective,
    SplitterPanelDirective,
    ...MOVEMENT_DIRECTIVES,
  ],
  template: `
    <div
      qzSplitterContainer
      orientation="horizontal"
      [defaultPosition]="58"
      [minSize]="35"
      [maxSize]="75"
      [step]="1"
      style="height: calc(100vh - 140px);"
    >
      <!-- List -->
      <div qzSplitterPanel="true" class="min-w-0 pr-2">
        <div class="flex flex-col gap-3" [moveStagger]="40">
          <div class="flex items-center justify-between">
            <p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {{ filteredSkills().length }} {{ filteredSkills().length === 1 ? 'Skill' : 'Skills' }}
            </p>
            <volt-button variant="solid" size="sm" (click)="startEdit(newSkill())">
              <svg class="mr-1.5 h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New Skill
            </volt-button>
          </div>

          <div class="flex flex-col gap-2">
            @for (skill of filteredSkills(); track skill.id) {
              <div 
                class="group cursor-pointer rounded-lg border border-border bg-surface p-4 transition-all hover:border-primary/30 hover:bg-elevated hover:shadow-md"
                tabindex="0"
                [move]="{ opacity: [0, 1], y: [12, 0], scale: [0.98, 1] }"
                [moveWhileHover]="{ scale: [1, 1.01], y: [0, -1] }"
                (click)="startEdit(skill)"
                (keydown.enter)="startEdit(skill)"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <h3 class="truncate text-sm font-semibold">{{ skill.name }}</h3>
                    <p class="mt-1 line-clamp-2 text-xs text-muted-foreground">{{ skill.description }}</p>
                    <div class="mt-2.5 flex flex-wrap items-center gap-1.5">
                      @for (tag of skill.tags; track tag) {
                        <span class="inline-flex items-center rounded-md border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                          {{ tag }}
                        </span>
                      }
                    </div>
                  </div>

                  <div class="flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button 
                      type="button"
                      class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title="Duplicate"
                      (click)="duplicate(skill.id); $event.stopPropagation()"
                    >
                      <svg class="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button 
                      type="button"
                      class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      title="Copy Markdown"
                      (click)="copyMarkdown(skill); $event.stopPropagation()"
                    >
                      <svg class="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2M9 14l2 2 4-4" />
                      </svg>
                    </button>
                    <button 
                      type="button"
                      class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      title="Delete"
                      (click)="remove(skill.id); $event.stopPropagation()"
                    >
                      <svg class="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <div qzSplitterHandle></div>

      <!-- Editor -->
      <div qzSplitterPanel="false" class="min-w-0 pl-2">
        <div class="editor-panel flex flex-col gap-5">
          <div class="flex items-center justify-between border-b border-border pb-3">
            <h3 class="text-sm font-semibold">Skill Editor</h3>
            <volt-button variant="solid" size="sm" [disabled]="store.saving()" (click)="saveCurrent()">Save</volt-button>
          </div>

          @if (editingSkill(); as skill) {
            <form class="flex flex-col gap-4" (submit)="save(skill)">
              <volt-form-field>
                <volt-label>Name</volt-label>
                <volt-input name="skillName" [value]="skill.name" (valueChange)="updateField('name', $event)" />
              </volt-form-field>

              <volt-form-field>
                <volt-label>Description</volt-label>
                <volt-textarea [rows]="3" [value]="skill.description" (valueChange)="updateField('description', $event)" />
              </volt-form-field>

              <div class="rounded-lg border border-border bg-background p-3">
                <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Details</h4>
                <div class="flex flex-col gap-3">
                  <volt-form-field>
                    <volt-label>Instructions</volt-label>
                    <volt-textarea [rows]="4" [value]="skill.instructions" (valueChange)="updateField('instructions', $event)" />
                  </volt-form-field>
                  <volt-form-field>
                    <volt-label>Input Format</volt-label>
                    <volt-textarea [rows]="3" [value]="skill.inputFormat" (valueChange)="updateField('inputFormat', $event)" />
                  </volt-form-field>
                  <volt-form-field>
                    <volt-label>Output Format</volt-label>
                    <volt-textarea [rows]="3" [value]="skill.outputFormat" (valueChange)="updateField('outputFormat', $event)" />
                  </volt-form-field>
                  <volt-form-field>
                    <volt-label>Constraints</volt-label>
                    <volt-textarea [rows]="3" [value]="skill.constraints" (valueChange)="updateField('constraints', $event)" />
                  </volt-form-field>
                </div>
              </div>

              <app-tag-input name="skillTags" [tags]="skill.tags" (tagsChange)="updateField('tags', $event)" />

              @if (markdownPreview()) {
                <div class="rounded-lg border border-border bg-background p-3">
                  <h4 class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preview</h4>
                  <pre class="max-h-[200px] overflow-auto rounded-md bg-black/30 p-3 text-[11px] leading-relaxed text-slate-300">{{ markdownPreview() }}</pre>
                </div>
              }
            </form>
          } @else {
            <div class="flex flex-col items-center justify-center py-12 text-center">
              <svg class="mb-3 h-8 w-8 text-muted-foreground/50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p class="text-sm text-muted-foreground">Select a skill to edit</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillsPageComponent implements OnInit, HasDirtyCheck {
  readonly store = inject(WorkspaceStore);
  private readonly markdown = inject(MarkdownService);
  private readonly clipboard = inject(ClipboardService);

  readonly editingSkill = signal<Skill | undefined>(undefined);
  readonly filteredSkills = computed(() => this.store.filterByQuery(this.store.skills()));
  readonly markdownPreview = computed(() => {
    const skill = this.editingSkill();
    return skill ? this.markdown.skill(skill) : '';
  });

  readonly isDirty: Signal<boolean> = computed(() => {
    const draft = this.editingSkill();
    if (!draft) return false;
    const original = this.store.skills().find((s) => s.id === draft.id);
    if (!original) return true;
    return JSON.stringify(draft) !== JSON.stringify(original);
  });

  ngOnInit(): void {
    const first = this.store.skills()[0];
    this.editingSkill.set(first ? structuredClone(first) : this.newSkill());
  }

  startEdit(skill: Skill): void {
    this.editingSkill.set(structuredClone(skill));
  }

  updateField<K extends keyof Skill>(key: K, value: Skill[K]): void {
    const skill = this.editingSkill();
    if (skill) {
      this.editingSkill.set({ ...skill, [key]: value });
    }
  }

  saveCurrent(): void {
    const skill = this.editingSkill();
    if (skill) {
      this.save(skill);
    }
  }

  async save(skill: Skill): Promise<void> {
    await this.store.saveSkill(skill);
    this.editingSkill.set(structuredClone(skill));
  }

  async duplicate(id: string): Promise<void> {
    await this.store.duplicate('skills', id);
  }

  async remove(id: string): Promise<void> {
    if (!window.confirm('Delete this skill from local IndexedDB?')) {
      return;
    }
    await this.store.delete('skills', id);
  }

  async copyMarkdown(skill: Skill): Promise<void> {
    await this.clipboard.copy(this.markdown.skill(skill));
    this.store.notify('Copied to clipboard.');
  }

  newSkill(): Skill {
    return withTimestamps({
      name: 'New Skill',
      description: '',
      instructions: '',
      inputFormat: '',
      outputFormat: '',
      constraints: '',
      tags: [],
    });
  }
}
