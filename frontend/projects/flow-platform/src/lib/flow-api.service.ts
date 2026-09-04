import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FLOW_UI_API_BASE_URL } from './api-base-url';
import { ComponentDescriptor, FlowDefinition, FlowSummary, Tool, ValidationResult } from './models';

/**
 * Kapselt die HTTP-Grenze zum Flow-Backend und liefert bereits typisierte Domänenmodelle.
 */
@Injectable({ providedIn: 'root' })
export class FlowApiService {
  constructor(
    private readonly http: HttpClient,
    @Inject(FLOW_UI_API_BASE_URL) private readonly baseUrl: string
  ) {}

  /**
   * Lädt das vom Backend aggregierte Komponenten-Registry für Editor und Runtime.
   */
  getRegistry(): Observable<ComponentDescriptor[]> {
    return this.http.get<ComponentDescriptor[]>(`${this.baseUrl}/flow-registry`);
  }

  /**
   * Liefert die verfügbaren Flows für die Editor-Auswahl.
   */
  getFlows(tool?: Tool): Observable<FlowSummary[]> {
    const query = tool ? `?tool=${encodeURIComponent(tool)}` : '';
    return this.http.get<FlowSummary[]>(`${this.baseUrl}/flows${query}`);
  }

  /**
   * Lädt einen konkreten Flow für die Bearbeitung.
   */
  getFlow(id: string): Observable<FlowDefinition> {
    return this.http.get<FlowDefinition>(`${this.baseUrl}/flows/${id}`);
  }

  /**
   * Lädt den zur Laufzeit aktiven Flow inklusive serverseitiger Auflösung.
   */
  getEffectiveFlow(): Observable<FlowDefinition> {
    return this.http.get<FlowDefinition>(`${this.baseUrl}/flows/effective`);
  }

  /**
   * Persistiert einen im Editor bearbeiteten Flow unverändert an die Backend-API.
   */
  updateFlow(flow: FlowDefinition): Observable<FlowDefinition> {
    return this.http.put<FlowDefinition>(`${this.baseUrl}/flows/${flow.id}`, flow);
  }

  /**
   * Führt die serverseitige Flow-Validierung mit denselben Regeln wie beim Speichern aus.
   */
  validateFlow(flow: FlowDefinition): Observable<ValidationResult> {
    return this.http.post<ValidationResult>(`${this.baseUrl}/flows/${flow.id}/validate`, flow);
  }
}
