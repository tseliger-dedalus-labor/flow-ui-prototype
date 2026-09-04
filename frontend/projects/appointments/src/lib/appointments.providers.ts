import { Provider } from '@angular/core';
import { provideFlowWidget } from 'flow-platform';
import { AppointmentsPanelComponent } from './appointments-panel/appointments-panel.component';
import { appointmentsComponent } from './component-manifest';

export function provideAppointmentsWidgets(): Provider[] {
  return [provideFlowWidget(appointmentsComponent('appointments-panel'), AppointmentsPanelComponent)];
}
