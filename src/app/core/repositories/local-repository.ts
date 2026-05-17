import { Injectable } from '@angular/core';
import { Table } from 'dexie';

import { TimestampedEntity } from '../models/entities';
import { duplicateEntity, touch } from '../utils/entity-utils';

export interface LocalRepository<T extends TimestampedEntity> {
  create(entity: T): Promise<T>;
  update(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
  duplicate(id: string): Promise<T | undefined>;
  getById(id: string): Promise<T | undefined>;
  getAll(): Promise<T[]>;
  searchByText(query: string): Promise<T[]>;
  filterByTags(tags: string[]): Promise<T[]>;
}

@Injectable()
export abstract class DexieRepository<T extends TimestampedEntity & { tags?: string[] }>
  implements LocalRepository<T>
{
  protected constructor(private readonly table: Table<T, string>) {}

  async create(entity: T): Promise<T> {
    await this.table.put(entity);
    return entity;
  }

  async update(entity: T): Promise<T> {
    const updated = touch(entity);
    await this.table.put(updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.table.delete(id);
  }

  async duplicate(id: string): Promise<T | undefined> {
    const entity = await this.getById(id);

    if (!entity) {
      return undefined;
    }

    const copy = duplicateEntity(entity);
    await this.table.put(copy);
    return copy;
  }

  async getById(id: string): Promise<T | undefined> {
    return this.table.get(id);
  }

  async getAll(): Promise<T[]> {
    return this.table.orderBy('updatedAt').reverse().toArray();
  }

  async searchByText(query: string): Promise<T[]> {
    const normalized = query.trim().toLowerCase();

    if (!normalized) {
      return this.getAll();
    }

    const entities = await this.getAll();
    return entities.filter((entity) =>
      JSON.stringify(entity).toLowerCase().includes(normalized)
    );
  }

  async filterByTags(tags: string[]): Promise<T[]> {
    const normalizedTags = tags.map((tag) => tag.toLowerCase());

    if (!normalizedTags.length) {
      return this.getAll();
    }

    const entities = await this.getAll();
    return entities.filter((entity) => {
      const entityTags = (entity.tags ?? []).map((tag) => tag.toLowerCase());
      return normalizedTags.every((tag) => entityTags.includes(tag));
    });
  }

  async replaceAll(entities: T[]): Promise<void> {
    await this.table.clear();
    await this.table.bulkPut(entities);
  }
}
