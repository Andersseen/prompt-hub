import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { VoltBadge, VoltButton, VoltCard } from '@voltui/components';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';

import { PromptFramework } from '../../core/models/entities';

@Component({
  selector: 'app-framework-list',
  imports: [VoltBadge, VoltButton, VoltCard, ...MOVEMENT_DIRECTIVES],
  template: `
    <div class="flex flex-col gap-3" [moveStagger]="40">
      <div class="flex items-center justify-between">
        <p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {{ frameworks().length }} {{ frameworks().length === 1 ? 'Framework' : 'Frameworks' }}
        </p>
        <volt-button variant="solid" size="sm" (click)="createNew.emit()">
          <svg class="mr-1.5 h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Framework
        </volt-button>
      </div>

      <div class="flex flex-col gap-2">
        @for (framework of frameworks(); track framework.id) {
          <div 
            class="group cursor-pointer rounded-lg border border-border bg-surface p-4 transition-all hover:border-primary/30 hover:bg-elevated hover:shadow-md"
            tabindex="0"
            [move]="{ opacity: [0, 1], y: [12, 0], scale: [0.98, 1] }"
            [moveWhileHover]="{ scale: [1, 1.01], y: [0, -1] }"
            (click)="edit.emit(framework)"
            (keydown.enter)="edit.emit(framework)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <h3 class="truncate text-sm font-semibold">{{ framework.name }}</h3>
                <p class="mt-1 line-clamp-2 text-xs text-muted-foreground">{{ framework.description }}</p>
                
                <div class="mt-2.5 flex flex-wrap items-center gap-1.5">
                  @for (section of sortedSections(framework); track section.id) {
                    <span class="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {{ section.order }}. {{ section.label }}
                    </span>
                  }
                </div>
              </div>

              <div class="flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button 
                  type="button"
                  class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title="Duplicate"
                  (click)="duplicate.emit(framework.id); $event.stopPropagation()"
                >
                  <svg class="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button 
                  type="button"
                  class="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  title="Delete"
                  (click)="remove.emit(framework.id); $event.stopPropagation()"
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
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FrameworkListComponent {
  readonly frameworks = input<PromptFramework[]>([]);

  readonly createNew = output<void>();
  readonly edit = output<PromptFramework>();
  readonly duplicate = output<string>();
  readonly remove = output<string>();

  sortedSections(framework: PromptFramework) {
    return [...framework.sections].sort((a, b) => a.order - b.order);
  }
}
