import { Injectable } from '@angular/core';

import { appDatabase } from '../db/app-database';
import {
  Agent,
  AppSettings,
  PromptBlock,
  PromptFramework,
  PromptTemplate,
  Role,
  Skill,
  Workspace,
} from '../models/entities';
import { DexieRepository } from './local-repository';

@Injectable({ providedIn: 'root' })
export class WorkspaceRepository extends DexieRepository<Workspace> {
  constructor() {
    super(appDatabase.workspaces);
  }
}

@Injectable({ providedIn: 'root' })
export class RoleRepository extends DexieRepository<Role> {
  constructor() {
    super(appDatabase.roles);
  }
}

@Injectable({ providedIn: 'root' })
export class PromptFrameworkRepository extends DexieRepository<PromptFramework> {
  constructor() {
    super(appDatabase.promptFrameworks);
  }
}

@Injectable({ providedIn: 'root' })
export class PromptTemplateRepository extends DexieRepository<PromptTemplate> {
  constructor() {
    super(appDatabase.promptTemplates);
  }
}

@Injectable({ providedIn: 'root' })
export class AgentRepository extends DexieRepository<Agent> {
  constructor() {
    super(appDatabase.agents);
  }
}

@Injectable({ providedIn: 'root' })
export class SkillRepository extends DexieRepository<Skill> {
  constructor() {
    super(appDatabase.skills);
  }
}

@Injectable({ providedIn: 'root' })
export class PromptBlockRepository extends DexieRepository<PromptBlock> {
  constructor() {
    super(appDatabase.promptBlocks);
  }
}

@Injectable({ providedIn: 'root' })
export class SettingsRepository extends DexieRepository<AppSettings> {
  constructor() {
    super(appDatabase.settings);
  }
}
