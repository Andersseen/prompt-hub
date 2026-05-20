import { Injectable, inject, signal } from '@angular/core';

import { PromptTemplate } from '../models/entities';
import { PromptTemplateRepository } from '../repositories/entity-repositories';

@Injectable({ providedIn: 'root' })
export class PromptTemplateStore {
  private readonly repo = inject(PromptTemplateRepository);
  readonly items = signal<PromptTemplate[]>([]);

  async load(): Promise<void> {
    this.items.set(await this.repo.getAll());
  }

  async save(template: PromptTemplate): Promise<void> {
    await this.repo.update(template);
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
