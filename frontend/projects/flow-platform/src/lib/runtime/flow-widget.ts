import { InjectionToken, Provider, Type } from '@angular/core';

export interface FlowWidgetRegistration {
  componentId: string;
  component: Type<unknown>;
}

export const FLOW_WIDGET = new InjectionToken<FlowWidgetRegistration[]>('FLOW_WIDGET');

export function provideFlowWidget(componentId: string, component: Type<unknown>): Provider {
  return {
    provide: FLOW_WIDGET,
    useValue: { componentId, component },
    multi: true
  };
}
