import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';
import { stringify } from 'yaml';

import {
  Agent,
  EntityType,
  PromptFramework,
  PromptFrameworkSection,
  PromptTemplate,
  Role,
  Skill,
} from '../../core/models/entities';
import { ClipboardService } from '../../core/services/clipboard.service';
import { MarkdownService } from '../../core/services/markdown.service';
import { WorkspaceStore } from '../../core/services/workspace-store.service';
import { createId, formatTags, parseTags, withTimestamps } from '../../core/utils/entity-utils';
import { ImportExportPageComponent } from '../import-export/import-export-page.component';
import { PromptBlocksPageComponent } from '../prompt-blocks/prompt-blocks-page.component';
import { SettingsPageComponent } from '../settings/settings-page.component';
import { VOLT_UI } from '../../shared/ui/volt-ui';
import { DashboardHeaderComponent } from './dashboard-header.component';
import { DashboardNavItem, DashboardSectionId } from './dashboard-nav.types';
import { DashboardSidebarComponent } from './dashboard-sidebar.component';

type SectionId = DashboardSectionId;
type OutputMode = 'markdown' | 'json' | 'yaml' | 'raw';

@Component({
  selector: 'app-prompt-hub-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DashboardHeaderComponent,
    DashboardSidebarComponent,
    ImportExportPageComponent,
    PromptBlocksPageComponent,
    SettingsPageComponent,
    ...VOLT_UI,
    ...MOVEMENT_DIRECTIVES,
  ],
  template: `
    <main class="min-h-screen bg-background text-foreground">
      <div class="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <app-dashboard-sidebar
          [items]="navItems"
          [activeId]="store.activeSection()"
          (sectionSelected)="selectSection($event)"
        />

        <section class="min-w-0 p-4 md:p-6">
          <app-dashboard-header
            [workspaceName]="store.workspace()?.name || ''"
            [title]="store.activeTitle()"
            [showFilters]="!isUtilitySection()"
            [search]="store.search()"
            [tagFilter]="store.tagFilter()"
            (searchChange)="store.search.set($event)"
            (tagFilterChange)="store.tagFilter.set($event)"
          />

          @if (store.loading()) {
            <volt-card>Loading local workspace...</volt-card>
          } @else {
            <section [move]="'fade-up'">
              @switch (store.activeSection()) {
                @case ('agents') {
                  <ng-container *ngTemplateOutlet="agentsView" />
                }
                @case ('promptFrameworks') {
                  <ng-container *ngTemplateOutlet="frameworksView" />
                }
                @case ('promptTemplates') {
                  <ng-container *ngTemplateOutlet="templatesView" />
                }
                @case ('skills') {
                  <ng-container *ngTemplateOutlet="skillsView" />
                }
                @case ('roles') {
                  <ng-container *ngTemplateOutlet="rolesView" />
                }
                @case ('promptBlocks') {
                  <app-prompt-blocks-page />
                }
                @case ('importExport') {
                  <app-import-export-page />
                }
                @case ('settings') {
                  <app-settings-page />
                }
              }
            </section>
          }
        </section>
      </div>

      @if (store.toast()) {
        <div class="fixed bottom-4 right-4 rounded-md border border-cyan-500/40 bg-slate-900 px-4 py-3 text-sm text-cyan-100 shadow-xl" [move]="'fade-up'">
          {{ store.toast() }}
        </div>
      }
    </main>

    <ng-template #agentsView>
      <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div class="grid gap-3" [moveStagger]="45">
          <div class="flex justify-end"><volt-button variant="solid" (click)="editAgent(newAgent())">New Agent</volt-button></div>
          @for (agent of filteredAgents(); track agent.id) {
            <volt-card [move]="'fade-up'">
              <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 class="text-lg font-semibold">{{ agent.name }}</h3>
                  <p class="mt-1 text-sm text-slate-400">{{ agent.description }}</p>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <volt-badge>Role: {{ roleName(agent.roleId) }}</volt-badge>
                    <volt-badge>{{ agent.skillIds.length }} skills</volt-badge>
                    <volt-badge>{{ agent.promptTemplateIds.length }} prompts</volt-badge>
                    @for (tag of agent.tags; track tag) { <volt-badge>{{ tag }}</volt-badge> }
                  </div>
                </div>
                <div class="flex flex-wrap gap-2">
                  <volt-button (click)="editAgent(agent)">Edit</volt-button>
                  <volt-button (click)="duplicate('agents', agent.id)">Duplicate</volt-button>
                  <volt-button (click)="copyAgent(agent)">Copy Markdown</volt-button>
                  <volt-button (click)="copyElement(agent, 'markdown')">Export</volt-button>
                  <volt-button variant="destructive" (click)="remove('agents', agent.id)">Delete</volt-button>
                </div>
              </div>
            </volt-card>
          }
        </div>
        <ng-container *ngTemplateOutlet="agentEditor" />
      </div>
    </ng-template>

    <ng-template #agentEditor>
      <volt-card>
        <h3 class="mb-3 text-lg font-semibold">Agent Editor</h3>
        @if (editingAgent(); as agent) {
          <form class="grid gap-3" (ngSubmit)="saveAgent(agent)">
            <volt-form-field><volt-label>Name</volt-label><volt-input name="agentName" [(value)]="agent.name" /></volt-form-field>
            <volt-form-field><volt-label>Description</volt-label><volt-textarea [rows]="4" [(value)]="agent.description" /></volt-form-field>
            <volt-form-field><volt-label>Role</volt-label>
              <select class="form-control" name="agentRole" [(ngModel)]="agent.roleId">
                <option value="">No role</option>
                @for (role of store.roles(); track role.id) { <option [value]="role.id">{{ role.name }}</option> }
              </select>
            </volt-form-field>
            <volt-form-field><volt-label>Skills</volt-label>
              <select class="form-control min-h-28" multiple name="agentSkills" [(ngModel)]="agent.skillIds">
                @for (skill of store.skills(); track skill.id) { <option [value]="skill.id">{{ skill.name }}</option> }
              </select>
            </volt-form-field>
            <volt-form-field><volt-label>Prompt Templates</volt-label>
              <select class="form-control min-h-28" multiple name="agentTemplates" [(ngModel)]="agent.promptTemplateIds">
                @for (template of store.promptTemplates(); track template.id) { <option [value]="template.id">{{ template.name }}</option> }
              </select>
            </volt-form-field>
            <volt-form-field><volt-label>Default Constraints</volt-label><volt-textarea [rows]="4" [(value)]="agent.defaultConstraints" /></volt-form-field>
            <volt-form-field><volt-label>Output Format</volt-label><volt-textarea [rows]="4" [(value)]="agent.defaultOutputFormat" /></volt-form-field>
            <volt-form-field><volt-label>Tags</volt-label><input class="form-control" name="agentTags" [ngModel]="formatTags(agent.tags)" (ngModelChange)="agent.tags = parseTags($event)" /></volt-form-field>
            <div class="flex flex-wrap gap-2">
              <volt-button variant="solid" type="submit">Save</volt-button>
              <volt-button (click)="copyAgent(agent)">Copy Markdown</volt-button>
            </div>
            <pre class="max-h-96 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-300">{{ agentMarkdown(agent) }}</pre>
          </form>
        }
      </volt-card>
    </ng-template>

    <ng-template #frameworksView>
      <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_460px]">
        <div class="grid gap-3">
          <div class="flex justify-end"><volt-button variant="solid" (click)="editFramework(newFramework())">New Framework</volt-button></div>
          @for (framework of filteredFrameworks(); track framework.id) {
            <volt-card [move]="'fade-up'">
              <div class="flex flex-col gap-3 md:flex-row md:justify-between">
                <div>
                  <h3 class="text-lg font-semibold">{{ framework.name }}</h3>
                  <p class="text-sm text-slate-400">{{ framework.description }}</p>
                  <div class="mt-3 flex flex-wrap gap-2">
                    @for (section of sortedSections(framework); track section.id) { <volt-badge>{{ section.order }}. {{ section.label }}</volt-badge> }
                  </div>
                </div>
                <div class="flex flex-wrap gap-2">
                  <volt-button (click)="editFramework(framework)">Edit</volt-button>
                  <volt-button (click)="duplicate('promptFrameworks', framework.id)">Duplicate</volt-button>
                  <volt-button variant="destructive" (click)="remove('promptFrameworks', framework.id)">Delete</volt-button>
                </div>
              </div>
            </volt-card>
          }
        </div>
        <volt-card>
          <h3 class="mb-3 text-lg font-semibold">Framework Editor</h3>
          @if (editingFramework(); as framework) {
            <form class="grid gap-3" (ngSubmit)="saveFramework(framework)">
              <volt-form-field><volt-label>Name</volt-label><volt-input name="frameworkName" [(value)]="framework.name" /></volt-form-field>
              <volt-form-field><volt-label>Description</volt-label><volt-textarea [rows]="4" [(value)]="framework.description" /></volt-form-field>
              <volt-form-field><volt-label>Tags</volt-label><input class="form-control" name="frameworkTags" [ngModel]="formatTags(framework.tags)" (ngModelChange)="framework.tags = parseTags($event)" /></volt-form-field>
              <div class="grid gap-2">
                <div class="flex items-center justify-between">
                  <h4 class="font-medium text-slate-300">Sections</h4>
                  <volt-button (click)="addSection(framework)">Add Section</volt-button>
                </div>
                @for (section of sortedSections(framework); track section.id) {
                  <div class="grid gap-2 rounded-md border border-slate-800 bg-slate-900/50 p-3">
                    <div class="grid gap-2 sm:grid-cols-[1fr_1fr_80px]">
                      <input class="form-control" placeholder="key" name="key-{{ section.id }}" [(ngModel)]="section.key" />
                      <input class="form-control" placeholder="label" name="label-{{ section.id }}" [(ngModel)]="section.label" />
                      <input class="form-control" type="number" name="order-{{ section.id }}" [(ngModel)]="section.order" />
                    </div>
                    <textarea class="form-control min-h-16" placeholder="Description" name="desc-{{ section.id }}" [(ngModel)]="section.description"></textarea>
                    <input class="form-control" placeholder="Placeholder" name="placeholder-{{ section.id }}" [(ngModel)]="section.placeholder" />
                    <div class="flex items-center justify-between">
                      <label class="flex items-center gap-2 text-sm text-slate-300">
                        <input type="checkbox" name="required-{{ section.id }}" [(ngModel)]="section.required" />
                        Required
                      </label>
                      <volt-button variant="destructive" (click)="removeSection(framework, section.id)">Remove</volt-button>
                    </div>
                  </div>
                }
              </div>
              <volt-button variant="solid" type="submit">Save Framework</volt-button>
            </form>
          }
        </volt-card>
      </div>
    </ng-template>

    <ng-template #templatesView>
      <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_480px]">
        <div class="grid gap-3">
          <div class="flex justify-end"><volt-button variant="solid" (click)="editTemplate(newTemplate())">New Prompt Template</volt-button></div>
          @for (template of filteredTemplates(); track template.id) {
            <volt-card [move]="'fade-up'">
              <div class="flex flex-col gap-3 md:flex-row md:justify-between">
                <div>
                  <h3 class="text-lg font-semibold">{{ template.name }}</h3>
                  <p class="text-sm text-slate-400">{{ template.description }}</p>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <volt-badge>{{ frameworkName(template.frameworkId) }}</volt-badge>
                    @for (tag of template.tags; track tag) { <volt-badge>{{ tag }}</volt-badge> }
                  </div>
                </div>
                <div class="flex flex-wrap gap-2">
                  <volt-button (click)="editTemplate(template)">Edit</volt-button>
                  <volt-button (click)="duplicate('promptTemplates', template.id)">Duplicate</volt-button>
                  <volt-button (click)="copyTemplate(template, outputMode())">Copy</volt-button>
                  <volt-button variant="destructive" (click)="remove('promptTemplates', template.id)">Delete</volt-button>
                </div>
              </div>
            </volt-card>
          }
        </div>
        <volt-card>
          <h3 class="mb-3 text-lg font-semibold">Prompt Template Editor</h3>
          @if (editingTemplate(); as template) {
            <form class="grid gap-3" (ngSubmit)="saveTemplate(template)">
              <volt-form-field><volt-label>Name</volt-label><volt-input name="templateName" [(value)]="template.name" /></volt-form-field>
              <volt-form-field><volt-label>Description</volt-label><volt-textarea [rows]="4" [(value)]="template.description" /></volt-form-field>
              <volt-form-field><volt-label>Framework</volt-label>
                <select class="form-control" name="templateFramework" [(ngModel)]="template.frameworkId" (ngModelChange)="syncTemplateValues(template)">
                  @for (framework of store.promptFrameworks(); track framework.id) { <option [value]="framework.id">{{ framework.name }}</option> }
                </select>
              </volt-form-field>
              <volt-form-field><volt-label>Role</volt-label>
                <select class="form-control" name="templateRole" [(ngModel)]="template.roleId">
                  <option value="">No role</option>
                  @for (role of store.roles(); track role.id) { <option [value]="role.id">{{ role.name }}</option> }
                </select>
              </volt-form-field>
              @for (section of sectionsForTemplate(template); track section.id) {
                <volt-form-field><volt-label>{{ section.label }}</volt-label>
                  <textarea class="form-control min-h-24" name="value-{{ section.key }}" [placeholder]="section.placeholder" [(ngModel)]="template.values[section.key]"></textarea>
                </volt-form-field>
              }
              <volt-form-field><volt-label>Tags</volt-label><input class="form-control" name="templateTags" [ngModel]="formatTags(template.tags)" (ngModelChange)="template.tags = parseTags($event)" /></volt-form-field>
              <div class="flex flex-wrap gap-2">
                <select class="form-control w-auto" name="outputMode" [(ngModel)]="outputModeValue">
                  <option value="markdown">Markdown</option>
                  <option value="yaml">YAML</option>
                  <option value="json">JSON</option>
                  <option value="raw">Raw prompt</option>
                </select>
                <volt-button variant="solid" type="submit">Save</volt-button>
                <volt-button (click)="copyTemplate(template, outputMode())">Copy Output</volt-button>
              </div>
              <pre class="max-h-96 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-300">{{ templateOutput(template, outputMode()) }}</pre>
            </form>
          }
        </volt-card>
      </div>
    </ng-template>

    <ng-template #skillsView>
      <ng-container *ngTemplateOutlet="simpleRichView; context: { kind: 'skills' }" />
    </ng-template>

    <ng-template #rolesView>
      <ng-container *ngTemplateOutlet="simpleRichView; context: { kind: 'roles' }" />
    </ng-template>

    <ng-template #simpleRichView let-kind="kind">
      <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div class="grid gap-3">
          <div class="flex justify-end">
            <volt-button variant="solid" (click)="kind === 'skills' ? editSkill(newSkill()) : editRole(newRole())">New {{ kind === 'skills' ? 'Skill' : 'Role' }}</volt-button>
          </div>
          @for (item of kind === 'skills' ? filteredSkills() : filteredRoles(); track item.id) {
            <volt-card [move]="'fade-up'">
              <div class="flex flex-col gap-3 md:flex-row md:justify-between">
                <div>
                  <h3 class="text-lg font-semibold">{{ item.name }}</h3>
                  <p class="text-sm text-slate-400">{{ item.description }}</p>
                  <div class="mt-3 flex flex-wrap gap-2">@for (tag of item.tags; track tag) { <volt-badge>{{ tag }}</volt-badge> }</div>
                </div>
                <div class="flex flex-wrap gap-2">
                  <volt-button (click)="kind === 'skills' ? editSkill(asSkill(item)) : editRole(asRole(item))">Edit</volt-button>
                  <volt-button (click)="duplicate(kind, item.id)">Duplicate</volt-button>
                  <volt-button (click)="copyElement(item, 'markdown')">Copy Markdown</volt-button>
                  <volt-button variant="destructive" (click)="remove(kind, item.id)">Delete</volt-button>
                </div>
              </div>
            </volt-card>
          }
        </div>
        <volt-card>
          @if (kind === 'skills' && editingSkill(); as skill) {
            <form class="grid gap-3" (ngSubmit)="saveSkill(skill)">
              <h3 class="text-lg font-semibold">Skill Editor</h3>
              <volt-form-field><volt-label>Name</volt-label><volt-input name="skillName" [(value)]="skill.name" /></volt-form-field>
              <volt-form-field><volt-label>Description</volt-label><volt-textarea [rows]="4" [(value)]="skill.description" /></volt-form-field>
              <volt-form-field><volt-label>Instructions</volt-label><volt-textarea [rows]="4" [(value)]="skill.instructions" /></volt-form-field>
              <volt-form-field><volt-label>Input Format</volt-label><volt-textarea [rows]="4" [(value)]="skill.inputFormat" /></volt-form-field>
              <volt-form-field><volt-label>Output Format</volt-label><volt-textarea [rows]="4" [(value)]="skill.outputFormat" /></volt-form-field>
              <volt-form-field><volt-label>Constraints</volt-label><volt-textarea [rows]="4" [(value)]="skill.constraints" /></volt-form-field>
              <volt-form-field><volt-label>Tags</volt-label><input class="form-control" name="skillTags" [ngModel]="formatTags(skill.tags)" (ngModelChange)="skill.tags = parseTags($event)" /></volt-form-field>
              <volt-button variant="solid" type="submit">Save Skill</volt-button>
              <pre class="max-h-80 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-300">{{ markdown.skill(skill) }}</pre>
            </form>
          } @else if (kind === 'roles' && editingRole(); as role) {
            <form class="grid gap-3" (ngSubmit)="saveRole(role)">
              <h3 class="text-lg font-semibold">Role Editor</h3>
              <volt-form-field><volt-label>Name</volt-label><volt-input name="roleName" [(value)]="role.name" /></volt-form-field>
              <volt-form-field><volt-label>Description</volt-label><volt-textarea [rows]="4" [(value)]="role.description" /></volt-form-field>
              <volt-form-field><volt-label>Content</volt-label><volt-textarea [rows]="4" [(value)]="role.content" /></volt-form-field>
              <volt-form-field><volt-label>Tags</volt-label><input class="form-control" name="roleTags" [ngModel]="formatTags(role.tags)" (ngModelChange)="role.tags = parseTags($event)" /></volt-form-field>
              <volt-button variant="solid" type="submit">Save Role</volt-button>
              <pre class="max-h-80 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-300">{{ markdown.role(role) }}</pre>
            </form>
          }
        </volt-card>
      </div>
    </ng-template>

  `,
})
export class PromptHubDashboardComponent implements OnInit {
  readonly store = inject(WorkspaceStore);
  readonly markdown = inject(MarkdownService);
  private readonly clipboard = inject(ClipboardService);

