import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { FLOW_UI_API_BASE_URL } from 'flow-platform';
import { Observable } from 'rxjs';

/**
 * Kapselt alle lesenden Patient-Workflow-Endpunkte des Backends.
 */
@Injectable({ providedIn: 'root' })
export class PatientApiService {
  constructor(
    private readonly http: HttpClient,
    @Inject(FLOW_UI_API_BASE_URL) private readonly baseUrl: string
  ) {}

  /**
   * Lädt die auswählbaren Stationen.
   */
  getWards(): Observable<Array<{ id: string; name: string }>> {
    return this.http.get<Array<{ id: string; name: string }>>(`${this.baseUrl}/wards`);
  }

  /**
   * Lädt die Patienten einer Station für Listen- und Termin-Widgets.
   */
  getPatients(wardId: string): Observable<Array<{ id: string; name: string }>> {
    return this.http.get<Array<{ id: string; name: string }>>(`${this.baseUrl}/wards/${wardId}/patients`);
  }

  /**
   * Lädt die Stammdaten eines Patienten.
   */
  getPatient(patientId: string): Observable<{
    id: string;
    name: string;
    birthDate: string;
    room: string;
    caseNumber: string;
    insurance: string;
  }> {
    return this.http.get<{
      id: string;
      name: string;
      birthDate: string;
      room: string;
      caseNumber: string;
      insurance: string;
    }>(`${this.baseUrl}/patients/${patientId}`);
  }

  /**
   * Lädt die Befunde eines Patienten.
   */
  getFindings(patientId: string): Observable<Array<{ id: string; text: string }>> {
    return this.http.get<Array<{ id: string; text: string }>>(`${this.baseUrl}/patients/${patientId}/findings`);
  }

  /**
   * Lädt die Aufträge eines Patienten.
   */
  getOrders(patientId: string): Observable<Array<{ id: string; text: string }>> {
    return this.http.get<Array<{ id: string; text: string }>>(`${this.baseUrl}/patients/${patientId}/orders`);
  }

  /**
   * Lädt die Transfusionshistorie eines Patienten.
   */
  getTransfusions(patientId: string): Observable<Array<{ id: string; text: string }>> {
    return this.http.get<Array<{ id: string; text: string }>>(`${this.baseUrl}/patients/${patientId}/transfusions`);
  }
}
