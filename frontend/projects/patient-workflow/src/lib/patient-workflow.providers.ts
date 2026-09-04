import { Provider } from '@angular/core';
import { provideFlowWidget } from 'flow-platform';
import { FLOW_COMPONENTS } from './flow-components';

/**
 * Registriert alle Widgets des Patient-Workflows für die Flow-Runtime.
 */
export function providePatientWorkflowWidgets(): Provider[] {
  return FLOW_COMPONENTS.map((definition) => provideFlowWidget(definition));
}
