import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { PatientApiService } from '../patient-api.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-patient-list',
    imports: [],
    template: `
    <h2>Patientenliste <small>Modus: {{ mode }}</small></h2>
    @if (!wardId) {
      <p class="hint">Bitte zuerst eine Station wählen.</p>
    }
    @if (wardId) {
      <ul class="cards">
        @for (patient of patients; track patient) {
          <li>
            <button type="button" (click)="selectPatient(patient.id)">{{ patient.name }} ({{ patient.id }})</button>
          </li>
        }
      </ul>
    }
    `,
    styles: ['.cards { list-style: none; padding: 0; } .cards button { width: 100%; text-align: left; margin-bottom: .5rem; padding: .75rem; } .hint{color:#666;}']
})
export class PatientListComponent implements OnChanges, OnDestroy {
  @Input() wardId = '';
  @Input() mode: 'normal' | 'findings' | 'orders' | 'transfusions' = 'normal';
  @Output() readonly patientSelected = new EventEmitter<{ patientId: string }>();

  patients: Array<{ id: string; name: string }> = [];
  private loadSubscription?: Subscription;

  constructor(private readonly api: PatientApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.loadSubscription?.unsubscribe();
    if ((changes['wardId'] || changes['mode']) && this.wardId) {
      this.loadSubscription = this.api.getPatients(this.wardId).subscribe((data) => this.patients = data);
      return;
    }
    this.patients = [];
  }

  selectPatient(patientId: string): void {
    this.patientSelected.emit({ patientId });
  }

  ngOnDestroy(): void {
    this.loadSubscription?.unsubscribe();
  }
}