  readonly navItems: DashboardNavItem[] = [
    { id: 'agents', label: 'Agents' },
    { id: 'promptFrameworks', label: 'Prompt Frameworks' },
    { id: 'promptTemplates', label: 'Prompt Templates' },
    { id: 'skills', label: 'Skills' },
    { id: 'roles', label: 'Roles' },
    { id: 'promptBlocks', label: 'Prompt Blocks' },
    { id: 'importExport', label: 'Export / Import' },
    { id: 'settings', label: 'Settings' },
  ];
  readonly editingAgent = signal<Agent | undefined>(undefined);
  readonly editingFramework = signal<PromptFramework | undefined>(undefined);
  readonly editingTemplate = signal<PromptTemplate | undefined>(undefined);
  readonly editingSkill = signal<Skill | undefined>(undefined);
  readonly editingRole = signal<Role | undefined>(undefined);
  readonly outputMode = computed(() => this.outputModeValue as OutputMode);

  outputModeValue: OutputMode = 'markdown';
  readonly filteredAgents = computed(() => this.store.filterByQuery(this.store.agents()));
  readonly filteredFrameworks = computed(() => this.store.filterByQuery(this.store.promptFrameworks()));
  readonly filteredTemplates = computed(() => this.store.filterByQuery(this.store.promptTemplates()));
  readonly filteredSkills = computed(() => this.store.filterByQuery(this.store.skills()));
  readonly filteredRoles = computed(() => this.store.filterByQuery(this.store.roles()));

