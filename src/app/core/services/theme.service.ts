import { Injectable, signal } from '@angular/core';

import { Theme } from '../models/entities';

const STORAGE_KEY = 'prompt-hub-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.loadTheme());

  constructor() {
    // Apply initial theme
    this.applyTheme(this.theme());
  }

  setTheme(value: Theme): void {
    this.theme.set(value);
    this.saveTheme(value);
    this.applyTheme(value);
  }

  toggle(): Theme {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.setTheme(next);
    return next;
  }

  private applyTheme(value: Theme): void {
    document.documentElement.setAttribute('data-theme', value);
  }

  private loadTheme(): Theme {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === 'light' || raw === 'dark') {
        return raw;
      }
    } catch {
      // ignore localStorage errors
    }
    return 'dark';
  }

  private saveTheme(value: Theme): void {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // ignore localStorage errors
    }
  }
}
