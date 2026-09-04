import { InjectionToken, Provider, Type } from '@angular/core';
import { ComponentDescriptor } from '../models';

export interface FlowWidgetRegistration {
  componentId: string;
  descriptor: ComponentDescriptor;
  component: Type<unknown>;
}

export const FLOW_WIDGET = new InjectionToken<FlowWidgetRegistration[]>('FLOW_WIDGET');

export function provideFlowWidget(descriptor: ComponentDescriptor, component: Type<unknown>): Provider {
  return {
    provide: FLOW_WIDGET,
    useValue: { componentId: descriptor.id, descriptor, component },
    multi: true
  };
}
