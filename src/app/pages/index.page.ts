import { Component } from '@angular/core';

import { PromptHubDashboardComponent } from '../features/dashboard/prompt-hub-dashboard.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [PromptHubDashboardComponent],
  template: `<app-prompt-hub-dashboard />`,
})
export default class Home {}
