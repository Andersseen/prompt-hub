import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { AppSettings } from '../../core/models/entities';
import { WorkspaceStore } from '../../core/services/workspace-store.service';
import { VOLT_UI } from '../../shared/ui/volt-ui';

@Component({
  selector: 'app-settings-page',
  imports: [ReactiveFormsModule, ...VOLT_UI],
  template: `
    <volt-card>
      @if (settings(); as settings) {
        <form class="grid max-w-xl gap-3" [formGroup]="form" (ngSubmit)="saveSettings(settings)">
          <h3 class="text-lg font-semibold">Local Settings</h3>
          <p class="text-sm text-muted-foreground">
            Your data is stored locally in this browser. Export your workspace regularly if you want to move it to another device.
          </p>

          <volt-form-field>
            <volt-label>Theme</volt-label>
            <select class="form-control" name="theme" formControlName="theme">
              <option value="system">System</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </volt-form-field>

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

          <label class="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" name="autosave" formControlName="autosave" />
            Autosave
          </label>

          <volt-button variant="solid" type="submit">Save Settings</volt-button>
        </form>
      }
    </volt-card>
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
