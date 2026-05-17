import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';
import { stringify } from 'yaml';

import {
  Agent,
  AppSettings,
  EntityType,
  PromptBlock,
  PromptBlockCategory,
  PromptFramework,
  PromptFrameworkSection,
  PromptTemplate,
  Role,
  Skill,
} from '../core/models/entities';
import { ClipboardService } from '../core/services/clipboard.service';
import { ExportImportService } from '../core/services/export-import.service';
import { MarkdownService } from '../core/services/markdown.service';
import { WorkspaceStore } from '../core/services/workspace-store.service';
import { createId, formatTags, nowIso, parseTags, withTimestamps } from '../core/utils/entity-utils';
import { VOLT_UI } from '../shared/ui/volt-ui';

type SectionId = EntityType | 'importExport';
type OutputMode = 'markdown' | 'json' | 'yaml' | 'raw';

interface NavItem {
  id: SectionId;
  label: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, ...VOLT_UI, ...MOVEMENT_DIRECTIVES],
  template: `
    <main class="min-h-screen bg-slate-950 text-slate-100">
      <div class="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside class="border-b border-slate-800 bg-slate-950/95 p-4 lg:border-b-0 lg:border-r">
          <div class="mb-6">
            <p class="text-xs uppercase tracking-wide text-cyan-300">Define once. Reuse anywhere.</p>
            <h1 class="mt-2 text-2xl font-semibold tracking-normal">Prompt Hub</h1>
            <p class="mt-2 text-sm text-slate-400">
              Local-first workspace for structured prompts and reusable agents.
            </p>
          </div>

          <nav class="grid gap-1">
            @for (item of navItems; track item.id) {
              <button
                type="button"
                class="rounded-md px-3 py-2 text-left text-sm transition hover:bg-slate-900"
                [class.bg-cyan-500]="store.activeSection() === item.id"
                [class.text-slate-950]="store.activeSection() === item.id"
                [class.text-slate-300]="store.activeSection() !== item.id"
                (click)="selectSection(item.id)"
              >
                {{ item.label }}
              </button>
            }
          </nav>

          <div class="mt-6 rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-xs text-slate-400">
            Your data is stored locally in this browser. Export your workspace regularly if you want to move it to another device.
          </div>
        </aside>

        <section class="min-w-0 p-4 md:p-6">
          <header class="mb-5 flex flex-col gap-3 border-b border-slate-800 pb-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p class="text-sm text-slate-400">{{ store.workspace()?.name || 'Loading workspace' }}</p>
              <h2 class="text-2xl font-semibold">{{ store.activeTitle() }}</h2>
            </div>

            @if (!isUtilitySection()) {
              <div class="grid gap-2 sm:grid-cols-2 md:min-w-[420px]">
                <input
                  class="form-control"
                  placeholder="Search by text"
                  [ngModel]="store.search()"
                  (ngModelChange)="store.search.set($event)"
                />
                <input
                  class="form-control"
                  placeholder="Filter tags: angular, review"
                  [ngModel]="store.tagFilter()"
                  (ngModelChange)="store.tagFilter.set($event)"
                />
              </div>
            }
          </header>

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
                  <ng-container *ngTemplateOutlet="blocksView" />
                }
                @case ('importExport') {
                  <ng-container *ngTemplateOutlet="importExportView" />
                }
                @case ('settings') {
                  <ng-container *ngTemplateOutlet="settingsView" />
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
          <div class="flex justify-end"><volt-button tone="primary" (clicked)="editAgent(newAgent())">New Agent</volt-button></div>
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
                  <volt-button (clicked)="editAgent(agent)">Edit</volt-button>
                  <volt-button (clicked)="duplicate('agents', agent.id)">Duplicate</volt-button>
                  <volt-button (clicked)="copyAgent(agent)">Copy Markdown</volt-button>
                  <volt-button (clicked)="copyElement(agent, 'markdown')">Export</volt-button>
                  <volt-button tone="danger" (clicked)="remove('agents', agent.id)">Delete</volt-button>
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
            <volt-field label="Name"><input class="form-control" name="agentName" [(ngModel)]="agent.name" /></volt-field>
            <volt-field label="Description"><textarea class="form-control min-h-20" name="agentDescription" [(ngModel)]="agent.description"></textarea></volt-field>
            <volt-field label="Role">
              <select class="form-control" name="agentRole" [(ngModel)]="agent.roleId">
                <option value="">No role</option>
                @for (role of store.roles(); track role.id) { <option [value]="role.id">{{ role.name }}</option> }
              </select>
            </volt-field>
            <volt-field label="Skills">
              <select class="form-control min-h-28" multiple name="agentSkills" [(ngModel)]="agent.skillIds">
                @for (skill of store.skills(); track skill.id) { <option [value]="skill.id">{{ skill.name }}</option> }
              </select>
            </volt-field>
            <volt-field label="Prompt Templates">
              <select class="form-control min-h-28" multiple name="agentTemplates" [(ngModel)]="agent.promptTemplateIds">
                @for (template of store.promptTemplates(); track template.id) { <option [value]="template.id">{{ template.name }}</option> }
              </select>
            </volt-field>
            <volt-field label="Default Constraints"><textarea class="form-control min-h-24" name="agentConstraints" [(ngModel)]="agent.defaultConstraints"></textarea></volt-field>
            <volt-field label="Output Format"><textarea class="form-control min-h-20" name="agentOutput" [(ngModel)]="agent.defaultOutputFormat"></textarea></volt-field>
            <volt-field label="Tags"><input class="form-control" name="agentTags" [ngModel]="formatTags(agent.tags)" (ngModelChange)="agent.tags = parseTags($event)" /></volt-field>
            <div class="flex flex-wrap gap-2">
              <volt-button tone="primary" type="submit">Save</volt-button>
              <volt-button (clicked)="copyAgent(agent)">Copy Markdown</volt-button>
            </div>
            <pre class="max-h-96 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-300">{{ agentMarkdown(agent) }}</pre>
          </form>
        }
      </volt-card>
    </ng-template>

    <ng-template #frameworksView>
      <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_460px]">
        <div class="grid gap-3">
          <div class="flex justify-end"><volt-button tone="primary" (clicked)="editFramework(newFramework())">New Framework</volt-button></div>
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
                  <volt-button (clicked)="editFramework(framework)">Edit</volt-button>
                  <volt-button (clicked)="duplicate('promptFrameworks', framework.id)">Duplicate</volt-button>
                  <volt-button tone="danger" (clicked)="remove('promptFrameworks', framework.id)">Delete</volt-button>
                </div>
              </div>
            </volt-card>
          }
        </div>
        <volt-card>
          <h3 class="mb-3 text-lg font-semibold">Framework Editor</h3>
          @if (editingFramework(); as framework) {
            <form class="grid gap-3" (ngSubmit)="saveFramework(framework)">
              <volt-field label="Name"><input class="form-control" name="frameworkName" [(ngModel)]="framework.name" /></volt-field>
              <volt-field label="Description"><textarea class="form-control min-h-20" name="frameworkDescription" [(ngModel)]="framework.description"></textarea></volt-field>
              <volt-field label="Tags"><input class="form-control" name="frameworkTags" [ngModel]="formatTags(framework.tags)" (ngModelChange)="framework.tags = parseTags($event)" /></volt-field>
              <div class="grid gap-2">
                <div class="flex items-center justify-between">
                  <h4 class="font-medium text-slate-300">Sections</h4>
                  <volt-button (clicked)="addSection(framework)">Add Section</volt-button>
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
                      <volt-button tone="danger" (clicked)="removeSection(framework, section.id)">Remove</volt-button>
                    </div>
                  </div>
                }
              </div>
              <volt-button tone="primary" type="submit">Save Framework</volt-button>
            </form>
          }
        </volt-card>
      </div>
    </ng-template>

    <ng-template #templatesView>
      <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_480px]">
        <div class="grid gap-3">
          <div class="flex justify-end"><volt-button tone="primary" (clicked)="editTemplate(newTemplate())">New Prompt Template</volt-button></div>
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
                  <volt-button (clicked)="editTemplate(template)">Edit</volt-button>
                  <volt-button (clicked)="duplicate('promptTemplates', template.id)">Duplicate</volt-button>
                  <volt-button (clicked)="copyTemplate(template, outputMode())">Copy</volt-button>
                  <volt-button tone="danger" (clicked)="remove('promptTemplates', template.id)">Delete</volt-button>
                </div>
              </div>
            </volt-card>
          }
        </div>
        <volt-card>
          <h3 class="mb-3 text-lg font-semibold">Prompt Template Editor</h3>
          @if (editingTemplate(); as template) {
            <form class="grid gap-3" (ngSubmit)="saveTemplate(template)">
              <volt-field label="Name"><input class="form-control" name="templateName" [(ngModel)]="template.name" /></volt-field>
              <volt-field label="Description"><textarea class="form-control min-h-20" name="templateDescription" [(ngModel)]="template.description"></textarea></volt-field>
              <volt-field label="Framework">
                <select class="form-control" name="templateFramework" [(ngModel)]="template.frameworkId" (ngModelChange)="syncTemplateValues(template)">
                  @for (framework of store.promptFrameworks(); track framework.id) { <option [value]="framework.id">{{ framework.name }}</option> }
                </select>
              </volt-field>
              <volt-field label="Role">
                <select class="form-control" name="templateRole" [(ngModel)]="template.roleId">
                  <option value="">No role</option>
                  @for (role of store.roles(); track role.id) { <option [value]="role.id">{{ role.name }}</option> }
                </select>
              </volt-field>
              @for (section of sectionsForTemplate(template); track section.id) {
                <volt-field [label]="section.label">
                  <textarea class="form-control min-h-24" name="value-{{ section.key }}" [placeholder]="section.placeholder" [(ngModel)]="template.values[section.key]"></textarea>
                </volt-field>
              }
              <volt-field label="Tags"><input class="form-control" name="templateTags" [ngModel]="formatTags(template.tags)" (ngModelChange)="template.tags = parseTags($event)" /></volt-field>
              <div class="flex flex-wrap gap-2">
                <select class="form-control w-auto" name="outputMode" [(ngModel)]="outputModeValue">
                  <option value="markdown">Markdown</option>
                  <option value="yaml">YAML</option>
                  <option value="json">JSON</option>
                  <option value="raw">Raw prompt</option>
                </select>
                <volt-button tone="primary" type="submit">Save</volt-button>
                <volt-button (clicked)="copyTemplate(template, outputMode())">Copy Output</volt-button>
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
            <volt-button tone="primary" (clicked)="kind === 'skills' ? editSkill(newSkill()) : editRole(newRole())">New {{ kind === 'skills' ? 'Skill' : 'Role' }}</volt-button>
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
                  <volt-button (clicked)="kind === 'skills' ? editSkill(asSkill(item)) : editRole(asRole(item))">Edit</volt-button>
                  <volt-button (clicked)="duplicate(kind, item.id)">Duplicate</volt-button>
                  <volt-button (clicked)="copyElement(item, 'markdown')">Copy Markdown</volt-button>
                  <volt-button tone="danger" (clicked)="remove(kind, item.id)">Delete</volt-button>
                </div>
              </div>
            </volt-card>
          }
        </div>
        <volt-card>
          @if (kind === 'skills' && editingSkill(); as skill) {
            <form class="grid gap-3" (ngSubmit)="saveSkill(skill)">
              <h3 class="text-lg font-semibold">Skill Editor</h3>
              <volt-field label="Name"><input class="form-control" name="skillName" [(ngModel)]="skill.name" /></volt-field>
              <volt-field label="Description"><textarea class="form-control min-h-20" name="skillDescription" [(ngModel)]="skill.description"></textarea></volt-field>
              <volt-field label="Instructions"><textarea class="form-control min-h-28" name="skillInstructions" [(ngModel)]="skill.instructions"></textarea></volt-field>
              <volt-field label="Input Format"><textarea class="form-control min-h-20" name="skillInput" [(ngModel)]="skill.inputFormat"></textarea></volt-field>
              <volt-field label="Output Format"><textarea class="form-control min-h-20" name="skillOutput" [(ngModel)]="skill.outputFormat"></textarea></volt-field>
              <volt-field label="Constraints"><textarea class="form-control min-h-20" name="skillConstraints" [(ngModel)]="skill.constraints"></textarea></volt-field>
              <volt-field label="Tags"><input class="form-control" name="skillTags" [ngModel]="formatTags(skill.tags)" (ngModelChange)="skill.tags = parseTags($event)" /></volt-field>
              <volt-button tone="primary" type="submit">Save Skill</volt-button>
              <pre class="max-h-80 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-300">{{ markdown.skill(skill) }}</pre>
            </form>
          } @else if (kind === 'roles' && editingRole(); as role) {
            <form class="grid gap-3" (ngSubmit)="saveRole(role)">
              <h3 class="text-lg font-semibold">Role Editor</h3>
              <volt-field label="Name"><input class="form-control" name="roleName" [(ngModel)]="role.name" /></volt-field>
              <volt-field label="Description"><textarea class="form-control min-h-20" name="roleDescription" [(ngModel)]="role.description"></textarea></volt-field>
              <volt-field label="Content"><textarea class="form-control min-h-40" name="roleContent" [(ngModel)]="role.content"></textarea></volt-field>
              <volt-field label="Tags"><input class="form-control" name="roleTags" [ngModel]="formatTags(role.tags)" (ngModelChange)="role.tags = parseTags($event)" /></volt-field>
              <volt-button tone="primary" type="submit">Save Role</volt-button>
              <pre class="max-h-80 overflow-auto rounded-md bg-slate-900 p-3 text-xs text-slate-300">{{ markdown.role(role) }}</pre>
            </form>
          }
        </volt-card>
      </div>
    </ng-template>

    <ng-template #blocksView>
      <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div class="grid gap-3">
          <div class="flex justify-end"><volt-button tone="primary" (clicked)="editBlock(newBlock())">New Prompt Block</volt-button></div>
          @for (block of filteredBlocks(); track block.id) {
            <volt-card [move]="'fade-up'">
              <div class="flex flex-col gap-3 md:flex-row md:justify-between">
                <div>
                  <h3 class="text-lg font-semibold">{{ block.name }}</h3>
                  <p class="text-sm text-slate-400">{{ block.content }}</p>
                  <div class="mt-3 flex flex-wrap gap-2"><volt-badge>{{ block.category }}</volt-badge>@for (tag of block.tags; track tag) { <volt-badge>{{ tag }}</volt-badge> }</div>
                </div>
                <div class="flex flex-wrap gap-2">
                  <volt-button (clicked)="editBlock(block)">Edit</volt-button>
                  <volt-button (clicked)="copyText(block.content)">Copy</volt-button>
                  <volt-button (clicked)="duplicate('promptBlocks', block.id)">Duplicate</volt-button>
                  <volt-button tone="danger" (clicked)="remove('promptBlocks', block.id)">Delete</volt-button>
                </div>
              </div>
            </volt-card>
          }
        </div>
        <volt-card>
          @if (editingBlock(); as block) {
            <form class="grid gap-3" (ngSubmit)="saveBlock(block)">
              <h3 class="text-lg font-semibold">Prompt Block Editor</h3>
              <volt-field label="Name"><input class="form-control" name="blockName" [(ngModel)]="block.name" /></volt-field>
              <volt-field label="Description"><textarea class="form-control min-h-20" name="blockDescription" [(ngModel)]="block.description"></textarea></volt-field>
              <volt-field label="Content"><textarea class="form-control min-h-28" name="blockContent" [(ngModel)]="block.content"></textarea></volt-field>
              <volt-field label="Category">
                <select class="form-control" name="blockCategory" [(ngModel)]="block.category">
                  @for (category of blockCategories; track category) { <option [value]="category">{{ category }}</option> }
                </select>
              </volt-field>
              <volt-field label="Tags"><input class="form-control" name="blockTags" [ngModel]="formatTags(block.tags)" (ngModelChange)="block.tags = parseTags($event)" /></volt-field>
              <volt-button tone="primary" type="submit">Save Block</volt-button>
            </form>
          }
        </volt-card>
      </div>
    </ng-template>

    <ng-template #importExportView>
      <div class="grid gap-4 xl:grid-cols-2">
        <volt-card>
          <h3 class="mb-3 text-lg font-semibold">Export Workspace</h3>
          <div class="flex flex-wrap gap-2">
            <volt-button tone="primary" (clicked)="exportWorkspace('json')">JSON</volt-button>
            <volt-button tone="primary" (clicked)="exportWorkspace('yaml')">YAML</volt-button>
            <volt-button tone="primary" (clicked)="exportWorkspace('markdown')">Markdown</volt-button>
          </div>
          <textarea class="form-control mt-4 min-h-[420px] font-mono text-xs" [(ngModel)]="exportText" name="exportText"></textarea>
          <div class="mt-3"><volt-button (clicked)="copyText(exportText)">Copy Export</volt-button></div>
        </volt-card>
        <volt-card>
          <h3 class="mb-3 text-lg font-semibold">Import JSON / YAML</h3>
          <p class="mb-3 text-sm text-slate-400">Replace current workspace is implemented. Merge is intentionally left as TODO.</p>
          <textarea class="form-control min-h-[420px] font-mono text-xs" [(ngModel)]="importText" name="importText" placeholder="Paste JSON or YAML workspace export"></textarea>
          <div class="mt-3 flex flex-wrap gap-2">
            <volt-button tone="danger" (clicked)="replaceImport()">Replace Current Workspace</volt-button>
          </div>
        </volt-card>
      </div>
    </ng-template>

    <ng-template #settingsView>
      <volt-card>
        @if (editingSettings(); as settings) {
          <form class="grid max-w-xl gap-3" (ngSubmit)="saveSettings(settings)">
            <h3 class="text-lg font-semibold">Local Settings</h3>
            <p class="text-sm text-slate-400">Your data is stored locally in this browser. Export your workspace regularly if you want to move it to another device.</p>
            <volt-field label="Theme">
              <select class="form-control" name="theme" [(ngModel)]="settings.theme">
                <option value="system">System</option>
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </volt-field>
            <volt-field label="Default Export Format">
              <select class="form-control" name="defaultExport" [(ngModel)]="settings.defaultExportFormat">
                <option value="markdown">Markdown</option>
                <option value="json">JSON</option>
                <option value="yaml">YAML</option>
              </select>
            </volt-field>
            <volt-field label="Default Workspace Name"><input class="form-control" name="workspaceName" [(ngModel)]="settings.defaultWorkspaceName" /></volt-field>
            <label class="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" name="autosave" [(ngModel)]="settings.autosave" /> Autosave</label>
            <volt-button tone="primary" type="submit">Save Settings</volt-button>
          </form>
        }
      </volt-card>
    </ng-template>
  `,
})
export default class Home implements OnInit {
  readonly store = inject(WorkspaceStore);
  readonly markdown = inject(MarkdownService);
  private readonly clipboard = inject(ClipboardService);
  private readonly exportImport = inject(ExportImportService);

