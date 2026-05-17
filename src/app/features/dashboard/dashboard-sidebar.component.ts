import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { DashboardNavItem, DashboardSectionId } from './dashboard-nav.types';

@Component({
  selector: 'app-dashboard-sidebar',
  imports: [],
  template: `
    <aside class="flex h-full flex-col border-b border-border bg-surface p-5 lg:border-b-0 lg:border-r">
      <!-- Brand -->
      <div class="mb-8">
        <p class="text-[10px] font-semibold uppercase tracking-widest text-primary">Prompt Hub</p>
        <h1 class="mt-1 text-xl font-bold tracking-tight">Workspace</h1>
        <p class="mt-1.5 text-xs leading-relaxed text-muted-foreground">
          Local-first prompt management
        </p>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 space-y-0.5" aria-label="Primary navigation">
        @for (item of items(); track item.id) {
          <button
            type="button"
            class="group flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors"
            [class.bg-primary]="activeId() === item.id"
            [class.text-primary-foreground]="activeId() === item.id"
            [class.text-foreground]="activeId() !== item.id"
            [class.hover:bg-muted]="activeId() !== item.id"
            (click)="sectionSelected.emit(item.id)"
          >
            <span class="flex-1 text-left">{{ item.label }}</span>
            @if (activeId() === item.id) {
              <svg class="h-4 w-4 opacity-60" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            }
          </button>
        }
      </nav>

      <!-- Footer info -->
      <div class="mt-auto rounded-lg border border-border bg-background p-3">
        <p class="text-[11px] leading-relaxed text-muted-foreground">
          <span class="font-medium text-foreground">Local Storage</span><br />
          Data stays in your browser. Export regularly to back up.
        </p>
      </div>
    </aside>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSidebarComponent {
  readonly items = input<DashboardNavItem[]>([]);
  readonly activeId = input<DashboardSectionId>('agents');
  readonly sectionSelected = output<DashboardSectionId>();
}
