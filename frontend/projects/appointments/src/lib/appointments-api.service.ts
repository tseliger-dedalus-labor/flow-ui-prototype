import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { FLOW_UI_API_BASE_URL } from 'flow-platform';
import { Observable } from 'rxjs';
import { Appointment } from './appointment';

@Injectable({ providedIn: 'root' })
export class AppointmentsApiService {
  constructor(
    private readonly http: HttpClient,
    @Inject(FLOW_UI_API_BASE_URL) private readonly baseUrl: string
  ) {}

  getAppointments(wardId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.baseUrl}/wards/${wardId}/appointments`);
  }

  createAppointment(
    wardId: string,
    appointment: Pick<Appointment, 'patientId' | 'date' | 'time' | 'reason'>
  ): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.baseUrl}/wards/${wardId}/appointments`, appointment);
  }
}
