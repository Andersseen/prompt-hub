import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { VoltButton, VoltCard } from '@voltui/components';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';

@Component({
  selector: 'app-entity-card',
  imports: [VoltButton, VoltCard, ...MOVEMENT_DIRECTIVES],
  template: `
    <volt-card [move]="move()">
      <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div class="min-w-0 flex-1">
          <h3 class="text-lg font-semibold">{{ name() }}</h3>
          <p class="mt-1 text-sm text-muted-foreground">{{ description() }}</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <ng-content select="[badges]" />
          </div>
        </div>
        <div class="flex flex-wrap gap-2">
          <volt-button size="sm" (click)="editItem.emit()">Edit</volt-button>
          <volt-button size="sm" (click)="duplicateItem.emit()">Duplicate</volt-button>
          <volt-button size="sm" (click)="copyItem.emit()">{{ copyLabel() }}</volt-button>
          <volt-button size="sm" variant="destructive" (click)="deleteItem.emit()">Delete</volt-button>
        </div>
      </div>
    </volt-card>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityCardComponent {
  readonly name = input('');
  readonly description = input('');
  readonly move = input<string | undefined>(undefined);
  readonly copyLabel = input('Copy');

  readonly editItem = output<void>();
  readonly duplicateItem = output<void>();
  readonly copyItem = output<void>();
  readonly deleteItem = output<void>();
}