  async ngOnInit(): Promise<void> {
    await this.store.init();
    this.editingAgent.set(this.store.agents()[0] ? structuredClone(this.store.agents()[0]) : this.newAgent());
    this.editingFramework.set(this.store.promptFrameworks()[0] ? structuredClone(this.store.promptFrameworks()[0]) : this.newFramework());
    this.editingTemplate.set(this.store.promptTemplates()[0] ? structuredClone(this.store.promptTemplates()[0]) : this.newTemplate());
    this.editingSkill.set(this.store.skills()[0] ? structuredClone(this.store.skills()[0]) : this.newSkill());
    this.editingRole.set(this.store.roles()[0] ? structuredClone(this.store.roles()[0]) : this.newRole());
  }

  selectSection(id: SectionId): void {
    this.store.activeSection.set(id);
  }

  isUtilitySection(): boolean {
    return ['importExport', 'settings'].includes(this.store.activeSection());
  }

  editAgent(agent: Agent): void {
    this.editingAgent.set(structuredClone(agent));
  }

  editFramework(framework: PromptFramework): void {
    this.editingFramework.set(structuredClone(framework));
  }

  editTemplate(template: PromptTemplate): void {
    this.editingTemplate.set(structuredClone(template));
    this.syncTemplateValues(template);
  }

