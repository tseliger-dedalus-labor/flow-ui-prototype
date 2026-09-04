import { Provider } from '@angular/core';
import { provideFlowWidget } from 'flow-platform';
import { FLOW_COMPONENTS } from './flow-components';

/**
 * Registriert alle Appointment-Widgets gesammelt für eine Route oder Anwendung.
 */
export function provideAppointmentsWidgets(): Provider[] {
  return FLOW_COMPONENTS.map((definition) => provideFlowWidget(definition));
}
