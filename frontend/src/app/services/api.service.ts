import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Appointment, ComponentDescriptor, FlowDefinition, FlowSummary, ValidationResult } from '../models';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getRegistry(): Observable<ComponentDescriptor[]> {
    return this.http.get<ComponentDescriptor[]>(`${this.baseUrl}/flow-registry`);
  }

  getFlows(): Observable<FlowSummary[]> {
    return this.http.get<FlowSummary[]>(`${this.baseUrl}/flows`);
  }

  getFlow(id: string): Observable<FlowDefinition> {
    return this.http.get<FlowDefinition>(`${this.baseUrl}/flows/${id}`);
  }

  getEffectiveFlow(): Observable<FlowDefinition> {
    return this.http.get<FlowDefinition>(`${this.baseUrl}/flows/effective`);
  }

  updateFlow(flow: FlowDefinition): Observable<FlowDefinition> {
    return this.http.put<FlowDefinition>(`${this.baseUrl}/flows/${flow.id}`, flow);
  }

  validateFlow(flow: FlowDefinition): Observable<ValidationResult> {
    return this.http.post<ValidationResult>(`${this.baseUrl}/flows/${flow.id}/validate`, flow);
  }

  getWards(): Observable<Array<{ id: string; name: string }>> {
    return this.http.get<Array<{ id: string; name: string }>>(`${this.baseUrl}/wards`);
  }

  getPatients(wardId: string): Observable<Array<{ id: string; name: string }>> {
    return this.http.get<Array<{ id: string; name: string }>>(`${this.baseUrl}/wards/${wardId}/patients`);
  }

  getPatient(patientId: string): Observable<{ id: string; name: string; birthDate: string }> {
    return this.http.get<{ id: string; name: string; birthDate: string }>(`${this.baseUrl}/patients/${patientId}`);
  }

  getAppointments(wardId: string): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(`${this.baseUrl}/wards/${wardId}/appointments`);
  }

  createAppointment(wardId: string, appointment: Pick<Appointment, 'patientId' | 'date' | 'time' | 'reason'>): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.baseUrl}/wards/${wardId}/appointments`, appointment);
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
