import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { FLOW_UI_API_BASE_URL } from 'flow-platform';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PatientApiService {
  constructor(
    private readonly http: HttpClient,
    @Inject(FLOW_UI_API_BASE_URL) private readonly baseUrl: string
  ) {}

  getWards(): Observable<Array<{ id: string; name: string }>> {
    return this.http.get<Array<{ id: string; name: string }>>(`${this.baseUrl}/wards`);
  }

  getPatients(wardId: string): Observable<Array<{ id: string; name: string }>> {
    return this.http.get<Array<{ id: string; name: string }>>(`${this.baseUrl}/wards/${wardId}/patients`);
  }

  getPatient(patientId: string): Observable<{ id: string; name: string; birthDate: string }> {
    return this.http.get<{ id: string; name: string; birthDate: string }>(`${this.baseUrl}/patients/${patientId}`);
  }

  getFindings(patientId: string): Observable<Array<{ id: string; text: string }>> {
    return this.http.get<Array<{ id: string; text: string }>>(`${this.baseUrl}/patients/${patientId}/findings`);
  }

  getOrders(patientId: string): Observable<Array<{ id: string; text: string }>> {
    return this.http.get<Array<{ id: string; text: string }>>(`${this.baseUrl}/patients/${patientId}/orders`);
  }

  getTransfusions(patientId: string): Observable<Array<{ id: string; text: string }>> {
    return this.http.get<Array<{ id: string; text: string }>>(`${this.baseUrl}/patients/${patientId}/transfusions`);
  }
}
