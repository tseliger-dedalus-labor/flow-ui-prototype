import { Provider } from '@angular/core';
import { provideFlowWidget } from 'flow-platform';
import { AppointmentsPanelComponent } from './appointments-panel.component';

export function provideAppointmentsWidgets(): Provider[] {
  return [provideFlowWidget('appointments-panel', AppointmentsPanelComponent)];
}
