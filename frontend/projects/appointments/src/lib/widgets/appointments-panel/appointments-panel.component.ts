import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, Subscription } from 'rxjs';
import { PermissionService } from 'flow-platform';
import { PatientApiService } from 'patient-workflow';
import { Appointment } from '../../appointment';
import { AppointmentsApiService } from '../../appointments-api.service';

@Component({
  selector: 'app-appointments-panel',
  imports: [FormsModule],
  templateUrl: './appointments-panel.component.html',
  styleUrl: './appointments-panel.component.scss'
})
export class AppointmentsPanelComponent implements OnChanges, OnDestroy {
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
    this.canSchedule = permissions.hasAll(['APPOINTMENTS_WRITE']);
  }

  ngOnChanges(): void {
    this.loadSubscription?.unsubscribe();
    this.createSubscription?.unsubscribe();
    this.appointments = [];
    this.patients = [];
    this.draft = { patientId: '', date: '', time: '', reason: '' };
    if (!this.wardId) {
      return;
    }
    this.loadSubscription = forkJoin({
      appointments: this.appointmentsApi.getAppointments(this.wardId),
      patients: this.patientApi.getPatients(this.wardId)
    }).subscribe(({ appointments, patients }) => {
      this.appointments = appointments;
      this.patients = patients;
      this.draft.patientId = patients[0]?.id ?? '';
    });
  }

  isDraftComplete(): boolean {
    return Object.values(this.draft).every(Boolean);
  }

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

  ngOnDestroy(): void {
    this.loadSubscription?.unsubscribe();
    this.createSubscription?.unsubscribe();
  }
}