  editSkill(skill: Skill): void {
    this.editingSkill.set(structuredClone(skill));
  }

  editRole(role: Role): void {
    this.editingRole.set(structuredClone(role));
  }

  async saveAgent(agent: Agent): Promise<void> {
    await this.store.saveAgent(agent);
    this.editingAgent.set(structuredClone(agent));
  }

  async saveFramework(framework: PromptFramework): Promise<void> {
    framework.sections = this.sortedSections(framework);
    await this.store.saveFramework(framework);
    this.editingFramework.set(structuredClone(framework));
  }

  async saveTemplate(template: PromptTemplate): Promise<void> {
    this.syncTemplateValues(template);
    await this.store.saveTemplate(template);
    this.editingTemplate.set(structuredClone(template));
  }

  async saveSkill(skill: Skill): Promise<void> {
    await this.store.saveSkill(skill);
    this.editingSkill.set(structuredClone(skill));
  }

  async saveRole(role: Role): Promise<void> {
    await this.store.saveRole(role);
    this.editingRole.set(structuredClone(role));
  }

  async duplicate(type: EntityType, id: string): Promise<void> {
    await this.store.duplicate(type, id);
  }

  async remove(type: EntityType, id: string): Promise<void> {
    if (!window.confirm('Delete this item from local IndexedDB?')) {
      return;
    }

    await this.store.delete(type, id);
  }

