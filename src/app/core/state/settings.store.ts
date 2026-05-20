import { Injectable, inject, signal } from '@angular/core';

import { AppSettings } from '../models/entities';
import { SettingsRepository } from '../repositories/entity-repositories';

@Injectable({ providedIn: 'root' })
export class SettingsStore {
  private readonly repo = inject(SettingsRepository);
  readonly item = signal<AppSettings | undefined>(undefined);

  async load(): Promise<void> {
    const [settings] = await this.repo.getAll();
    this.item.set(settings);
  }

  async save(settings: AppSettings): Promise<void> {
    await this.repo.update(settings);
    await this.load();
  }

  async delete(): Promise<void> {
    throw new Error('Settings cannot be deleted.');
  }

  async duplicate(): Promise<void> {
    throw new Error('Settings cannot be duplicated.');
  }
}
