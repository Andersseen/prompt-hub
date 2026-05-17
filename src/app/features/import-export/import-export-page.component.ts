import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { ClipboardService } from '../../core/services/clipboard.service';
import { ExportImportService } from '../../core/services/export-import.service';
import { WorkspaceStore } from '../../core/services/workspace-store.service';
import { VOLT_UI } from '../../shared/ui/volt-ui';

type WorkspaceExportMode = 'json' | 'yaml' | 'markdown';

@Component({
  selector: 'app-import-export-page',
  imports: [...VOLT_UI],
  template: `
    <div class="grid gap-4 xl:grid-cols-2">
      <volt-card>
        <h3 class="mb-3 text-lg font-semibold">Export Workspace</h3>
        <div class="flex flex-wrap gap-2">
          <volt-button variant="solid" (click)="exportWorkspace('json')">JSON</volt-button>
          <volt-button variant="solid" (click)="exportWorkspace('yaml')">YAML</volt-button>
          <volt-button variant="solid" (click)="exportWorkspace('markdown')">Markdown</volt-button>
        </div>
        <textarea
          class="form-control mt-4 min-h-[420px] font-mono text-xs"
          [value]="exportText()"
          (input)="exportText.set(readInputValue($event))"
          name="exportText"
        ></textarea>
        <div class="mt-3">
          <volt-button (click)="copyExport()">Copy Export</volt-button>
        </div>
      </volt-card>

      <volt-card>
        <h3 class="mb-3 text-lg font-semibold">Import JSON / YAML</h3>
        <p class="mb-3 text-sm text-muted-foreground">
          Replace current workspace is implemented. Merge is intentionally left as TODO.
        </p>
        <textarea
          class="form-control min-h-[420px] font-mono text-xs"
          [value]="importText()"
          (input)="importText.set(readInputValue($event))"
          name="importText"
          placeholder="Paste JSON or YAML workspace export"
        ></textarea>
        <div class="mt-3 flex flex-wrap gap-2">
          <volt-button variant="destructive" (click)="replaceImport()">Replace Current Workspace</volt-button>
        </div>
      </volt-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportExportPageComponent {
  private readonly clipboard = inject(ClipboardService);
  private readonly exportImport = inject(ExportImportService);
  private readonly store = inject(WorkspaceStore);

  readonly exportText = signal('');
  readonly importText = signal('');

  async exportWorkspace(mode: WorkspaceExportMode): Promise<void> {
    if (mode === 'json') {
      this.exportText.set(await this.exportImport.exportJson());
      return;
    }

    if (mode === 'yaml') {
      this.exportText.set(await this.exportImport.exportYaml());
      return;
    }

    this.exportText.set(await this.exportImport.exportMarkdown());
  }

  async copyExport(): Promise<void> {
    await this.clipboard.copy(this.exportText());
    this.store.notify('Copied to clipboard.');
  }

  async replaceImport(): Promise<void> {
    if (!window.confirm('This will replace all current local workspace data. Continue?')) {
      return;
    }

    try {
      const data = this.exportImport.parseImport(this.importText());
      await this.exportImport.replaceWorkspace(data);
      await this.store.refresh();
      this.store.notify('Workspace imported.');
    } catch (error) {
      this.store.notify(error instanceof Error ? error.message : 'Import failed.');
    }
  }

  readInputValue(event: Event): string {
    return event.target instanceof HTMLTextAreaElement ? event.target.value : '';
  }
}
