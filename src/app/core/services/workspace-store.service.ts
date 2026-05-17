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
  AgentRepository,
  PromptBlockRepository,
  PromptFrameworkRepository,
  PromptTemplateRepository,
  RoleRepository,
  SettingsRepository,
  SkillRepository,
  WorkspaceRepository,
} from '../repositories/entity-repositories';
import { SeedService } from './seed.service';

@Injectable({ providedIn: 'root' })
export class WorkspaceStore {
  private readonly seed = inject(SeedService);
  private readonly workspaceRepo = inject(WorkspaceRepository);
  private readonly roleRepo = inject(RoleRepository);
  private readonly frameworkRepo = inject(PromptFrameworkRepository);
  private readonly templateRepo = inject(PromptTemplateRepository);
  private readonly agentRepo = inject(AgentRepository);
  private readonly skillRepo = inject(SkillRepository);
  private readonly blockRepo = inject(PromptBlockRepository);
  private readonly settingsRepo = inject(SettingsRepository);

  readonly workspace = signal<Workspace | undefined>(undefined);
  readonly roles = signal<Role[]>([]);
  readonly promptFrameworks = signal<PromptFramework[]>([]);
  readonly promptTemplates = signal<PromptTemplate[]>([]);
  readonly agents = signal<Agent[]>([]);
  readonly skills = signal<Skill[]>([]);
  readonly promptBlocks = signal<PromptBlock[]>([]);
  readonly settings = signal<AppSettings | undefined>(undefined);
  readonly loading = signal(true);
  readonly activeSection = signal<EntityType | 'importExport'>('agents');
  readonly search = signal('');
  readonly tagFilter = signal('');
  readonly toast = signal('');

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
    await this.seed.seedIfEmpty();
    await this.refresh();
    this.loading.set(false);
  }

  async refresh(): Promise<void> {
    const [workspace] = await this.workspaceRepo.getAll();
    const [settings] = await this.settingsRepo.getAll();

    this.workspace.set(workspace);
    this.settings.set(settings);
    this.roles.set(await this.roleRepo.getAll());
    this.promptFrameworks.set(await this.frameworkRepo.getAll());
    this.promptTemplates.set(await this.templateRepo.getAll());
    this.agents.set(await this.agentRepo.getAll());
    this.skills.set(await this.skillRepo.getAll());
    this.promptBlocks.set(await this.blockRepo.getAll());
  }

  async saveRole(role: Role): Promise<void> {
    await this.roleRepo.update(role);
    await this.refreshWithToast('Role saved.');
  }

  async saveFramework(framework: PromptFramework): Promise<void> {
    await this.frameworkRepo.update(framework);
    await this.refreshWithToast('Framework saved.');
  }

  async saveTemplate(template: PromptTemplate): Promise<void> {
    await this.templateRepo.update(template);
    await this.refreshWithToast('Prompt template saved.');
  }

  async saveAgent(agent: Agent): Promise<void> {
    await this.agentRepo.update(agent);
    await this.refreshWithToast('Agent saved.');
  }

  async saveSkill(skill: Skill): Promise<void> {
    await this.skillRepo.update(skill);
    await this.refreshWithToast('Skill saved.');
  }

  async saveBlock(block: PromptBlock): Promise<void> {
    await this.blockRepo.update(block);
    await this.refreshWithToast('Prompt block saved.');
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    await this.settingsRepo.update(settings);
    await this.refreshWithToast('Settings saved.');
  }

  async duplicate(type: EntityType, id: string): Promise<void> {
    await this.repoFor(type).duplicate(id);
    await this.refreshWithToast('Duplicated.');
  }

  async delete(type: EntityType, id: string): Promise<void> {
    await this.repoFor(type).delete(id);
    await this.refreshWithToast('Deleted.');
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

  private async refreshWithToast(message: string): Promise<void> {
    await this.refresh();
    this.notify(message);
  }

  private repoFor(type: EntityType) {
    const repos = {
      agents: this.agentRepo,
      promptFrameworks: this.frameworkRepo,
      promptTemplates: this.templateRepo,
      skills: this.skillRepo,
      roles: this.roleRepo,
      promptBlocks: this.blockRepo,
      settings: this.settingsRepo,
    };

    return repos[type];
  }
}
