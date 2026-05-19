import { Injectable, computed, inject, signal } from '@angular/core';

import {
  Agent,
  AppSettings,
  EntityType,
  PromptBlock,
  PromptFramework,
  PromptTemplate,
  Role,
  Skill,
  Workspace,
} from '../models/entities';
import {
  SettingsRepository,
  WorkspaceRepository,
} from '../repositories/entity-repositories';
import { SeedService } from './seed.service';
import { AgentStore } from '../state/agent.store';
import { PromptBlockStore } from '../state/prompt-block.store';
import { PromptFrameworkStore } from '../state/prompt-framework.store';
import { PromptTemplateStore } from '../state/prompt-template.store';
import { RoleStore } from '../state/role.store';
import { SettingsStore } from '../state/settings.store';
import { SkillStore } from '../state/skill.store';

@Injectable({ providedIn: 'root' })
export class WorkspaceStore {
  private readonly seed = inject(SeedService);
  private readonly workspaceRepo = inject(WorkspaceRepository);
  private readonly settingsRepo = inject(SettingsRepository);

  private readonly agentStore = inject(AgentStore);
  private readonly blockStore = inject(PromptBlockStore);
  private readonly frameworkStore = inject(PromptFrameworkStore);
  private readonly templateStore = inject(PromptTemplateStore);
  private readonly roleStore = inject(RoleStore);
  private readonly settingsStore = inject(SettingsStore);
  private readonly skillStore = inject(SkillStore);

  readonly workspace = signal<Workspace | undefined>(undefined);
  readonly roles = this.roleStore.items;
  readonly promptFrameworks = this.frameworkStore.items;
  readonly promptTemplates = this.templateStore.items;
  readonly agents = this.agentStore.items;
  readonly skills = this.skillStore.items;
  readonly promptBlocks = this.blockStore.items;
  readonly settings = this.settingsStore.item;
  readonly loading = signal(true);
  readonly activeSection = signal<EntityType | 'importExport'>('agents');
  readonly search = signal('');
  readonly tagFilter = signal('');
  readonly toast = signal('');

  private isRefreshing = false;

  readonly activeTitle = computed(() => {
    const titles: Record<string, string> = {
      agents: 'Agents',
      promptFrameworks: 'Prompt Frameworks',
      promptTemplates: 'Prompt Templates',
      skills: 'Skills',
      roles: 'Roles',
      promptBlocks: 'Prompt Blocks',
      importExport: 'Export / Import',
      settings: 'Settings',
    };

    return titles[this.activeSection()];
  });

  async init(): Promise<void> {
    this.loading.set(true);
    try {
      await this.seed.seedIfEmpty();
      await this.refresh();
    } catch (err) {
      this.handleError(err, 'init');
    } finally {
      this.loading.set(false);
    }
  }

  async refresh(): Promise<void> {
    if (this.isRefreshing) {
      return;
    }
    this.isRefreshing = true;

    try {
      const [[workspace], , , , , , ,] = await Promise.all([
        this.workspaceRepo.getAll(),
        this.roleStore.load(),
        this.frameworkStore.load(),
        this.templateStore.load(),
        this.agentStore.load(),
        this.skillStore.load(),
        this.blockStore.load(),
        this.settingsStore.load(),
      ]);

      this.workspace.set(workspace);
    } catch (err) {
      this.handleError(err, 'refresh');
      throw err;
    } finally {
      this.isRefreshing = false;
    }
  }

  async saveRole(role: Role): Promise<void> {
    try {
      await this.roleStore.save(role);
      this.notify('Role saved.');
    } catch (err) {
      this.handleError(err, 'save role');
    }
  }

  async saveFramework(framework: PromptFramework): Promise<void> {
    try {
      await this.frameworkStore.save(framework);
      this.notify('Framework saved.');
    } catch (err) {
      this.handleError(err, 'save framework');
    }
  }

  async saveTemplate(template: PromptTemplate): Promise<void> {
    try {
      await this.templateStore.save(template);
      this.notify('Prompt template saved.');
    } catch (err) {
      this.handleError(err, 'save template');
    }
  }

  async saveAgent(agent: Agent): Promise<void> {
    try {
      await this.agentStore.save(agent);
      this.notify('Agent saved.');
    } catch (err) {
      this.handleError(err, 'save agent');
    }
  }

  async saveSkill(skill: Skill): Promise<void> {
    try {
      await this.skillStore.save(skill);
      this.notify('Skill saved.');
    } catch (err) {
      this.handleError(err, 'save skill');
    }
  }

  async saveBlock(block: PromptBlock): Promise<void> {
    try {
      await this.blockStore.save(block);
      this.notify('Prompt block saved.');
    } catch (err) {
      this.handleError(err, 'save block');
    }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await this.settingsStore.save(settings);
      this.notify('Settings saved.');
    } catch (err) {
      this.handleError(err, 'save settings');
    }
  }

  async duplicate(type: EntityType, id: string): Promise<void> {
    try {
      await this.storeFor(type).duplicate(id);
      this.notify('Duplicated.');
    } catch (err) {
      this.handleError(err, 'duplicate');
    }
  }

  async delete(type: EntityType, id: string): Promise<void> {
    try {
      await this.storeFor(type).delete(id);
      this.notify('Deleted.');
    } catch (err) {
      this.handleError(err, 'delete');
    }
  }

  filterByQuery<T extends { name: string; description?: string; tags?: string[] }>(items: T[]): T[] {
    const query = this.search().trim().toLowerCase();
    const tags = this.tagFilter()
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);

    return items.filter((item) => {
      const matchesQuery =
        !query ||
        item.name.toLowerCase().includes(query) ||
        (item.description ?? '').toLowerCase().includes(query);
      const itemTags = (item.tags ?? []).map((tag) => tag.toLowerCase());
      const matchesTags = !tags.length || tags.every((tag) => itemTags.includes(tag));
      return matchesQuery && matchesTags;
    });
  }

  notify(message: string): void {
    this.toast.set(message);
    window.setTimeout(() => {
      if (this.toast() === message) {
        this.toast.set('');
      }
    }, 2400);
  }

  private storeFor(type: EntityType) {
    const stores = {
      agents: this.agentStore,
      promptFrameworks: this.frameworkStore,
      promptTemplates: this.templateStore,
      skills: this.skillStore,
      roles: this.roleStore,
      promptBlocks: this.blockStore,
      settings: this.settingsStore,
    };

    return stores[type];
  }

  private handleError(err: unknown, context: string): void {
    const message = err instanceof Error ? err.message : String(err);
    this.loading.set(false);
    this.notify(`Error: ${context} — ${message}`);
    console.error(`WorkspaceStore error (${context}):`, err);
  }
}
