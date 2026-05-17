import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { VoltFormField, VoltInput, VoltLabel } from '@voltui/components';
import { parseTags, formatTags } from '../../core/utils/entity-utils';

@Component({
  selector: 'app-tag-input',
  imports: [VoltFormField, VoltInput, VoltLabel],
  template: `
    <volt-form-field>
      <volt-label>{{ label() }}</volt-label>
      <volt-input
        [name]="name()"
        [value]="displayValue()"
        (valueChange)="onChange($event)"
      />
    </volt-form-field>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagInputComponent {
  readonly label = input('Tags');
  readonly name = input('tags');
  readonly tags = input<string[]>([]);
  readonly tagsChange = output<string[]>();

  displayValue(): string {
    return formatTags(this.tags());
  }

  onChange(value: string): void {
    this.tagsChange.emit(parseTags(value));
  }
}
