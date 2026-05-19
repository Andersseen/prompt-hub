import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { AppDatabase } from '../db/app-database';
import { SeedService } from '../services/seed.service';
import { RoleStore } from './role.store';

describe('RoleStore', () => {
  let store: RoleStore;

  beforeEach(async () => {
    const db = TestBed.inject(AppDatabase);
    await db.delete();
    await db.open();
    await TestBed.inject(SeedService).seedIfEmpty();
    store = TestBed.inject(RoleStore);
    await store.load();
  });

  it('loads seeded roles', () => {
    expect(store.items()).toHaveLength(1);
    expect(store.items()[0].name).toBe('Senior Web Developer');
  });

  it('saves an updated role', async () => {
    const role = store.items()[0];
    role.name = 'Updated Role';
    await store.save(role);

    expect(store.items()[0].name).toBe('Updated Role');
  });

  it('duplicates a role', async () => {
    const original = store.items()[0];
    await store.duplicate(original.id);

    expect(store.items()).toHaveLength(2);
    const names = store.items().map((r) => r.name);
    expect(names).toContain('Senior Web Developer Copy');
  });

  it('deletes a role', async () => {
    const role = store.items()[0];
    await store.delete(role.id);

    expect(store.items()).toHaveLength(0);
  });
});
