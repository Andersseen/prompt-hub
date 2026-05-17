import { TimestampedEntity } from '../models/entities';

export const nowIso = (): string => new Date().toISOString();

export const createId = (): string => crypto.randomUUID();

export function withTimestamps<T extends object>(value: T): T & TimestampedEntity {
  const timestamp = nowIso();

  return {
    ...value,
    id: createId(),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function touch<T extends TimestampedEntity>(entity: T): T {
  return {
    ...entity,
    updatedAt: nowIso(),
  };
}

export function duplicateEntity<T extends TimestampedEntity & { name?: string }>(
  entity: T
): T {
  const timestamp = nowIso();

  return {
    ...entity,
    id: createId(),
    name: entity.name ? `${entity.name} Copy` : entity.name,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function formatTags(tags: string[]): string {
  return tags.join(', ');
}
