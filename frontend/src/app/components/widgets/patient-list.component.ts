import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <h2>Patientenliste <small>Modus: {{ mode }}</small></h2>
    <p *ngIf="!wardId" class="hint">Bitte zuerst eine Station wählen.</p>
    <ul class="cards" *ngIf="wardId">
      <li *ngFor="let patient of patients">
        <button type="button" (click)="selectPatient(patient.id)">{{ patient.name }} ({{ patient.id }})</button>
      </li>
    </ul>
  `,
  styles: ['.cards { list-style: none; padding: 0; } .cards button { width: 100%; text-align: left; margin-bottom: .5rem; padding: .75rem; } .hint{color:#666;}']
})
export class PatientListComponent implements OnChanges {
  @Input() wardId = '';
  @Input() mode: 'normal' | 'findings' | 'orders' | 'transfusions' = 'normal';
  @Output() readonly patientSelected = new EventEmitter<{ patientId: string }>();

  patients: Array<{ id: string; name: string }> = [];

  constructor(private readonly api: ApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['wardId'] && this.wardId) {
      this.api.getPatients(this.wardId).subscribe((data) => this.patients = data);
    }
  }

  selectPatient(patientId: string): void {
    this.patientSelected.emit({ patientId });
  }
}