  newAgent(): Agent {
    return withTimestamps({
      name: 'New Agent',
      description: '',
      roleId: this.store.roles()[0]?.id ?? '',
      promptTemplateIds: [],
      skillIds: [],
      defaultOutputFormat: 'Markdown with clear sections.',
      defaultConstraints: '',
      tags: [],
    });
  }

  newFramework(): PromptFramework {
    return withTimestamps({
      name: 'New Framework',
      description: '',
      sections: [this.makeSection(1)],
      tags: [],
    });
  }

  newTemplate(): PromptTemplate {
    const framework = this.store.promptFrameworks()[0];
    const template = withTimestamps({
      name: 'New Prompt Template',
      description: '',
      frameworkId: framework?.id ?? '',
      roleId: '',
      values: {},
      tags: [],
    });
    this.syncTemplateValues(template);
    return template;
  }

  newSkill(): Skill {
    return withTimestamps({
      name: 'New Skill',
      description: '',
      instructions: '',
      inputFormat: '',
      outputFormat: '',
      constraints: '',
      tags: [],
    });
  }

  newRole(): Role {
    return withTimestamps({
      name: 'New Role',
      description: '',
      content: '',
      tags: [],
    });
  }

  addSection(framework: PromptFramework): void {
    framework.sections = [...framework.sections, this.makeSection(framework.sections.length + 1)];
  }

