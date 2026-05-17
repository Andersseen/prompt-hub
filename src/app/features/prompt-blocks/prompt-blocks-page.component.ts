import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';

import { VoltBadge, VoltButton, VoltCard, VoltFormField, VoltInput, VoltLabel, VoltTextarea } from '@voltui/components';
import { EntityType, PromptBlock, PromptBlockCategory } from '../../core/models/entities';
import { ClipboardService } from '../../core/services/clipboard.service';
import { WorkspaceStore } from '../../core/services/workspace-store.service';
import { withTimestamps } from '../../core/utils/entity-utils';
import { TagInputComponent } from '../../shared/components/tag-input.component';

@Component({
  selector: 'app-prompt-blocks-page',
  imports: [
    TagInputComponent,
    VoltBadge,
    VoltButton,
    VoltCard,
    VoltFormField,
    VoltInput,
    VoltLabel,
    VoltTextarea,
    ...MOVEMENT_DIRECTIVES,
  ],
  template: `
    <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <!-- List -->
      <div class="flex flex-col gap-3" [moveStagger]="40">
        <div class="flex items-center justify-between">
          <p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {{ filteredBlocks().length }} {{ filteredBlocks().length === 1 ? 'Block' : 'Blocks' }}
          </p>
          <volt-button variant="solid" size="sm" (click)="editBlock(newBlock())">
            <svg class="mr-1.5 h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Block
          </volt-button>
        </div>

        <div class="flex flex-col gap-2">
          @for (block of filteredBlocks(); track block.id) {
            <div 
              class="group cursor-pointer rounded-lg border border-border bg-surface p-4 transition-all hover:border-primary/30 hover:bg-elevated hover:shadow-md"
              tabindex="0"
              [move]="{ opacity: [0, 1], y: [12, 0], scale: [0.98, 1] }"
              [moveWhileHover]="{ scale: [1, 1.01], y: [0, -1] }"
              (click)="editBlock(block)"
              (keydown.enter)="editBlock(block)"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2">
                    <h3 class="truncate text-sm font-semibold">{{ block.name }}</h3>
                    <span class="inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      {{ block.category }}
                    </span>
                  </div>
                  <p class="mt-1 line-clamp-2 text-xs text-muted-foreground">{{ block.content }}</p>
                  <div class="mt-2.5 flex flex-wrap items-center gap-1.5">
                    @for (tag of block.tags; track tag) {
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
                    title="Copy"
                    (click)="copyText(block.content); $event.stopPropagation()"
                  >
                    <svg class="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2M9 14l2 2 4-4" />
                    </svg>
                  </button>
                  <button 
                    type="button"
                    class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title="Duplicate"
                    (click)="duplicate('promptBlocks', block.id); $event.stopPropagation()"
                  >
                    <svg class="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button 
                    type="button"
                    class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title="Delete"
                    (click)="remove('promptBlocks', block.id); $event.stopPropagation()"
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

      <!-- Editor -->
      <div class="editor-panel flex flex-col gap-5">
        <div class="flex items-center justify-between border-b border-border pb-3">
          <h3 class="text-sm font-semibold">Block Editor</h3>
          <volt-button variant="solid" size="sm" (click)="saveCurrent()">Save</volt-button>
        </div>

        @if (editingBlock(); as block) {
          <form class="flex flex-col gap-4" (submit)="submitBlock($event, block)">
            <volt-form-field>
              <volt-label>Name</volt-label>
              <volt-input name="blockName" [(value)]="block.name" />
            </volt-form-field>

            <volt-form-field>
              <volt-label>Description</volt-label>
              <volt-textarea [rows]="3" [(value)]="block.description" />
            </volt-form-field>

            <volt-form-field>
              <volt-label>Content</volt-label>
              <volt-textarea [rows]="6" [(value)]="block.content" />
            </volt-form-field>

            <volt-form-field>
              <volt-label>Category</volt-label>
              <select
                class="form-control"
                name="blockCategory"
                [value]="block.category"
                (change)="block.category = readCategoryValue($event)"
              >
                @for (category of blockCategories; track category) {
                  <option [value]="category">{{ category }}</option>
                }
              </select>
            </volt-form-field>

            <app-tag-input name="blockTags" [tags]="block.tags" (tagsChange)="block.tags = $event" />
          </form>
        } @else {
          <div class="flex flex-col items-center justify-center py-12 text-center">
            <svg class="mb-3 h-8 w-8 text-muted-foreground/50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p class="text-sm text-muted-foreground">Select a block to edit</p>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromptBlocksPageComponent implements OnInit {
  private readonly clipboard = inject(ClipboardService);
  readonly store = inject(WorkspaceStore);
  readonly editingBlock = signal<PromptBlock | undefined>(undefined);
  readonly filteredBlocks = computed(() => this.store.filterByQuery(this.store.promptBlocks()));
  readonly blockCategories: PromptBlockCategory[] = [
    'constraint',
    'tone',
    'output',
    'validation',
    'style',
    'coding-rule',
    'reasoning-rule',
  ];

  ngOnInit(): void {
    this.editingBlock.set(this.store.promptBlocks()[0] ? structuredClone(this.store.promptBlocks()[0]) : this.newBlock());
  }

  editBlock(block: PromptBlock): void {
    this.editingBlock.set(structuredClone(block));
  }

  saveCurrent(): void {
    const block = this.editingBlock();
    if (block) {
      this.saveBlock(block);
    }
  }

  async saveBlock(block: PromptBlock): Promise<void> {
    await this.store.saveBlock(block);
    this.editingBlock.set(structuredClone(block));
  }

  async submitBlock(event: Event, block: PromptBlock): Promise<void> {
    event.preventDefault();
    await this.saveBlock(block);
  }

  newBlock(): PromptBlock {
    return withTimestamps({
      name: 'New Prompt Block',
      description: '',
      content: '',
      category: 'constraint' as PromptBlockCategory,
      tags: [],
    });
  }

  async duplicate(type: EntityType, id: string): Promise<void> {
    await this.store.duplicate(type, id);
  }

  async remove(type: EntityType, id: string): Promise<void> {
    if (!window.confirm('Delete this item from local IndexedDB?')) {
      return;
    }

    await this.store.delete(type, id);
  }

  async copyText(value: string): Promise<void> {
    await this.clipboard.copy(value);
    this.store.notify('Copied to clipboard.');
  }

  readCategoryValue(event: Event): PromptBlockCategory {
    const value = event.target instanceof HTMLSelectElement ? event.target.value : 'constraint';

    if (this.blockCategories.includes(value as PromptBlockCategory)) {
      return value as PromptBlockCategory;
    }

    return 'constraint';
  }
}
