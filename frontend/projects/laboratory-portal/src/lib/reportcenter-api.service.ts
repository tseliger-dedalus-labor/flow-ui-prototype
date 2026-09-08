import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { FLOW_UI_API_BASE_URL, PrtType } from 'flow-platform';
import { Observable } from 'rxjs';

export interface ReportcenterRecord {
  RecordID: string;
  CaseID: string;
  PatientID: string;
  patientName: string;
  text: string;
  status: string;
  createdAt: string;
  prtType: PrtType;
}

@Injectable({ providedIn: 'root' })
export class ReportcenterApiService {
  constructor(
    private readonly http: HttpClient,
    @Inject(FLOW_UI_API_BASE_URL) private readonly baseUrl: string
  ) {}

  getRecords(prtTypes: PrtType[] = []): Observable<ReportcenterRecord[]> {
    let params = new HttpParams();
    for (const prtType of prtTypes) {
      params = params.append('prtType', prtType);
    }
    return this.http.get<ReportcenterRecord[]>(`${this.baseUrl}/records`, { params });
  }
}
