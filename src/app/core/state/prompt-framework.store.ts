import { Injectable, inject, signal } from '@angular/core';

import { PromptFramework } from '../models/entities';
import { PromptFrameworkRepository } from '../repositories/entity-repositories';

@Injectable({ providedIn: 'root' })
export class PromptFrameworkStore {
  private readonly repo = inject(PromptFrameworkRepository);
  readonly items = signal<PromptFramework[]>([]);

  async load(): Promise<void> {
    this.items.set(await this.repo.getAll());
  }

  async save(framework: PromptFramework): Promise<void> {
    await this.repo.update(framework);
    await this.load();
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
    await this.load();
  }

  async duplicate(id: string): Promise<void> {
    await this.repo.duplicate(id);
    await this.load();
  }
}
