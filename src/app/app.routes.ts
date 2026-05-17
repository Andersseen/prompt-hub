import { Route } from '@angular/router';

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
      },
      {
        path: 'frameworks',
        loadComponent: () => import('./features/frameworks/frameworks-page.component').then(m => m.FrameworksPageComponent),
      },
      {
        path: 'templates',
        loadComponent: () => import('./features/templates/templates-page.component').then(m => m.TemplatesPageComponent),
      },
      {
        path: 'skills',
        loadComponent: () => import('./features/skills/skills-page.component').then(m => m.SkillsPageComponent),
      },
      {
        path: 'roles',
        loadComponent: () => import('./features/roles/roles-page.component').then(m => m.RolesPageComponent),
      },
      {
        path: 'blocks',
        loadComponent: () => import('./features/prompt-blocks/prompt-blocks-page.component').then(m => m.PromptBlocksPageComponent),
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
