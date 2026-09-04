import { Routes } from '@angular/router';
import { FlowEngineService } from 'flow-platform';
import { providePatientWorkflowWidgets } from 'patient-workflow';
import { AppointmentsPageComponent } from './appointments-page/appointments-page.component';
import { provideAppointmentsWidgets } from './appointments.providers';

/**
 * Setzt die Terminplanungs-Route aus Runtime-Seite, Engine und benötigten Widget-Registern zusammen.
 */
export const APPOINTMENTS_ROUTES: Routes = [
  {
    path: '',
    component: AppointmentsPageComponent,
    providers: [
      FlowEngineService,
      // Die Terminplanung baut auf Patient-Widgets auf und ergänzt eigene Widgets im selben Renderer.
      ...providePatientWorkflowWidgets(),
      ...provideAppointmentsWidgets()
    ]
  }
];
