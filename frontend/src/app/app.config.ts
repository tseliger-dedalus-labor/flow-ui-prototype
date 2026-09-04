import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideFlowUiApiBaseUrl } from 'flow-platform';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

/**
 * Bündelt die globalen Provider für Routing, HTTP und API-Basis-URL.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Event-Coalescing reduziert unnötige Change-Detection-Zyklen bei UI-Interaktionen.
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    provideFlowUiApiBaseUrl(environment.apiBaseUrl)
  ]
};
