import { InjectionToken, Provider, Type } from '@angular/core';
import { ComponentDescriptor } from '../models';

export interface FlowComponentDefinition {
  component: Type<unknown>;
  descriptor: ComponentDescriptor;
}

export interface FlowWidgetRegistration {
  componentId: string;
  descriptor: ComponentDescriptor;
  component: Type<unknown>;
}

export const FLOW_WIDGET = new InjectionToken<FlowWidgetRegistration[]>('FLOW_WIDGET');

export function defineFlowComponent(
  component: Type<unknown>,
  descriptor: ComponentDescriptor
): FlowComponentDefinition {
  return { component, descriptor };
}

export function provideFlowWidget(definition: FlowComponentDefinition): Provider {
  const { component, descriptor } = definition;
  return {
    provide: FLOW_WIDGET,
    useValue: { componentId: descriptor.id, descriptor, component },
    multi: true
  };
}