  readonly navItems: NavItem[] = [
    { id: 'agents', label: 'Agents' },
    { id: 'promptFrameworks', label: 'Prompt Frameworks' },
    { id: 'promptTemplates', label: 'Prompt Templates' },
    { id: 'skills', label: 'Skills' },
    { id: 'roles', label: 'Roles' },
    { id: 'promptBlocks', label: 'Prompt Blocks' },
    { id: 'importExport', label: 'Export / Import' },
    { id: 'settings', label: 'Settings' },
  ];
  readonly blockCategories: PromptBlockCategory[] = [
    'constraint',
    'tone',
    'output',
    'validation',
    'style',
    'coding-rule',
    'reasoning-rule',
  ];

  readonly editingAgent = signal<Agent | undefined>(undefined);
  readonly editingFramework = signal<PromptFramework | undefined>(undefined);
  readonly editingTemplate = signal<PromptTemplate | undefined>(undefined);
  readonly editingSkill = signal<Skill | undefined>(undefined);
  readonly editingRole = signal<Role | undefined>(undefined);
  readonly editingBlock = signal<PromptBlock | undefined>(undefined);
  readonly editingSettings = signal<AppSettings | undefined>(undefined);
  readonly outputMode = computed(() => this.outputModeValue as OutputMode);

  outputModeValue: OutputMode = 'markdown';
  exportText = '';
  importText = '';

