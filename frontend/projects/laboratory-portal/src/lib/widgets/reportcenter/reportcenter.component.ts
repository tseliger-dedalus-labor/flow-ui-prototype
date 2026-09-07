import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { finalize, Subscription } from 'rxjs';
import { AContentPresenter } from 'ui-framework';
import { ReportcenterApiService, ReportcenterRecord } from '../../reportcenter-api.service';

@Component({
  selector: 'laboratory-reportcenter',
  imports: [],
  templateUrl: './reportcenter.component.html',
  styleUrl: './reportcenter.component.scss'
})
export class ReportcenterComponent extends AContentPresenter implements OnInit, OnDestroy {
  @Output() readonly recordSelected = new EventEmitter<{
    RecordID: string;
    CaseID: string;
    PatientID: string;
  }>();

  records: ReportcenterRecord[] = [];
  private loadSubscription?: Subscription;

  constructor(private readonly api: ReportcenterApiService) {
    super('ReportcenterTool');
  }

  ngOnInit(): void {
    this.loading = true;
    this.loadSubscription = this.api.getRecords()
      .pipe(finalize(() => this.loading = false))
      .subscribe((records) => this.records = records);
  }

  openRecord(record: ReportcenterRecord): void {
    this.recordSelected.emit({
      RecordID: record.RecordID,
      CaseID: record.CaseID,
      PatientID: record.PatientID
    });
  }

  ngOnDestroy(): void {
    this.loadSubscription?.unsubscribe();
  }
}
