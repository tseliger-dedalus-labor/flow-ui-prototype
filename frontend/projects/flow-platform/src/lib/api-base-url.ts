import { InjectionToken, Provider } from '@angular/core';

export const FLOW_UI_API_BASE_URL = new InjectionToken<string>('FLOW_UI_API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api'
});

export function provideFlowUiApiBaseUrl(apiBaseUrl: string): Provider {
  return { provide: FLOW_UI_API_BASE_URL, useValue: apiBaseUrl };
}