  readonly filteredAgents = computed(() => this.store.filterByQuery(this.store.agents()));
  readonly filteredFrameworks = computed(() => this.store.filterByQuery(this.store.promptFrameworks()));
  readonly filteredTemplates = computed(() => this.store.filterByQuery(this.store.promptTemplates()));
  readonly filteredSkills = computed(() => this.store.filterByQuery(this.store.skills()));
  readonly filteredRoles = computed(() => this.store.filterByQuery(this.store.roles()));
  readonly filteredBlocks = computed(() => this.store.filterByQuery(this.store.promptBlocks()));

  async ngOnInit(): Promise<void> {
    await this.store.init();
    this.editingAgent.set(this.store.agents()[0] ? structuredClone(this.store.agents()[0]) : this.newAgent());
    this.editingFramework.set(this.store.promptFrameworks()[0] ? structuredClone(this.store.promptFrameworks()[0]) : this.newFramework());
    this.editingTemplate.set(this.store.promptTemplates()[0] ? structuredClone(this.store.promptTemplates()[0]) : this.newTemplate());
    this.editingSkill.set(this.store.skills()[0] ? structuredClone(this.store.skills()[0]) : this.newSkill());
    this.editingRole.set(this.store.roles()[0] ? structuredClone(this.store.roles()[0]) : this.newRole());
    this.editingBlock.set(this.store.promptBlocks()[0] ? structuredClone(this.store.promptBlocks()[0]) : this.newBlock());
    this.editingSettings.set(this.store.settings() ? structuredClone(this.store.settings()) : undefined);
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

  editBlock(block: PromptBlock): void {
    this.editingBlock.set(structuredClone(block));
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

  async saveBlock(block: PromptBlock): Promise<void> {
    await this.store.saveBlock(block);
    this.editingBlock.set(structuredClone(block));
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    await this.store.saveSettings(settings);
    this.editingSettings.set(structuredClone(settings));
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

  newBlock(): PromptBlock {
    return withTimestamps({
      name: 'New Prompt Block',
      description: '',
      content: '',
      category: 'constraint' as PromptBlockCategory,
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

  async exportWorkspace(mode: OutputMode): Promise<void> {
    if (mode === 'json') {
      this.exportText = await this.exportImport.exportJson();
    } else if (mode === 'yaml') {
      this.exportText = await this.exportImport.exportYaml();
    } else {
      this.exportText = await this.exportImport.exportMarkdown();
    }
  }

  async replaceImport(): Promise<void> {
    if (!window.confirm('This will replace all current local workspace data. Continue?')) {
      return;
    }

    try {
      const data = this.exportImport.parseImport(this.importText);
      await this.exportImport.replaceWorkspace(data);
      await this.store.refresh();
      this.store.notify('Workspace imported.');
    } catch (error) {
      this.store.notify(error instanceof Error ? error.message : 'Import failed.');
    }
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
    const timestamp = nowIso();

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
