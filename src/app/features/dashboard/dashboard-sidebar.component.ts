import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { DashboardNavItem, DashboardSectionId } from './dashboard-nav.types';

@Component({
  selector: 'app-dashboard-sidebar',
  imports: [RouterLink, RouterLinkActive],
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
          <a
            [routerLink]="item.route"
            routerLinkActive
            #rla="routerLinkActive"
            class="group flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors"
            [class.bg-primary]="rla.isActive"
            [class.text-primary-foreground]="rla.isActive"
            [class.text-foreground]="!rla.isActive"
            [class.hover:bg-muted]="!rla.isActive"
          >
            <span class="flex-1 text-left">{{ item.label }}</span>
            @if (rla.isActive) {
              <svg class="h-4 w-4 opacity-60" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            }
          </a>
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
