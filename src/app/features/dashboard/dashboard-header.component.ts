import { Component, EventEmitter, Input, Output } from '@angular/core';

import { VoltInput } from '@voltui/components';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [VoltInput],
  template: `
    <header class="mb-5 flex flex-col gap-3 border-b border-border pb-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p class="text-sm text-muted-foreground">{{ workspaceName || 'Loading workspace' }}</p>
        <h2 class="text-2xl font-semibold">{{ title }}</h2>
      </div>

      @if (showFilters) {
        <div class="grid gap-2 sm:grid-cols-2 md:min-w-[420px]">
          <volt-input
            placeholder="Search by text"
            [value]="search"
            (valueChange)="searchChange.emit($event)"
          />
          <volt-input
            placeholder="Filter tags: angular, review"
            [value]="tagFilter"
            (valueChange)="tagFilterChange.emit($event)"
          />
        </div>
      }
    </header>
  `,
})
export class DashboardHeaderComponent {
  @Input() workspaceName = '';
  @Input() title = '';
  @Input() showFilters = true;
  @Input() search = '';
  @Input() tagFilter = '';
  @Output() searchChange = new EventEmitter<string>();
  @Output() tagFilterChange = new EventEmitter<string>();
}
