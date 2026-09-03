import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-patient-view',
  standalone: true,
  template: '<h2>Patientenansicht</h2><p>Aktiver Patient: {{ patientId }}</p>'
})
export class PatientViewComponent {
  @Input() patientId = '';
}
