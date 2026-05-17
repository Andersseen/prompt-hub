import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';

import { EntityType, PromptBlock, PromptBlockCategory } from '../../core/models/entities';
import { ClipboardService } from '../../core/services/clipboard.service';
import { WorkspaceStore } from '../../core/services/workspace-store.service';
import { formatTags, parseTags, withTimestamps } from '../../core/utils/entity-utils';
import { VOLT_UI } from '../../shared/ui/volt-ui';

@Component({
  selector: 'app-prompt-blocks-page',
  imports: [...VOLT_UI, ...MOVEMENT_DIRECTIVES],
  template: `
    <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div class="grid gap-3">
        <div class="flex justify-end">
          <volt-button variant="solid" (click)="editBlock(newBlock())">New Prompt Block</volt-button>
        </div>
        @for (block of filteredBlocks(); track block.id) {
          <volt-card [move]="'fade-up'">
            <div class="flex flex-col gap-3 md:flex-row md:justify-between">
              <div>
                <h3 class="text-lg font-semibold">{{ block.name }}</h3>
                <p class="text-sm text-muted-foreground">{{ block.content }}</p>
                <div class="mt-3 flex flex-wrap gap-2">
                  <volt-badge>{{ block.category }}</volt-badge>
                  @for (tag of block.tags; track tag) {
                    <volt-badge>{{ tag }}</volt-badge>
                  }
                </div>
              </div>
              <div class="flex flex-wrap gap-2">
                <volt-button (click)="editBlock(block)">Edit</volt-button>
                <volt-button (click)="copyText(block.content)">Copy</volt-button>
                <volt-button (click)="duplicate('promptBlocks', block.id)">Duplicate</volt-button>
                <volt-button variant="destructive" (click)="remove('promptBlocks', block.id)">Delete</volt-button>
              </div>
            </div>
          </volt-card>
        }
      </div>

      <volt-card>
        @if (editingBlock(); as block) {
          <form class="grid gap-3" (submit)="submitBlock($event, block)">
            <h3 class="text-lg font-semibold">Prompt Block Editor</h3>
            <volt-form-field><volt-label>Name</volt-label><volt-input name="blockName" [(value)]="block.name" /></volt-form-field>
            <volt-form-field><volt-label>Description</volt-label><volt-textarea [rows]="4" [(value)]="block.description" /></volt-form-field>
            <volt-form-field><volt-label>Content</volt-label><volt-textarea [rows]="4" [(value)]="block.content" /></volt-form-field>
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
            <volt-form-field>
              <volt-label>Tags</volt-label>
              <input
                class="form-control"
                name="blockTags"
                [value]="formatTags(block.tags)"
                (input)="block.tags = parseTags(readInputValue($event))"
              />
            </volt-form-field>
            <volt-button variant="solid" type="submit">Save Block</volt-button>
          </form>
        }
      </volt-card>
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

  formatTags(tags: string[]): string {
    return formatTags(tags);
  }

  parseTags(value: string): string[] {
    return parseTags(value);
  }

  readInputValue(event: Event): string {
    return event.target instanceof HTMLInputElement ? event.target.value : '';
  }

  readCategoryValue(event: Event): PromptBlockCategory {
    const value = event.target instanceof HTMLSelectElement ? event.target.value : 'constraint';

    if (this.blockCategories.includes(value as PromptBlockCategory)) {
      return value as PromptBlockCategory;
    }

    return 'constraint';
  }
}
