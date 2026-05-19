import { Injectable, inject, signal } from '@angular/core';

import { Agent } from '../models/entities';
import { AgentRepository } from '../repositories/entity-repositories';

@Injectable({ providedIn: 'root' })
export class AgentStore {
  private readonly repo = inject(AgentRepository);
  readonly items = signal<Agent[]>([]);

  async load(): Promise<void> {
    this.items.set(await this.repo.getAll());
  }

  async save(agent: Agent): Promise<void> {
    await this.repo.update(agent);
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
