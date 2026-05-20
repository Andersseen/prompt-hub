import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';

import { getAppSectionByRoute, toDashboardNavItems } from '../../core/models/navigation';
import { ThemeService } from '../../core/services/theme.service';
import { WorkspaceStore } from '../../core/services/workspace-store.service';
import { DashboardHeaderComponent } from './dashboard-header.component';
import { DashboardSidebarComponent } from './dashboard-sidebar.component';

@Component({
  selector: 'app-prompt-hub-dashboard',
  imports: [
    DashboardHeaderComponent,
    DashboardSidebarComponent,
    RouterOutlet,
    ...MOVEMENT_DIRECTIVES,
  ],
  template: `
    <main class="min-h-screen bg-background text-foreground">
      <!-- Fixed Sidebar -->
      <div class="fixed left-0 top-0 z-40 h-screen w-[260px] overflow-y-auto border-r border-border bg-surface">
        <app-dashboard-sidebar [items]="navItems" />
      </div>

      <!-- Main Content -->
      <div class="ml-[260px] min-h-screen">
        <section class="min-w-0 p-4 md:p-6">
          <app-dashboard-header
            [workspaceName]="store.workspace()?.name || ''"
            [title]="activeTitle()"
            [showFilters]="!isUtilityRoute()"
            [search]="store.search()"
            [tagFilter]="store.tagFilter()"
            (searchChange)="store.setSearch($event)"
            (tagFilterChange)="store.setTagFilter($event)"
          />

          @if (store.loading()) {
            <div class="flex items-center justify-center rounded-lg border border-border bg-surface py-12 text-muted-foreground">
              <svg class="mr-2 h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading workspace...
            </div>
          } @else {
            <div [moveAnimation]="{ initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, duration: 280 }">
              <router-outlet />
            </div>
          }
        </section>
      </div>

      @if (store.toast(); as toastText) {
        <div 
          class="fixed bottom-4 right-4 rounded-lg border border-primary/30 bg-surface px-4 py-3 text-sm text-foreground shadow-lg"
          [moveAnimation]="{ initial: { opacity: 0, y: 16, scale: 0.96 }, animate: { opacity: 1, y: 0, scale: 1 }, duration: 240 }"
        >
          {{ toastText }}
        </div>
      }
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromptHubDashboardComponent implements OnInit {
  readonly store = inject(WorkspaceStore);
  private readonly router = inject(Router);
  private readonly theme = inject(ThemeService);

  readonly navItems = toDashboardNavItems();

  readonly activeTitle = computed(() => {
    const route = this.router.url.split('/').pop() || '';
    return getAppSectionByRoute(route)?.title ?? 'Prompt Hub';
  });

  async ngOnInit(): Promise<void> {
    await this.store.init();
  }

  isUtilityRoute(): boolean {
    const route = this.router.url.split('/').pop() || '';
    const section = getAppSectionByRoute(route);
    return section ? !section.hasEditor : false;
  }
}
