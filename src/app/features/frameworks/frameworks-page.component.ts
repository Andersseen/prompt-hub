import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';

import { PromptFramework } from '../../core/models/entities';
import { WorkspaceStore } from '../../core/services/workspace-store.service';
import { withTimestamps } from '../../core/utils/entity-utils';
import { FrameworkEditorComponent } from './framework-editor.component';
import { FrameworkListComponent } from './framework-list.component';

@Component({
  selector: 'app-frameworks-page',
  imports: [FrameworkEditorComponent, FrameworkListComponent, ...MOVEMENT_DIRECTIVES],
  template: `
    <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_460px]">
      <app-framework-list
        [frameworks]="filteredFrameworks()"
        (createNew)="startEdit(newFramework())"
        (edit)="startEdit($event)"
        (duplicate)="duplicate($event)"
        (remove)="remove($event)"
      />

      <app-framework-editor
        [framework]="editingFramework()"
        (save)="save($event)"
      />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FrameworksPageComponent implements OnInit {
  readonly store = inject(WorkspaceStore);

  readonly editingFramework = signal<PromptFramework | undefined>(undefined);
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
