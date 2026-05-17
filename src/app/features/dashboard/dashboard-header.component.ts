import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { VoltInput } from '@voltui/components';
import { VoltButton } from '@voltui/components';

@Component({
  selector: 'app-dashboard-header',
  imports: [VoltInput, VoltButton],
  template: `
    <header class="mb-6 flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="text-xs font-medium uppercase tracking-wider text-muted-foreground">{{ workspaceName() || 'Workspace' }}</p>
        <h2 class="mt-1 text-2xl font-semibold tracking-tight">{{ title() }}</h2>
      </div>

      @if (showFilters()) {
        <div class="flex gap-2 md:min-w-[420px]">
          <div class="relative flex-1">
            <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <volt-input
              class="w-full"
              placeholder="Search..."
              [value]="search()"
              (valueChange)="searchChange.emit($event)"
            />
          </div>
          <div class="relative flex-1">
            <svg class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <volt-input
              class="w-full"
              placeholder="Filter by tags..."
              [value]="tagFilter()"
              (valueChange)="tagFilterChange.emit($event)"
            />
          </div>
        </div>
      }
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardHeaderComponent {
  readonly workspaceName = input('');
  readonly title = input('');
  readonly showFilters = input(true);
  readonly search = input('');
  readonly tagFilter = input('');
  readonly searchChange = output<string>();
  readonly tagFilterChange = output<string>();
}
