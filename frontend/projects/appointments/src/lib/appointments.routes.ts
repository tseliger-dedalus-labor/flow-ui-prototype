import { Routes } from '@angular/router';
import { FlowEngineService } from 'flow-platform';
import { providePatientWorkflowWidgets } from 'patient-workflow';
import { AppointmentsPageComponent } from './appointments-page.component';
import { provideAppointmentsWidgets } from './appointments.providers';

export const APPOINTMENTS_ROUTES: Routes = [
  {
    path: '',
    component: AppointmentsPageComponent,
    providers: [
      FlowEngineService,
      ...providePatientWorkflowWidgets(),
      ...provideAppointmentsWidgets()
    ]
  }
];
