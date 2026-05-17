import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PromptHubDashboardComponent } from '../features/dashboard/prompt-hub-dashboard.component';

@Component({
  selector: 'app-home',
  imports: [PromptHubDashboardComponent],
  template: `<app-prompt-hub-dashboard />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Home {}
