import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { FLOW_UI_API_BASE_URL } from './api-base-url';
import { ComponentDescriptor, FlowDefinition, FlowSummary, ValidationResult } from './models';

@Injectable({ providedIn: 'root' })
export class FlowApiService {
  constructor(
    private readonly http: HttpClient,
    @Inject(FLOW_UI_API_BASE_URL) private readonly baseUrl: string
  ) {}

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
}
