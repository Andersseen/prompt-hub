import { Injectable, inject, signal } from '@angular/core';

import { Role } from '../models/entities';
import { RoleRepository } from '../repositories/entity-repositories';

@Injectable({ providedIn: 'root' })
export class RoleStore {
  private readonly repo = inject(RoleRepository);
  readonly items = signal<Role[]>([]);

  async load(): Promise<void> {
    this.items.set(await this.repo.getAll());
  }

  async save(role: Role): Promise<void> {
    await this.repo.update(role);
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
