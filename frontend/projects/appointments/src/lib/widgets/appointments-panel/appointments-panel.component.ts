import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin, Subscription } from 'rxjs';
import { PermissionService } from 'flow-platform';
import { PatientApiService } from 'patient-workflow';
import { AContentPresenter } from 'ui-framework';
import { Appointment } from '../../appointment';
import { AppointmentsApiService } from '../../appointments-api.service';

/**
 * Zeigt Stations-Termine an und erlaubt bei ausreichender Berechtigung das Anlegen neuer Einträge.
 */
@Component({
  selector: 'app-appointments-panel',
  imports: [FormsModule],
  templateUrl: './appointments-panel.component.html',
  styleUrl: './appointments-panel.component.scss'
})
export class AppointmentsPanelComponent extends AContentPresenter implements OnChanges, OnDestroy {
  @Input({ required: true }) wardId = '';

  appointments: Appointment[] = [];
  patients: Array<{ id: string; name: string }> = [];
  draft = { patientId: '', date: '', time: '', reason: '' };
  private loadSubscription?: Subscription;
  private createSubscription?: Subscription;
  readonly canSchedule: boolean;

  constructor(
    private readonly appointmentsApi: AppointmentsApiService,
    private readonly patientApi: PatientApiService,
    permissions: PermissionService
  ) {
    super('AppointmentTool');
    this.canSchedule = permissions.hasAll(['APPOINTMENTS_WRITE']);
  }

  /**
   * Lädt bei Änderungen der Station sowohl bestehende Termine als auch auswählbare Patienten.
   */
  ngOnChanges(): void {
    this.loadSubscription?.unsubscribe();
    this.createSubscription?.unsubscribe();
    this.appointments = [];
    this.patients = [];
    this.draft = { patientId: '', date: '', time: '', reason: '' };
    if (!this.wardId) {
      this.loading = false;
      return;
    }
    this.loading = true;
    // Beide Datenquellen werden gemeinsam geladen, damit Formular und Liste stets denselben Stationskontext zeigen.
    this.loadSubscription = forkJoin({
      appointments: this.appointmentsApi.getAppointments(this.wardId),
      patients: this.patientApi.getPatients(this.wardId)
    }).pipe(finalize(() => this.loading = false)).subscribe(({ appointments, patients }) => {
      this.appointments = appointments;
      this.patients = patients;
      this.draft.patientId = patients[0]?.id ?? '';
    });
  }

  /**
   * Prüft, ob alle Pflichtfelder für einen neuen Termin befüllt sind.
   */
  isDraftComplete(): boolean {
    return Object.values(this.draft).every(Boolean);
  }

  /**
   * Persistiert den Entwurf und ergänzt die lokale Liste optimistisch mit der Serverantwort.
   */
  schedule(): void {
    if (!this.isDraftComplete()) {
      return;
    }
    this.createSubscription?.unsubscribe();
    this.createSubscription = this.appointmentsApi.createAppointment(this.wardId, this.draft).subscribe((appointment) => {
      this.appointments = [...this.appointments, appointment];
      this.draft = { patientId: this.patients[0]?.id ?? '', date: '', time: '', reason: '' };
    });
  }

  /**
   * Beendet laufende Requests beim Zerstören des Widgets.
   */
  ngOnDestroy(): void {
    this.loadSubscription?.unsubscribe();
    this.createSubscription?.unsubscribe();
  }
}
