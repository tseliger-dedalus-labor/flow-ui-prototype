import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { PatientApiService } from '../../patient-api.service';
import { Subscription } from 'rxjs';

type PatientListMode = 'normal' | 'findings' | 'orders' | 'transfusions';

interface PatientSelectedEvent {
  patientId: string;
}

@Component({
    selector: 'app-patient-list',
    imports: [],
    templateUrl: './patient-list.component.html',
    styleUrl: './patient-list.component.scss'
})
export class PatientListComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) wardId = '';
  @Input({ required: true }) mode: PatientListMode = 'normal';
  @Output() readonly patientSelected = new EventEmitter<PatientSelectedEvent>();

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
