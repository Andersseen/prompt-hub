import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { AppDatabase } from '../db/app-database';
import { WorkspaceStore } from '../services/workspace-store.service';

describe('WorkspaceStore', () => {
  let store: WorkspaceStore;

  beforeEach(async () => {
    const db = TestBed.inject(AppDatabase);
    await db.delete();
    await db.open();
    store = TestBed.inject(WorkspaceStore);
  });

  it('initializes with seeded data', async () => {
    await store.init();

    expect(store.loading()).toBe(false);
    expect(store.roles()).toHaveLength(1);
    expect(store.agents()).toHaveLength(1);
    expect(store.skills()).toHaveLength(1);
    expect(store.promptTemplates()).toHaveLength(1);
    expect(store.promptFrameworks()).toHaveLength(2);
    expect(store.promptBlocks()).toHaveLength(6);
    expect(store.settings()).toBeDefined();
  });

  it('filters items by query', async () => {
    await store.init();
    store.search.set('Senior');

    expect(store.filterByQuery(store.roles())).toHaveLength(1);

    store.search.set('nonexistent');
    expect(store.filterByQuery(store.roles())).toHaveLength(0);
  });

  it('filters items by tags', async () => {
    await store.init();
    store.tagFilter.set('angular');

    expect(store.filterByQuery(store.roles())).toHaveLength(1);

    store.tagFilter.set('nonexistent');
    expect(store.filterByQuery(store.roles())).toHaveLength(0);
  });

  it('shows toast notification', () => {
    store.notify('Test message');
    expect(store.toast()).toBe('Test message');
  });
});
