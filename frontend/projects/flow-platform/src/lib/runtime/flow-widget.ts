import { InjectionToken, Provider, Type } from '@angular/core';
import { ComponentDescriptor } from '../models';

/**
 * Kombiniert Angular-Komponententyp und Flow-Metadaten an einer Stelle.
 */
export interface FlowComponentDefinition {
  component: Type<unknown>;
  descriptor: ComponentDescriptor;
}

/**
 * Interne Registrierungsform, mit der Widgets über DI an die Runtime gemeldet werden.
 */
export interface FlowWidgetRegistration {
  componentId: string;
  descriptor: ComponentDescriptor;
  component: Type<unknown>;
}

/**
 * Multi-Provider-Token für alle zur Laufzeit verfügbaren Flow-Widgets.
 */
export const FLOW_WIDGET = new InjectionToken<FlowWidgetRegistration[]>('FLOW_WIDGET');

/**
 * Hilfsfunktion zum typsicheren Deklarieren einer Flow-Komponente samt Descriptor.
 */
export function defineFlowComponent(
  component: Type<unknown>,
  descriptor: ComponentDescriptor
): FlowComponentDefinition {
  return { component, descriptor };
}

/**
 * Registriert eine deklarierte Flow-Komponente als Multi-Provider für den dynamischen Renderer.
 */
export function provideFlowWidget(definition: FlowComponentDefinition): Provider {
  const { component, descriptor } = definition;
  return {
    provide: FLOW_WIDGET,
    useValue: { componentId: descriptor.id, descriptor, component },
    multi: true
  };
}
