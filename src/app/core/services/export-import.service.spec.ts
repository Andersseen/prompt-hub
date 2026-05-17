import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { appDatabase } from '../db/app-database';
import { ExportImportService } from './export-import.service';
import { SeedService } from './seed.service';

describe('ExportImportService', () => {
  let service: ExportImportService;

  beforeEach(async () => {
    await appDatabase.delete();
    await appDatabase.open();
    await new SeedService().seedIfEmpty();
    service = TestBed.inject(ExportImportService);
  });

  it('exports the seeded local workspace as JSON', async () => {
    const json = await service.exportJson();
    const data = JSON.parse(json);

    expect(data.schemaVersion).toBe('1.0.0');
    expect(data.roles[0].name).toBe('Senior Web Developer');
    expect(data.promptFrameworks).toHaveLength(2);
  });

  it('validates malformed imports', () => {
    expect(() => service.parseImport('{ "schemaVersion": "1.0.0" }')).toThrow('workspace.id is required');
  });
});
