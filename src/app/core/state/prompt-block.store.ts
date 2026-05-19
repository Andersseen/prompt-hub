import { Injectable, inject, signal } from '@angular/core';

import { PromptBlock } from '../models/entities';
import { PromptBlockRepository } from '../repositories/entity-repositories';

@Injectable({ providedIn: 'root' })
export class PromptBlockStore {
  private readonly repo = inject(PromptBlockRepository);
  readonly items = signal<PromptBlock[]>([]);

  async load(): Promise<void> {
    this.items.set(await this.repo.getAll());
  }

  async save(block: PromptBlock): Promise<void> {
    await this.repo.update(block);
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
