import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, Subscription } from 'rxjs';
import { Appointment } from '../../models';
import { ApiService } from '../../services/api.service';
import { PermissionService } from '../../services/permission.service';

@Component({
  selector: 'app-appointments-panel',
  imports: [FormsModule],
  template: `
    <section>
      <h2>Terminplanung</h2>
      @if (!wardId) {
        <p class="hint">Bitte zuerst eine Station wählen.</p>
      } @else {
        @if (canSchedule) {
          <form (ngSubmit)="schedule()">
            <label>Patient
              <select name="patientId" [(ngModel)]="draft.patientId" required>
                @for (patient of patients; track patient.id) {
                  <option [value]="patient.id">{{ patient.name }}</option>
                }
              </select>
            </label>
            <label>Datum <input name="date" type="date" [(ngModel)]="draft.date" required /></label>
            <label>Uhrzeit <input name="time" type="time" [(ngModel)]="draft.time" required /></label>
            <label>Grund <input name="reason" [(ngModel)]="draft.reason" required /></label>
            <button type="submit" [disabled]="!isDraftComplete()">Termin anlegen</button>
          </form>
        }
        <ul class="appointments">
          @for (appointment of appointments; track appointment.id) {
            <li>
              <strong>{{ appointment.date }} · {{ appointment.time }}</strong>
              <span>{{ appointment.patientName }}</span>
              <span>{{ appointment.reason }}</span>
            </li>
          } @empty {
            <li>Keine Termine für diese Station.</li>
          }
        </ul>
      }
    </section>
  `,
  styles: [`
    form { display: grid; grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr)); gap: .75rem; align-items: end; margin-bottom: 1rem; }
    label { display: grid; gap: .25rem; }
    input, select, button { padding: .5rem; }
    .appointments { list-style: none; padding: 0; display: grid; gap: .5rem; }
    .appointments li { display: grid; grid-template-columns: 10rem 1fr 1fr; gap: .75rem; border: 1px solid #d8d8d8; padding: .75rem; }
    .hint { color: #666; }
  `]
})
export class AppointmentsPanelComponent implements OnChanges, OnDestroy {
  @Input() wardId = '';

  appointments: Appointment[] = [];
  patients: Array<{ id: string; name: string }> = [];
  draft = { patientId: '', date: '', time: '', reason: '' };
  private loadSubscription?: Subscription;
  private createSubscription?: Subscription;
  readonly canSchedule: boolean;

  constructor(private readonly api: ApiService, permissions: PermissionService) {
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
      appointments: this.api.getAppointments(this.wardId),
      patients: this.api.getPatients(this.wardId)
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
    this.createSubscription = this.api.createAppointment(this.wardId, this.draft).subscribe((appointment) => {
      this.appointments = [...this.appointments, appointment];
      this.draft = { patientId: this.patients[0]?.id ?? '', date: '', time: '', reason: '' };
    });
  }

  ngOnDestroy(): void {
    this.loadSubscription?.unsubscribe();
    this.createSubscription?.unsubscribe();
  }
}
