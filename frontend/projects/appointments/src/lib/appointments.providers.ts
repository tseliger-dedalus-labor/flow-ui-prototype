import { Provider } from '@angular/core';
import { provideFlowWidget } from 'flow-platform';
import { FLOW_COMPONENTS } from './flow-components';

export function provideAppointmentsWidgets(): Provider[] {
  return FLOW_COMPONENTS.map((definition) => provideFlowWidget(definition));
}
