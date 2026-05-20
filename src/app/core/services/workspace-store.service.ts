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
import { getAppSectionTitle } from '../models/navigation';
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
  readonly saving = signal(false);
  readonly activeSection = signal<EntityType | 'importExport'>('agents');
  readonly search = signal('');
  readonly tagFilter = signal('');
  readonly toast = signal('');

  private isRefreshing = false;
  private searchTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private tagFilterTimeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly activeTitle = computed(() => getAppSectionTitle(this.activeSection()));

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

  /**
   * Loads all workspace data in parallel.
   *
   * Note: We load the entire workspace at once rather than per-page because:
   * - IndexedDB is local and queries are very fast (< 50ms for typical datasets).
   * - Parallel loading via Promise.all minimizes total wait time.
   * - Keeps all entity signals in sync, preventing stale cross-references.
   *
   * If dataset size grows significantly (> 1000 entities), consider:
   * - Paginated loading per feature page.
   - Virtual scrolling in lists.
   */
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

  setSearch(value: string): void {
    if (this.searchTimeoutId) {
      clearTimeout(this.searchTimeoutId);
    }
    this.searchTimeoutId = setTimeout(() => this.search.set(value), 200);
  }

  setTagFilter(value: string): void {
    if (this.tagFilterTimeoutId) {
      clearTimeout(this.tagFilterTimeoutId);
    }
    this.tagFilterTimeoutId = setTimeout(() => this.tagFilter.set(value), 200);
  }

  async saveRole(role: Role): Promise<void> {
    this.saving.set(true);
    try {
      await this.roleStore.save(role);
      this.notify('Role saved.');
    } catch (err) {
      this.handleError(err, 'save role');
    } finally {
      this.saving.set(false);
    }
  }

  async saveFramework(framework: PromptFramework): Promise<void> {
    this.saving.set(true);
    try {
      await this.frameworkStore.save(framework);
      this.notify('Framework saved.');
    } catch (err) {
      this.handleError(err, 'save framework');
    } finally {
      this.saving.set(false);
    }
  }

  async saveTemplate(template: PromptTemplate): Promise<void> {
    this.saving.set(true);
    try {
      await this.templateStore.save(template);
      this.notify('Prompt template saved.');
    } catch (err) {
      this.handleError(err, 'save template');
    } finally {
      this.saving.set(false);
    }
  }

  async saveAgent(agent: Agent): Promise<void> {
    this.saving.set(true);
    try {
      await this.agentStore.save(agent);
      this.notify('Agent saved.');
    } catch (err) {
      this.handleError(err, 'save agent');
    } finally {
      this.saving.set(false);
    }
  }

  async saveSkill(skill: Skill): Promise<void> {
    this.saving.set(true);
    try {
      await this.skillStore.save(skill);
      this.notify('Skill saved.');
    } catch (err) {
      this.handleError(err, 'save skill');
    } finally {
      this.saving.set(false);
    }
  }

  async saveBlock(block: PromptBlock): Promise<void> {
    this.saving.set(true);
    try {
      await this.blockStore.save(block);
      this.notify('Prompt block saved.');
    } catch (err) {
      this.handleError(err, 'save block');
    } finally {
      this.saving.set(false);
    }
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    this.saving.set(true);
    try {
      await this.settingsStore.save(settings);
      this.notify('Settings saved.');
    } catch (err) {
      this.handleError(err, 'save settings');
    } finally {
      this.saving.set(false);
    }
  }

  async duplicate(type: EntityType, id: string): Promise<void> {
    this.saving.set(true);
    try {
      await this.storeFor(type).duplicate(id);
      this.notify('Duplicated.');
    } catch (err) {
      this.handleError(err, 'duplicate');
    } finally {
      this.saving.set(false);
    }
  }

  async delete(type: EntityType, id: string): Promise<void> {
    this.saving.set(true);
    try {
      await this.storeFor(type).delete(id);
      this.notify('Deleted.');
    } catch (err) {
      this.handleError(err, 'delete');
    } finally {
      this.saving.set(false);
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
