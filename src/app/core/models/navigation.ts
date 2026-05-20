import { type EntityType } from './entities';

export type AppSectionId = EntityType | 'importExport';

export interface AppSection {
  id: AppSectionId;
  label: string;
  route: string;
  title: string;
  hasEditor: boolean;
}

export const APP_SECTIONS: readonly AppSection[] = [
  { id: 'agents', label: 'Agents', route: 'agents', title: 'Agents', hasEditor: true },
  { id: 'promptFrameworks', label: 'Prompt Frameworks', route: 'frameworks', title: 'Prompt Frameworks', hasEditor: true },
  { id: 'promptTemplates', label: 'Prompt Templates', route: 'templates', title: 'Prompt Templates', hasEditor: true },
  { id: 'skills', label: 'Skills', route: 'skills', title: 'Skills', hasEditor: true },
  { id: 'roles', label: 'Roles', route: 'roles', title: 'Roles', hasEditor: true },
  { id: 'promptBlocks', label: 'Prompt Blocks', route: 'blocks', title: 'Prompt Blocks', hasEditor: true },
  { id: 'importExport', label: 'Export / Import', route: 'import-export', title: 'Export / Import', hasEditor: false },
  { id: 'settings', label: 'Settings', route: 'settings', title: 'Settings', hasEditor: false },
] as const;

export function getAppSectionByRoute(route: string): AppSection | undefined {
  return APP_SECTIONS.find((s) => s.route === route);
}

export function getAppSectionById(id: AppSectionId): AppSection | undefined {
  return APP_SECTIONS.find((s) => s.id === id);
}

export function getAppSectionTitle(id: AppSectionId): string {
  return getAppSectionById(id)?.title ?? 'Prompt Hub';
}

export function toDashboardNavItems(): { id: AppSectionId; label: string; route: string }[] {
  return APP_SECTIONS.map((s) => ({ id: s.id, label: s.label, route: s.route }));
}
