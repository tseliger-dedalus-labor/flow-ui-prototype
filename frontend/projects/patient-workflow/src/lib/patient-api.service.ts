import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { FLOW_UI_API_BASE_URL } from 'flow-platform';
import { Observable } from 'rxjs';

/** Fall eines Patienten, der gemeinsam mit dem Patienten ausgewählt wird. */
export interface PatientCase {
  id: string;
}

/** Kompakter Patienteneintrag inklusive aller zugeordneten Fälle. */
export interface PatientSummary {
  id: string;
  name: string;
  cases: PatientCase[];
}

/** Auftragsdaten mit dem fachlich vorgegebenen Primärschlüssel. */
export interface PatientOrder {
  RecordId: string;
  text: string;
  status: string;
  createdAt: string;
}

/** Befunddaten eines Patientenfalls. */
export interface PatientFinding {
  RecordId: string;
  text: string;
  createdAt: string;
}

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
  getPatients(wardId: string): Observable<PatientSummary[]> {
    return this.http.get<PatientSummary[]>(`${this.baseUrl}/wards/${wardId}/patients`);
  }

  /**
   * Lädt die Stammdaten eines Patienten.
   */
  getPatient(patientId: string): Observable<{
    id: string;
    name: string;
    birthDate: string;
    room: string;
    insurance: string;
  }> {
    return this.http.get<{
      id: string;
      name: string;
      birthDate: string;
      room: string;
      insurance: string;
    }>(`${this.baseUrl}/patients/${patientId}`);
  }

  /**
   * Lädt die Befunde eines Patientenfalls.
   */
  getFindings(patientId: string, caseId: string): Observable<PatientFinding[]> {
    return this.http.get<PatientFinding[]>(
      `${this.baseUrl}/patients/${patientId}/cases/${caseId}/findings`
    );
  }

  /**
   * Lädt einen einzelnen Befund über seine RecordId.
   */
  getFinding(patientId: string, caseId: string, RecordId: string): Observable<PatientFinding> {
    return this.http.get<PatientFinding>(
      `${this.baseUrl}/patients/${patientId}/cases/${caseId}/findings/${RecordId}`
    );
  }

  /**
   * Lädt die Aufträge eines Patienten.
   */
  getOrders(patientId: string, caseId: string): Observable<PatientOrder[]> {
    return this.http.get<PatientOrder[]>(
      `${this.baseUrl}/patients/${patientId}/cases/${caseId}/orders`
    );
  }

  /**
   * Lädt einen einzelnen Auftrag über seinen RecordId.
   */
  getOrder(patientId: string, caseId: string, RecordId: string): Observable<PatientOrder> {
    return this.http.get<PatientOrder>(
      `${this.baseUrl}/patients/${patientId}/cases/${caseId}/orders/${RecordId}`
    );
  }

  /**
   * Lädt die Transfusionshistorie eines Patienten.
   */
  getTransfusions(patientId: string): Observable<Array<{ id: string; text: string }>> {
    return this.http.get<Array<{ id: string; text: string }>>(`${this.baseUrl}/patients/${patientId}/transfusions`);
  }
}
