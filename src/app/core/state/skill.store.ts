import { Injectable, inject, signal } from '@angular/core';

import { Skill } from '../models/entities';
import { SkillRepository } from '../repositories/entity-repositories';

@Injectable({ providedIn: 'root' })
export class SkillStore {
  private readonly repo = inject(SkillRepository);
  readonly items = signal<Skill[]>([]);

  async load(): Promise<void> {
    this.items.set(await this.repo.getAll());
  }

  async save(skill: Skill): Promise<void> {
    await this.repo.update(skill);
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
