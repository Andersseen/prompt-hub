import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal, type Signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';
import {
  SplitterContainerDirective,
  SplitterHandleDirective,
  SplitterPanelDirective,
} from 'quartz-headless';

import { PromptFramework } from '../../core/models/entities';
import { type HasDirtyCheck } from '../../core/guards/dirty-check.guard';
import { WorkspaceStore } from '../../core/services/workspace-store.service';
import { withTimestamps } from '../../core/utils/entity-utils';
import { FrameworkEditorComponent } from './framework-editor.component';
import { FrameworkListComponent } from './framework-list.component';

@Component({
  selector: 'app-frameworks-page',
  imports: [
    FrameworkEditorComponent,
    FrameworkListComponent,
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
      <div qzSplitterPanel="true" class="min-w-0 pr-2">
        <app-framework-list
          [frameworks]="filteredFrameworks()"
          (createNew)="startEdit(newFramework())"
          (edit)="startEdit($event)"
          (duplicate)="duplicate($event)"
          (remove)="remove($event)"
        />
      </div>

      <div qzSplitterHandle></div>

      <div qzSplitterPanel="false" class="min-w-0 pl-2">
        <app-framework-editor
          [framework]="editingFramework()"
          [saving]="store.saving()"
          (save)="save($event)"
          (dirtyChange)="editorDirty.set($event)"
        />
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FrameworksPageComponent implements OnInit, HasDirtyCheck {
  readonly store = inject(WorkspaceStore);

  readonly editingFramework = signal<PromptFramework | undefined>(undefined);
  readonly editorDirty = signal(false);
  readonly isDirty: Signal<boolean> = computed(() => this.editorDirty());
  readonly filteredFrameworks = computed(() => this.store.filterByQuery(this.store.promptFrameworks()));

  ngOnInit(): void {
    const first = this.store.promptFrameworks()[0];
    this.editingFramework.set(first ? structuredClone(first) : this.newFramework());
  }

  startEdit(framework: PromptFramework): void {
    this.editingFramework.set(structuredClone(framework));
  }

  async save(framework: PromptFramework): Promise<void> {
    await this.store.saveFramework(framework);
    this.editingFramework.set(structuredClone(framework));
  }

  async duplicate(id: string): Promise<void> {
    await this.store.duplicate('promptFrameworks', id);
  }

  async remove(id: string): Promise<void> {
    if (!window.confirm('Delete this framework from local IndexedDB?')) {
      return;
    }
    await this.store.delete('promptFrameworks', id);
  }

  newFramework(): PromptFramework {
    return withTimestamps({
      name: 'New Framework',
      description: '',
      sections: [
        {
          id: crypto.randomUUID(),
          key: 'section1',
          label: 'Section 1',
          description: '',
          required: false,
          placeholder: '',
          order: 1,
        },
      ],
      tags: [],
    });
  }
}
