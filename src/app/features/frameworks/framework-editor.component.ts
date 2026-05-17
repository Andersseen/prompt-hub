import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { VoltButton, VoltCard, VoltFormField, VoltInput, VoltLabel, VoltTextarea } from '@voltui/components';

import { PromptFramework, PromptFrameworkSection } from '../../core/models/entities';
import { createId } from '../../core/utils/entity-utils';
import { TagInputComponent } from '../../shared/components/tag-input.component';

@Component({
  selector: 'app-framework-editor',
  imports: [
    TagInputComponent,
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
        <h3 class="text-sm font-semibold">Framework Editor</h3>
        <volt-button variant="solid" size="sm" (click)="saveCurrent()">Save</volt-button>
      </div>

      @if (framework(); as fw) {
        <form class="flex flex-col gap-4" (submit)="submit($event, fw)">
          <!-- Basic Info -->
          <div class="space-y-3">
            <volt-form-field>
              <volt-label>Name</volt-label>
              <volt-input name="frameworkName" [(value)]="fw.name" />
            </volt-form-field>

            <volt-form-field>
              <volt-label>Description</volt-label>
              <volt-textarea [rows]="3" [(value)]="fw.description" />
            </volt-form-field>
          </div>

          <app-tag-input name="frameworkTags" [tags]="fw.tags" (tagsChange)="fw.tags = $event" />

          <!-- Sections -->
          <div class="rounded-lg border border-border bg-background p-3">
            <div class="mb-3 flex items-center justify-between">
              <h4 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sections ({{ fw.sections.length }})
              </h4>
              <volt-button variant="outline" size="sm" (click)="addSection(fw)">Add Section</volt-button>
            </div>

            <div class="flex flex-col gap-2">
              @for (section of sortedSections(fw); track section.id) {
                <div class="rounded-md border border-border bg-surface p-3">
                  <div class="grid gap-2 sm:grid-cols-[1fr_1fr_60px]">
                    <input
                      class="form-control text-xs"
                      placeholder="Key (e.g. 'role')"
                      [value]="section.key"
                      (input)="section.key = readInputValue($event)"
                    />
                    <input
                      class="form-control text-xs"
                      placeholder="Label (e.g. 'Role')"
                      [value]="section.label"
                      (input)="section.label = readInputValue($event)"
                    />
                    <input
                      class="form-control text-xs"
                      type="number"
                      [value]="section.order"
                      (input)="section.order = readNumberValue($event)"
                    />
                  </div>
                  <textarea
                    class="form-control mt-2 min-h-[60px] text-xs"
                    placeholder="Description of this section..."
                    [value]="section.description"
                    (input)="section.description = readTextAreaValue($event)"
                  ></textarea>
                  <input
                    class="form-control mt-2 text-xs"
                    placeholder="Placeholder text..."
                    [value]="section.placeholder"
                    (input)="section.placeholder = readInputValue($event)"
                  />
                  <div class="mt-2 flex items-center justify-between">
                    <label class="flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        class="h-3.5 w-3.5 rounded border-border"
                        [checked]="section.required"
                        (change)="section.required = readCheckedValue($event)"
                      />
                      Required field
                    </label>
                    <button
                      type="button"
                      class="rounded-md p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      (click)="removeSection(fw, section.id)"
                    >
                      <svg class="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        </form>
      } @else {
        <div class="flex flex-col items-center justify-center py-12 text-center">
          <svg class="mb-3 h-8 w-8 text-muted-foreground/50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p class="text-sm text-muted-foreground">Select a framework to edit</p>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FrameworkEditorComponent {
  readonly framework = input<PromptFramework | undefined>(undefined);

  readonly save = output<PromptFramework>();

  saveCurrent(): void {
    const fw = this.framework();
    if (fw) {
      fw.sections = this.sortedSections(fw);
      this.save.emit(fw);
    }
  }

  submit(event: Event, framework: PromptFramework): void {
    event.preventDefault();
    framework.sections = this.sortedSections(framework);
    this.save.emit(framework);
  }

  addSection(framework: PromptFramework): void {
    framework.sections = [...framework.sections, this.makeSection(framework.sections.length + 1)];
  }

  removeSection(framework: PromptFramework, sectionId: string): void {
    framework.sections = framework.sections.filter((section) => section.id !== sectionId);
  }

  sortedSections(framework: PromptFramework): PromptFrameworkSection[] {
    return [...framework.sections].sort((a, b) => a.order - b.order);
  }

  readInputValue(event: Event): string {
    return event.target instanceof HTMLInputElement ? event.target.value : '';
  }

  readTextAreaValue(event: Event): string {
    return event.target instanceof HTMLTextAreaElement ? event.target.value : '';
  }

  readNumberValue(event: Event): number {
    const value = this.readInputValue(event);
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  readCheckedValue(event: Event): boolean {
    return event.target instanceof HTMLInputElement ? event.target.checked : false;
  }

  private makeSection(order: number): PromptFrameworkSection {
    return {
      id: createId(),
      key: `section${order}`,
      label: `Section ${order}`,
      description: '',
      required: false,
      placeholder: '',
      order,
    };
  }
}
