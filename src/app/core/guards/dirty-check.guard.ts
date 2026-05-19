import { type Signal } from '@angular/core';
import { type CanDeactivateFn } from '@angular/router';

export interface HasDirtyCheck {
  isDirty: Signal<boolean>;
}

export const dirtyCheckGuard: CanDeactivateFn<HasDirtyCheck> = (component) => {
  if (component.isDirty && component.isDirty()) {
    return window.confirm('You have unsaved changes. Discard them?');
  }
  return true;
};
