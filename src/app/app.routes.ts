import { Route } from '@angular/router';

import { dirtyCheckGuard } from './core/guards/dirty-check.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./features/dashboard/prompt-hub-dashboard.component').then(m => m.PromptHubDashboardComponent),
    children: [
      {
        path: '',
        redirectTo: 'agents',
        pathMatch: 'full',
      },
      {
        path: 'agents',
        loadComponent: () => import('./features/agents/agents-page.component').then(m => m.AgentsPageComponent),
        canDeactivate: [dirtyCheckGuard],
      },
      {
        path: 'frameworks',
        loadComponent: () => import('./features/frameworks/frameworks-page.component').then(m => m.FrameworksPageComponent),
        canDeactivate: [dirtyCheckGuard],
      },
      {
        path: 'templates',
        loadComponent: () => import('./features/templates/templates-page.component').then(m => m.TemplatesPageComponent),
        canDeactivate: [dirtyCheckGuard],
      },
      {
        path: 'skills',
        loadComponent: () => import('./features/skills/skills-page.component').then(m => m.SkillsPageComponent),
        canDeactivate: [dirtyCheckGuard],
      },
      {
        path: 'roles',
        loadComponent: () => import('./features/roles/roles-page.component').then(m => m.RolesPageComponent),
        canDeactivate: [dirtyCheckGuard],
      },
      {
        path: 'blocks',
        loadComponent: () => import('./features/prompt-blocks/prompt-blocks-page.component').then(m => m.PromptBlocksPageComponent),
        canDeactivate: [dirtyCheckGuard],
      },
      {
        path: 'import-export',
        loadComponent: () => import('./features/import-export/import-export-page.component').then(m => m.ImportExportPageComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings-page.component').then(m => m.SettingsPageComponent),
      },
    ],
  },
];
