import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { VoltButton, VoltCard } from '@voltui/components';
import { DashboardNavItem, DashboardSectionId } from './dashboard-nav.types';

// Individual imports - no barrel

@Component({
  selector: 'app-dashboard-sidebar',
  imports: [VoltButton, VoltCard],
  template: `
    <aside class="border-b border-border bg-surface p-4 lg:border-b-0 lg:border-r">
      <div class="mb-6">
        <p class="text-xs uppercase tracking-wide text-primary">Define once. Reuse anywhere.</p>
        <h1 class="mt-2 text-2xl font-semibold tracking-normal">Prompt Hub</h1>
        <p class="mt-2 text-sm text-muted-foreground">
          Local-first workspace for structured prompts and reusable agents.
        </p>
      </div>

      <nav class="grid gap-1" aria-label="Primary navigation">
        @for (item of items(); track item.id) {
          <volt-button
            variant="ghost"
            size="md"
            class="justify-start"
            [class.bg-foreground]="activeId() === item.id"
            [class.text-background]="activeId() === item.id"
            (click)="sectionSelected.emit(item.id)"
          >
            {{ item.label }}
          </volt-button>
        }
      </nav>

      <volt-card class="mt-6 block text-xs text-muted-foreground">
        Your data is stored locally in this browser. Export your workspace regularly if you want to move it to another device.
      </volt-card>
    </aside>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSidebarComponent {
  readonly items = input<DashboardNavItem[]>([]);
  readonly activeId = input<DashboardSectionId>('agents');
  readonly sectionSelected = output<DashboardSectionId>();
}
