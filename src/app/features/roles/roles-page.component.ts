import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';

import { Role } from '../../core/models/entities';
import { ClipboardService } from '../../core/services/clipboard.service';
import { MarkdownService } from '../../core/services/markdown.service';
import { WorkspaceStore } from '../../core/services/workspace-store.service';
import { withTimestamps } from '../../core/utils/entity-utils';
import { TagInputComponent } from '../../shared/components/tag-input.component';
import { VoltButton, VoltCard, VoltFormField, VoltInput, VoltLabel, VoltTextarea } from '@voltui/components';

@Component({
  selector: 'app-roles-page',
  imports: [
    TagInputComponent,
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
            {{ filteredRoles().length }} {{ filteredRoles().length === 1 ? 'Role' : 'Roles' }}
          </p>
          <volt-button variant="solid" size="sm" (click)="startEdit(newRole())">
            <svg class="mr-1.5 h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Role
          </volt-button>
        </div>

        <div class="flex flex-col gap-2">
          @for (role of filteredRoles(); track role.id) {
            <div 
              class="group cursor-pointer rounded-lg border border-border bg-surface p-4 transition-all hover:border-primary/30 hover:bg-elevated hover:shadow-md"
              tabindex="0"
              [move]="{ opacity: [0, 1], y: [12, 0], scale: [0.98, 1] }"
              [moveWhileHover]="{ scale: [1, 1.01], y: [0, -1] }"
              (click)="startEdit(role)"
              (keydown.enter)="startEdit(role)"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <h3 class="truncate text-sm font-semibold">{{ role.name }}</h3>
                  <p class="mt-1 line-clamp-2 text-xs text-muted-foreground">{{ role.description }}</p>
                  <div class="mt-2.5 flex flex-wrap items-center gap-1.5">
                    @for (tag of role.tags; track tag) {
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
                    (click)="duplicate(role.id); $event.stopPropagation()"
                  >
                    <svg class="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                  <button 
                    type="button"
                    class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    title="Copy Markdown"
                    (click)="copyMarkdown(role); $event.stopPropagation()"
                  >
                    <svg class="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2M9 14l2 2 4-4" />
                    </svg>
                  </button>
                  <button 
                    type="button"
                    class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    title="Delete"
                    (click)="remove(role.id); $event.stopPropagation()"
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
          <h3 class="text-sm font-semibold">Role Editor</h3>
          <volt-button variant="solid" size="sm" (click)="saveCurrent()">Save</volt-button>
        </div>

        @if (editingRole(); as role) {
          <form class="flex flex-col gap-4" (submit)="save(role)">
            <volt-form-field>
              <volt-label>Name</volt-label>
              <volt-input name="roleName" [(value)]="role.name" />
            </volt-form-field>

            <volt-form-field>
              <volt-label>Description</volt-label>
              <volt-textarea [rows]="3" [(value)]="role.description" />
            </volt-form-field>

            <volt-form-field>
              <volt-label>Content</volt-label>
              <volt-textarea [rows]="8" [(value)]="role.content" />
            </volt-form-field>

            <app-tag-input name="roleTags" [tags]="role.tags" (tagsChange)="role.tags = $event" />

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
              <path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p class="text-sm text-muted-foreground">Select a role to edit</p>
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesPageComponent implements OnInit {
  readonly store = inject(WorkspaceStore);
  private readonly markdown = inject(MarkdownService);
  private readonly clipboard = inject(ClipboardService);

  readonly editingRole = signal<Role | undefined>(undefined);
  readonly filteredRoles = computed(() => this.store.filterByQuery(this.store.roles()));
  readonly markdownPreview = computed(() => {
    const role = this.editingRole();
    return role ? this.markdown.role(role) : '';
  });

  ngOnInit(): void {
    const first = this.store.roles()[0];
    this.editingRole.set(first ? structuredClone(first) : this.newRole());
  }

  startEdit(role: Role): void {
    this.editingRole.set(structuredClone(role));
  }

  saveCurrent(): void {
    const role = this.editingRole();
    if (role) {
      this.save(role);
    }
  }

  async save(role: Role): Promise<void> {
    await this.store.saveRole(role);
    this.editingRole.set(structuredClone(role));
  }

  async duplicate(id: string): Promise<void> {
    await this.store.duplicate('roles', id);
  }

  async remove(id: string): Promise<void> {
    if (!window.confirm('Delete this role from local IndexedDB?')) {
      return;
    }
    await this.store.delete('roles', id);
  }

  async copyMarkdown(role: Role): Promise<void> {
    await this.clipboard.copy(this.markdown.role(role));
    this.store.notify('Copied to clipboard.');
  }

  newRole(): Role {
    return withTimestamps({
      name: 'New Role',
      description: '',
      content: '',
      tags: [],
    });
  }
}
