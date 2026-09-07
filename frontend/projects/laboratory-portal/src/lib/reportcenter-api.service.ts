import { HttpClient } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { FLOW_UI_API_BASE_URL } from 'flow-platform';
import { Observable } from 'rxjs';

export interface ReportcenterRecord {
  RecordID: string;
  CaseID: string;
  PatientID: string;
  patientName: string;
  text: string;
  status: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ReportcenterApiService {
  constructor(
    private readonly http: HttpClient,
    @Inject(FLOW_UI_API_BASE_URL) private readonly baseUrl: string
  ) {}

  getRecords(): Observable<ReportcenterRecord[]> {
    return this.http.get<ReportcenterRecord[]>(`${this.baseUrl}/records`);
  }
}
