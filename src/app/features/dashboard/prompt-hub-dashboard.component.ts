import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';

import { WorkspaceStore } from '../../core/services/workspace-store.service';
import { AgentsPageComponent } from '../agents/agents-page.component';
import { FrameworksPageComponent } from '../frameworks/frameworks-page.component';
import { ImportExportPageComponent } from '../import-export/import-export-page.component';
import { PromptBlocksPageComponent } from '../prompt-blocks/prompt-blocks-page.component';
import { RolesPageComponent } from '../roles/roles-page.component';
import { SettingsPageComponent } from '../settings/settings-page.component';
import { SkillsPageComponent } from '../skills/skills-page.component';
import { TemplatesPageComponent } from '../templates/templates-page.component';
import { DashboardHeaderComponent } from './dashboard-header.component';
import { DashboardNavItem, DashboardSectionId } from './dashboard-nav.types';
import { DashboardSidebarComponent } from './dashboard-sidebar.component';

type SectionId = DashboardSectionId;

@Component({
  selector: 'app-prompt-hub-dashboard',
  imports: [
    AgentsPageComponent,
    CommonModule,
    DashboardHeaderComponent,
    DashboardSidebarComponent,
    FrameworksPageComponent,
    ImportExportPageComponent,
    PromptBlocksPageComponent,
    RolesPageComponent,
    SettingsPageComponent,
    SkillsPageComponent,
    TemplatesPageComponent,
    ...MOVEMENT_DIRECTIVES,
  ],
  template: `
    <main class="min-h-screen bg-background text-foreground">
      <div class="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <app-dashboard-sidebar
          [items]="navItems"
          [activeId]="store.activeSection()"
          (sectionSelected)="selectSection($event)"
        />

        <section class="min-w-0 p-4 md:p-6">
          <app-dashboard-header
            [workspaceName]="store.workspace()?.name || ''"
            [title]="store.activeTitle()"
            [showFilters]="!isUtilitySection()"
            [search]="store.search()"
            [tagFilter]="store.tagFilter()"
            (searchChange)="store.search.set($event)"
            (tagFilterChange)="store.tagFilter.set($event)"
          />

          @if (store.loading()) {
            <div class="rounded-md border border-border bg-surface p-4 text-surface-foreground">Loading local workspace...</div>
          } @else {
            <section [move]="'fade-up'">
              @switch (store.activeSection()) {
                @case ('agents') {
                  <app-agents-page />
                }
                @case ('promptFrameworks') {
                  <app-frameworks-page />
                }
                @case ('promptTemplates') {
                  <app-templates-page />
                }
                @case ('skills') {
                  <app-skills-page />
                }
                @case ('roles') {
                  <app-roles-page />
                }
                @case ('promptBlocks') {
                  <app-prompt-blocks-page />
                }
                @case ('importExport') {
                  <app-import-export-page />
                }
                @case ('settings') {
                  <app-settings-page />
                }
              }
            </section>
          }
        </section>
      </div>

      @if (store.toast()) {
        <div class="fixed bottom-4 right-4 rounded-md border border-cyan-500/40 bg-slate-900 px-4 py-3 text-sm text-cyan-100 shadow-xl" [move]="'fade-up'">
          {{ store.toast() }}
        </div>
      }
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PromptHubDashboardComponent implements OnInit {
  readonly store = inject(WorkspaceStore);

  readonly navItems: DashboardNavItem[] = [
    { id: 'agents', label: 'Agents' },
    { id: 'promptFrameworks', label: 'Prompt Frameworks' },
    { id: 'promptTemplates', label: 'Prompt Templates' },
    { id: 'skills', label: 'Skills' },
    { id: 'roles', label: 'Roles' },
    { id: 'promptBlocks', label: 'Prompt Blocks' },
    { id: 'importExport', label: 'Export / Import' },
    { id: 'settings', label: 'Settings' },
  ];

  async ngOnInit(): Promise<void> {
    await this.store.init();
  }

  selectSection(id: SectionId): void {
    this.store.activeSection.set(id);
  }

  isUtilitySection(): boolean {
    return ['importExport', 'settings'].includes(this.store.activeSection());
  }
}
