import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from "@angular/core";

import { VoltButton, VoltCard } from "@voltui/components";
import { ClipboardService } from "../../core/services/clipboard.service";
import { ExportImportService } from "../../core/services/export-import.service";
import { WorkspaceStore } from "../../core/services/workspace-store.service";

type WorkspaceExportMode = "json" | "yaml" | "markdown";

@Component({
  selector: "app-import-export-page",
  imports: [VoltButton, VoltCard],
  template: `
    <div class="grid gap-4 xl:grid-cols-2">
      <!-- Export -->
      <div class="editor-panel flex flex-col gap-4">
        <div
          class="flex items-center justify-between border-b border-border pb-3"
        >
          <div>
            <h3 class="text-sm font-semibold">Export Workspace</h3>
            <p class="mt-0.5 text-xs text-muted-foreground">
              Download or copy your data
            </p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <volt-button
            variant="outline"
            size="sm"
            (click)="exportWorkspace('json')"
            >JSON</volt-button
          >
          <volt-button
            variant="outline"
            size="sm"
            (click)="exportWorkspace('yaml')"
            >YAML</volt-button
          >
          <volt-button
            variant="outline"
            size="sm"
            (click)="exportWorkspace('markdown')"
            >Markdown</volt-button
          >
          <volt-button variant="ghost" size="sm" (click)="copyExport()"
            >Copy</volt-button
          >
        </div>

        <textarea
          class="form-control min-h-[360px] font-mono text-xs"
          [value]="exportText()"
          (input)="exportText.set(readInputValue($event))"
          name="exportText"
          placeholder="Export will appear here..."
        ></textarea>
      </div>

      <!-- Import -->
      <div class="editor-panel flex flex-col gap-4">
        <div
          class="flex items-center justify-between border-b border-border pb-3"
        >
          <div>
            <h3 class="text-sm font-semibold">Import Workspace</h3>
            <p class="mt-0.5 text-xs text-muted-foreground">
              Replace current data
            </p>
          </div>
        </div>

        <div class="rounded-lg border border-border bg-background p-3">
          <p class="text-xs text-muted-foreground">
            Paste JSON or YAML workspace export below. This will
            <span class="font-medium text-destructive"
              >replace all current data</span
            >.
          </p>
        </div>

        <textarea
          class="form-control min-h-[300px] font-mono text-xs"
          [value]="importText()"
          (input)="importText.set(readInputValue($event))"
          name="importText"
          placeholder="Paste exported workspace data here..."
        ></textarea>

        <volt-button variant="destructive" size="sm" (click)="replaceImport()"
          >Replace Current Workspace</volt-button
        >
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportExportPageComponent {
  private readonly clipboard = inject(ClipboardService);
  private readonly exportImport = inject(ExportImportService);
  private readonly store = inject(WorkspaceStore);

  readonly exportText = signal("");
  readonly importText = signal("");

  async exportWorkspace(mode: WorkspaceExportMode): Promise<void> {
    if (mode === "json") {
      this.exportText.set(await this.exportImport.exportJson());
      return;
    }

    if (mode === "yaml") {
      this.exportText.set(await this.exportImport.exportYaml());
      return;
    }

    this.exportText.set(await this.exportImport.exportMarkdown());
  }

  async copyExport(): Promise<void> {
    await this.clipboard.copy(this.exportText());
    this.store.notify("Copied to clipboard.");
  }

  async replaceImport(): Promise<void> {
    if (
      !window.confirm(
        "This will replace all current local workspace data. Continue?",
      )
    ) {
      return;
    }

    try {
      const data = this.exportImport.parseImport(this.importText());
      await this.exportImport.replaceWorkspace(data);
      await this.store.refresh();
      this.store.notify("Workspace imported.");
    } catch (error) {
      this.store.notify(
        error instanceof Error ? error.message : "Import failed.",
      );
    }
  }

  readInputValue(event: Event): string {
    return event.target instanceof HTMLTextAreaElement
      ? event.target.value
      : "";
  }
}
