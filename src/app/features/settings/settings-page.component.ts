import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { VoltButton, VoltCard, VoltFormField, VoltInput, VoltLabel } from '@voltui/components';
import { AppSettings } from '../../core/models/entities';
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
            <div class="rounded-lg border border-border bg-background p-3">
              <h4 class="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Appearance</h4>
              <volt-form-field>
                <volt-label>Theme</volt-label>
                <select class="form-control" name="theme" formControlName="theme">
                  <option value="system">System</option>
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </volt-form-field>
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

            <volt-button variant="solid" size="sm" type="submit">Save Settings</volt-button>
          </form>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent implements OnInit {
  private readonly store = inject(WorkspaceStore);
  readonly settings = computed(() => this.store.settings());
  readonly form = new FormGroup({
    theme: new FormControl<AppSettings['theme']>('system', { nonNullable: true }),
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
