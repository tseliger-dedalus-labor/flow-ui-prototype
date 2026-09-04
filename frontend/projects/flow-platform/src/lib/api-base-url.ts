import { InjectionToken, Provider } from '@angular/core';

/**
 * Liefert die Basis-URL für alle Frontend-zu-Backend-Aufrufe des Flow-Ökosystems.
 */
export const FLOW_UI_API_BASE_URL = new InjectionToken<string>('FLOW_UI_API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api'
});

/**
 * Überschreibt die standardmäßige API-Basis-URL für eine konkrete Anwendung.
 */
export function provideFlowUiApiBaseUrl(apiBaseUrl: string): Provider {
  return { provide: FLOW_UI_API_BASE_URL, useValue: apiBaseUrl };
}
