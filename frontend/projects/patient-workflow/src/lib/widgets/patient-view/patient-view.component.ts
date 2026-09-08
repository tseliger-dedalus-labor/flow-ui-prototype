import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { finalize, Subscription } from 'rxjs';
import { PrtType } from 'flow-platform';
import { AContentPresenter } from 'ui-framework';
import { PatientApiService, PatientFinding, PatientOrder } from '../../patient-api.service';

/**
 * Listet alle Aufträge und Befunde des ausgewählten Patientenfalls.
 */
@Component({
  selector: 'app-patient-view',
  standalone: true,
  templateUrl: './patient-view.component.html',
  styleUrl: './patient-view.component.scss'
})
export class PatientViewComponent extends AContentPresenter implements OnChanges, OnDestroy {
  readonly prtType = PrtType;
  @Input({ required: true }) patientId = '';
  @Input({ required: true }) caseId = '';
  @Output() readonly recordSelected = new EventEmitter<{ RecordId: string; prtType: PrtType }>();

  orders: PatientOrder[] = [];
  findings: PatientFinding[] = [];
  private loadSubscription?: Subscription;

  constructor(private readonly api: PatientApiService) {
    super('WebclientTool');
  }

  openRecord(RecordId: string, prtType: PrtType): void {
    this.recordSelected.emit({ RecordId, prtType });
  }

  ngOnChanges(): void {
    this.loadSubscription?.unsubscribe();
    if (!this.patientId || !this.caseId) {
      this.loading = false;
      this.orders = [];
      this.findings = [];
      return;
    }
    this.orders = [];
    this.findings = [];
    this.loading = true;
    this.loadSubscription = this.api.getRecords([
      PrtType.PRTTYPE_ORDER,
      PrtType.PRTTYPE_REPORT
    ])
      .pipe(finalize(() => this.loading = false))
      .subscribe((records) => {
        const caseRecords = records.filter(record =>
          record.PatientID === this.patientId && record.CaseID === this.caseId
        );
        this.orders = caseRecords
          .filter(record => record.prtType === PrtType.PRTTYPE_ORDER)
          .map(record => ({
            RecordId: record.RecordID,
            text: record.text,
            status: record.status,
            createdAt: record.createdAt
          }));
        this.findings = caseRecords
          .filter(record => record.prtType === PrtType.PRTTYPE_REPORT)
          .map(record => ({
            RecordId: record.RecordID,
            text: record.text,
            createdAt: record.createdAt
          }));
      });
  }

  ngOnDestroy(): void {
    this.loadSubscription?.unsubscribe();
  }
}
