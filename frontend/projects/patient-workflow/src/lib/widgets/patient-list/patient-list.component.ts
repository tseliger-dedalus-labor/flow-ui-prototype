import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { PatientApiService } from '../../patient-api.service';
import { Subscription } from 'rxjs';

/**
 * Steuert die fachliche Ausprägung der Patientenliste innerhalb verschiedener Flows.
 */
type PatientListMode = 'normal' | 'findings' | 'orders' | 'transfusions';

/**
 * Payload des Auswahl-Outputs für die Flow-Engine.
 */
interface PatientSelectedEvent {
  patientId: string;
}

/**
 * Listet Patienten einer Station auf und meldet die Auswahl an die Flow-Engine zurück.
 */
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

  /**
   * Lädt die Patientenliste neu, sobald Station oder Modus wechseln.
   */
  ngOnChanges(changes: SimpleChanges): void {
    this.loadSubscription?.unsubscribe();
    if ((changes['wardId'] || changes['mode']) && this.wardId) {
      this.loadSubscription = this.api.getPatients(this.wardId).subscribe((data) => this.patients = data);
      return;
    }
    this.patients = [];
  }

  /**
   * Meldet die Benutzerwahl als Flow-Output mit standardisierter Payload.
   */
  selectPatient(patientId: string): void {
    this.patientSelected.emit({ patientId });
  }

  /**
   * Beendet laufende Requests beim Zerstören der Liste.
   */
  ngOnDestroy(): void {
    this.loadSubscription?.unsubscribe();
  }
}
