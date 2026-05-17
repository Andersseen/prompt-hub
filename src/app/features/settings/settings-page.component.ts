import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppSettings } from '../../core/models/entities';
import { WorkspaceStore } from '../../core/services/workspace-store.service';
import { VOLT_UI } from '../../shared/ui/volt-ui';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [FormsModule, ...VOLT_UI],
  template: `
    <volt-card>
      @if (editingSettings(); as settings) {
        <form class="grid max-w-xl gap-3" (ngSubmit)="saveSettings(settings)">
          <h3 class="text-lg font-semibold">Local Settings</h3>
          <p class="text-sm text-muted-foreground">
            Your data is stored locally in this browser. Export your workspace regularly if you want to move it to another device.
          </p>

          <volt-form-field>
            <volt-label>Theme</volt-label>
            <select class="form-control" name="theme" [(ngModel)]="settings.theme">
              <option value="system">System</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </volt-form-field>

          <volt-form-field>
            <volt-label>Default Export Format</volt-label>
            <select class="form-control" name="defaultExport" [(ngModel)]="settings.defaultExportFormat">
              <option value="markdown">Markdown</option>
              <option value="json">JSON</option>
              <option value="yaml">YAML</option>
            </select>
          </volt-form-field>

          <volt-form-field>
            <volt-label>Default Workspace Name</volt-label>
            <volt-input name="workspaceName" [(value)]="settings.defaultWorkspaceName" />
          </volt-form-field>

          <label class="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" name="autosave" [(ngModel)]="settings.autosave" />
            Autosave
          </label>

          <volt-button variant="solid" type="submit">Save Settings</volt-button>
        </form>
      }
    </volt-card>
  `,
})
export class SettingsPageComponent implements OnInit {
  private readonly store = inject(WorkspaceStore);
  readonly editingSettings = signal<AppSettings | undefined>(undefined);

  ngOnInit(): void {
    const settings = this.store.settings();
    this.editingSettings.set(settings ? structuredClone(settings) : undefined);
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    await this.store.saveSettings(settings);
    this.editingSettings.set(structuredClone(settings));
  }
}
