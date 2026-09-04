import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-patient-view',
  standalone: true,
  templateUrl: './patient-view.component.html'
})
export class PatientViewComponent {
  @Input() patientId = '';
}
