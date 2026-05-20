import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { VoltButton, VoltCard, VoltFormField, VoltInput, VoltLabel } from '@voltui/components';
import { AppSettings } from '../../core/models/entities';
import { ThemeService } from '../../core/services/theme.service';
import { WorkspaceStore } from '../../core/services/workspace-store.service';

@Component({
  selector: 'app-settings-page',
  imports: [ReactiveFormsModule, VoltButton, VoltCard, VoltFormField, VoltInput, VoltLabel],
  template: `
    <div class="max-w-xl">
      <div class="editor-panel flex flex-col gap-5">
        <div class="border-b border-border pb-3">
          <h3 class="text-sm font-semibold">Settings</h3>
          <p class="mt-0.5 text-xs text-muted-foreground">Customize your workspace preferences</p>
        </div>

        @if (settings(); as settings) {
          <form class="flex flex-col gap-4" [formGroup]="form" (ngSubmit)="saveSettings(settings)">
            <!-- Theme Toggle -->
            <div class="rounded-lg border border-border bg-background p-3">
              <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Appearance</h4>
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium">Theme</p>
                  <p class="text-xs text-muted-foreground">{{ themeLabel() }}</p>
                </div>
                <button
                  type="button"
                  class="rounded-md border border-border bg-surface p-2 transition-colors hover:bg-elevated"
                  (click)="toggleTheme()"
                  [attr.aria-label]="'Switch to ' + (themeService.theme() === 'dark' ? 'light' : 'dark') + ' mode'"
                >
                  @if (themeService.theme() === 'dark') {
                    <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  } @else {
                    <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  }
                </button>
              </div>
            </div>

            <div class="rounded-lg border border-border bg-background p-3">
              <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Defaults</h4>
              <div class="flex flex-col gap-3">
                <volt-form-field>
                  <volt-label>Default Export Format</volt-label>
                  <select class="form-control" name="defaultExport" formControlName="defaultExportFormat">
                    <option value="markdown">Markdown</option>
                    <option value="json">JSON</option>
                    <option value="yaml">YAML</option>
                  </select>
                </volt-form-field>

                <volt-form-field>
                  <volt-label>Default Workspace Name</volt-label>
                  <volt-input
                    name="workspaceName"
                    [value]="form.controls.defaultWorkspaceName.value"
                    (valueChange)="form.controls.defaultWorkspaceName.setValue($event)"
                  />
                </volt-form-field>
              </div>
            </div>

            <div class="rounded-lg border border-border bg-background p-3">
              <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Behavior</h4>
              <label class="flex items-center gap-2.5 text-sm text-muted-foreground">
                <input 
                  type="checkbox" 
                  class="h-4 w-4 rounded border-border bg-background text-primary"
                  name="autosave" 
                  formControlName="autosave" 
                />
                <span>Autosave changes</span>
              </label>
            </div>

            <volt-button variant="solid" size="sm" type="submit" [disabled]="store.saving()">Save Settings</volt-button>
          </form>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent implements OnInit {
  readonly store = inject(WorkspaceStore);
  readonly themeService = inject(ThemeService);
  readonly settings = computed(() => this.store.settings());
  readonly themeLabel = computed(() => {
    return this.themeService.theme() === 'dark' ? 'Dark mode' : 'Light mode';
  });

  readonly form = new FormGroup({
    theme: new FormControl<AppSettings['theme']>('dark', { nonNullable: true }),
    defaultExportFormat: new FormControl<AppSettings['defaultExportFormat']>('markdown', {
      nonNullable: true,
    }),
    defaultWorkspaceName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    autosave: new FormControl(true, { nonNullable: true }),
  });

  ngOnInit(): void {
    const settings = this.store.settings();
    if (!settings) {
      return;
    }

    this.form.setValue({
      theme: settings.theme,
      defaultExportFormat: settings.defaultExportFormat,
      defaultWorkspaceName: settings.defaultWorkspaceName,
      autosave: settings.autosave,
    });
  }

  toggleTheme(): void {
    const next = this.themeService.toggle();
    this.form.controls.theme.setValue(next);
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    await this.store.saveSettings({
      ...settings,
      ...this.form.getRawValue(),
    });
  }
}
