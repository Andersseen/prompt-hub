import { EntityType } from '../../core/models/entities';

export type DashboardSectionId = EntityType | 'importExport';

export interface DashboardNavItem {
  id: DashboardSectionId;
  label: string;
  route: string;
}
