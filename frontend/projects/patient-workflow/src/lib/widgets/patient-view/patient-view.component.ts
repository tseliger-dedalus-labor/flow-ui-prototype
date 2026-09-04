import { Component, Input } from '@angular/core';

/**
 * Platzhalter-Container für patientenbezogene Unter-Widgets innerhalb eines Flows.
 */
@Component({
  selector: 'app-patient-view',
  standalone: true,
  templateUrl: './patient-view.component.html'
})
export class PatientViewComponent {
  @Input({ required: true }) patientId = '';
}
