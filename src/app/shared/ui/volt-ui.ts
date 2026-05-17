import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

type ButtonTone = 'primary' | 'secondary' | 'danger' | 'ghost';

@Component({
  selector: 'volt-button',
  standalone: true,
  imports: [NgClass],
  template: `
    <button
      [type]="type"
      [disabled]="disabled"
      [ngClass]="classes"
      (click)="clicked.emit($event)"
    >
      <ng-content />
    </button>
  `,
})
export class VoltButtonComponent {
  @Input() tone: ButtonTone = 'secondary';
  @Input() type: 'button' | 'submit' = 'button';
  @Input() disabled = false;
  @Output() clicked = new EventEmitter<MouseEvent>();

  get classes(): string[] {
    const base = [
      'inline-flex',
      'h-9',
      'items-center',
      'justify-center',
      'gap-2',
      'rounded-md',
      'border',
      'px-3',
      'text-sm',
      'font-medium',
      'transition',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-cyan-500/30',
      'disabled:pointer-events-none',
      'disabled:opacity-50',
    ];
    const tones: Record<ButtonTone, string[]> = {
      primary: ['border-cyan-500', 'bg-cyan-500', 'text-slate-950', 'hover:bg-cyan-400'],
      secondary: ['border-slate-700', 'bg-slate-900', 'text-slate-100', 'hover:bg-slate-800'],
      danger: ['border-rose-500/60', 'bg-rose-500/10', 'text-rose-200', 'hover:bg-rose-500/20'],
      ghost: ['border-transparent', 'bg-transparent', 'text-slate-300', 'hover:bg-slate-900'],
    };

    return [...base, ...tones[this.tone]];
  }
}

@Component({
  selector: 'volt-card',
  standalone: true,
  template: `
    <section class="rounded-lg border border-slate-800 bg-slate-950/70 p-4 shadow-sm shadow-black/10">
      <ng-content />
    </section>
  `,
})
export class VoltCardComponent {}

@Component({
  selector: 'volt-badge',
  standalone: true,
  template: `
    <span class="inline-flex items-center rounded-md border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-slate-300">
      <ng-content />
    </span>
  `,
})
export class VoltBadgeComponent {}

@Component({
  selector: 'volt-field',
  standalone: true,
  template: `
    <label class="grid gap-1.5 text-sm">
      <span class="font-medium text-slate-300">{{ label }}</span>
      <ng-content />
    </label>
  `,
})
export class VoltFieldComponent {
  @Input({ required: true }) label = '';
}

export const VOLT_UI = [
  VoltButtonComponent,
  VoltCardComponent,
  VoltBadgeComponent,
  VoltFieldComponent,
] as const;
