import { Component, Input } from '@angular/core';
import { AContentPresenter } from 'ui-framework';

/**
 * Platzhalter-Container für patientenbezogene Unter-Widgets innerhalb eines Flows.
 */
@Component({
  selector: 'app-patient-view',
  standalone: true,
  templateUrl: './patient-view.component.html'
})
export class PatientViewComponent extends AContentPresenter {
  @Input({ required: true }) patientId = '';
  @Input({ required: true }) caseId = '';

  constructor() {
    super('WebclientTool');
  }
}