  removeSection(framework: PromptFramework, sectionId: string): void {
    framework.sections = framework.sections.filter((section) => section.id !== sectionId);
  }

  sortedSections(framework: PromptFramework): PromptFrameworkSection[] {
    return [...framework.sections].sort((a, b) => a.order - b.order);
  }

  sectionsForTemplate(template: PromptTemplate): PromptFrameworkSection[] {
    const framework = this.store.promptFrameworks().find((item) => item.id === template.frameworkId);
    return framework ? this.sortedSections(framework) : [];
  }

  syncTemplateValues(template: PromptTemplate): void {
    for (const section of this.sectionsForTemplate(template)) {
      template.values[section.key] ??= '';
    }
  }

  agentMarkdown(agent: Agent): string {
    return this.markdown.agent(
      agent,
      this.store.roles().find((role) => role.id === agent.roleId),
      this.store.skills().filter((skill) => agent.skillIds.includes(skill.id)),
      this.store
        .promptTemplates()
        .filter((template) => agent.promptTemplateIds.includes(template.id))
        .map((template) => ({
          template,
          framework: this.store.promptFrameworks().find((framework) => framework.id === template.frameworkId),
        }))
    );
  }

  templateOutput(template: PromptTemplate, mode: OutputMode): string {
    const framework = this.store.promptFrameworks().find((item) => item.id === template.frameworkId);
    const role = this.store.roles().find((item) => item.id === template.roleId);

    if (mode === 'raw') {
      return this.markdown.rawPrompt(template, framework);
    }

    if (mode === 'json') {
      return JSON.stringify(template, null, 2);
    }

    if (mode === 'yaml') {
      return stringify(template);
    }

    return this.markdown.promptTemplate(template, framework, role);
  }

