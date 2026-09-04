import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { PatientApiService, PatientSummary } from '../../patient-api.service';
import { Subscription } from 'rxjs';
import { ASidebarPresenter } from 'ui-framework';

/**
 * Steuert die fachliche Ausprägung der Patientenliste innerhalb verschiedener Flows.
 */
type PatientListMode = 'normal' | 'findings' | 'orders' | 'transfusions';

/**
 * Payload des Auswahl-Outputs für die Flow-Engine.
 */
interface PatientSelectedEvent {
  patientId: string;
  caseId: string;
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
export class PatientListSidebarComponent extends ASidebarPresenter implements OnChanges, OnDestroy {
  @Input({ required: true }) wardId = '';
  @Input({ required: true }) mode: PatientListMode = 'normal';
  @Output() readonly patientSelected = new EventEmitter<PatientSelectedEvent>();

  patients: PatientSummary[] = [];
  private loadSubscription?: Subscription;

  constructor(private readonly api: PatientApiService) {
    super('WebclientTool');
  }

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
  selectPatient(patientId: string, caseId: string): void {
    this.patientSelected.emit({ patientId, caseId });
  }

  /**
   * Beendet laufende Requests beim Zerstören der Liste.
   */
  ngOnDestroy(): void {
    this.loadSubscription?.unsubscribe();
  }
}
