import {
  provideHttpClient,
  withFetch,
} from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideMovement } from 'angular-movement';
import { provideVoltTheme } from '@voltui/components';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(
      withFetch()
    ),
    provideClientHydration(withEventReplay()),
    provideMovement({
      duration: 220,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      delay: 0,
      disabled: false,
    }),
    provideVoltTheme({
      color: 'glacier',
      style: 'sharp',
      dark: true,
    }),
  ],
};