  async copyAgent(agent: Agent): Promise<void> {
    await this.copyText(this.agentMarkdown(agent));
  }

  async copyTemplate(template: PromptTemplate, mode: OutputMode): Promise<void> {
    await this.copyText(this.templateOutput(template, mode));
  }

  async copyElement(item: Agent | Skill | Role | PromptTemplate, mode: 'markdown' | 'json' | 'yaml'): Promise<void> {
    if (mode === 'json') {
      await this.copyText(JSON.stringify(item, null, 2));
      return;
    }

    if (mode === 'yaml') {
      await this.copyText(stringify(item));
      return;
    }

    if ('skillIds' in item) {
      await this.copyAgent(item);
      return;
    }

    if ('instructions' in item) {
      await this.copyText(this.markdown.skill(item));
      return;
    }

    if ('content' in item) {
      await this.copyText(this.markdown.role(item));
      return;
    }

    await this.copyTemplate(item, 'markdown');
  }

  async copyText(value: string): Promise<void> {
    await this.clipboard.copy(value);
    this.store.notify('Copied to clipboard.');
  }

  roleName(id: string): string {
    return this.store.roles().find((role) => role.id === id)?.name ?? 'None';
  }

  frameworkName(id: string): string {
    return this.store.promptFrameworks().find((framework) => framework.id === id)?.name ?? 'No framework';
  }

  asSkill(item: Skill | Role): Skill {
    return item as Skill;
  }

  asRole(item: Skill | Role): Role {
    return item as Role;
  }

  formatTags(tags: string[]): string {
    return formatTags(tags);
  }

  parseTags(value: string): string[] {
    return parseTags(value);
  }

  private makeSection(order: number): PromptFrameworkSection {
    return {
      id: createId(),
      key: `section${order}`,
      label: `Section ${order}`,
      description: '',
      required: false,
      placeholder: '',
      order,
    };
  }
}
