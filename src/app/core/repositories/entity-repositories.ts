import { Injectable } from '@angular/core';

import { AppDatabase } from '../db/app-database';
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
  constructor(db: AppDatabase) {
    super(db.workspaces);
  }
}

@Injectable({ providedIn: 'root' })
export class RoleRepository extends DexieRepository<Role> {
  constructor(db: AppDatabase) {
    super(db.roles);
  }
}

@Injectable({ providedIn: 'root' })
export class PromptFrameworkRepository extends DexieRepository<PromptFramework> {
  constructor(db: AppDatabase) {
    super(db.promptFrameworks);
  }
}

@Injectable({ providedIn: 'root' })
export class PromptTemplateRepository extends DexieRepository<PromptTemplate> {
  constructor(db: AppDatabase) {
    super(db.promptTemplates);
  }
}

@Injectable({ providedIn: 'root' })
export class AgentRepository extends DexieRepository<Agent> {
  constructor(db: AppDatabase) {
    super(db.agents);
  }
}

@Injectable({ providedIn: 'root' })
export class SkillRepository extends DexieRepository<Skill> {
  constructor(db: AppDatabase) {
    super(db.skills);
  }
}

@Injectable({ providedIn: 'root' })
export class PromptBlockRepository extends DexieRepository<PromptBlock> {
  constructor(db: AppDatabase) {
    super(db.promptBlocks);
  }
}

@Injectable({ providedIn: 'root' })
export class SettingsRepository extends DexieRepository<AppSettings> {
  constructor(db: AppDatabase) {
    super(db.settings);
  }
}
