import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { finalize, Subscription } from 'rxjs';
import { AContentPresenter } from 'ui-framework';
import { PrtType, ViewRouterService } from 'flow-platform';
import { ReportcenterApiService, ReportcenterRecord } from '../../reportcenter-api.service';

const SHARE_SCOPE = 'reportcenter-selection';

interface ReportcenterShareState {
  recordIds: string[];
}

@Component({
  selector: 'laboratory-reportcenter',
  imports: [],
  templateUrl: './reportcenter.component.html',
  styleUrl: './reportcenter.component.scss'
})
export class ReportcenterComponent extends AContentPresenter implements OnInit, OnDestroy {
  @Output() readonly recordSelected = new EventEmitter<{
    RecordID: string;
  }>();

  records: ReportcenterRecord[] = [];
  selectedRecordIds = new Set<string>();
  validationLink = '';
  linkError = '';
  private loadSubscription?: Subscription;

  constructor(
    private readonly api: ReportcenterApiService,
    private readonly viewRouter: ViewRouterService
  ) {
    super('ReportcenterTool');
  }

  ngOnInit(): void {
    this.loading = true;
    this.loadSubscription = this.api.getRecords()
      .pipe(finalize(() => this.loading = false))
      .subscribe((records) => {
        this.records = records;
        const restored = this.viewRouter.read(SHARE_SCOPE);
        if (isReportcenterShareState(restored)) {
          const available = new Set(records.map((record) => record.RecordID));
          this.selectedRecordIds = new Set(restored.recordIds.filter((id) => available.has(id)));
        }
      });
  }

  toggleRecord(recordId: string, selected: boolean): void {
    if (selected) {
      this.selectedRecordIds.add(recordId);
    } else {
      this.selectedRecordIds.delete(recordId);
    }
    this.validationLink = '';
    this.linkError = '';
  }

  createValidationLink(): void {
    this.linkError = '';
    const state: ReportcenterShareState = { recordIds: [...this.selectedRecordIds].sort() };
    this.viewRouter.write(SHARE_SCOPE, state).then(
      (url) => this.validationLink = new URL(url, globalThis.location.origin).href,
      () => this.linkError = 'Der Link konnte nicht erstellt werden.'
    );
  }

  openRecord(record: ReportcenterRecord): void {
    this.recordSelected.emit({
      RecordID: record.RecordID
    });
  }

  recordTypeLabel(prtType: PrtType): string {
    switch (prtType) {
      case PrtType.PRTTYPE_ORDER:
        return 'Auftrag';
      case PrtType.PRTTYPE_REPORT:
        return 'Befund';
      case PrtType.PRTTYPE_DOCUMENT:
        return 'Dokument';
      case PrtType.PRTTYPE_TRAFU:
        return 'Transfusion';
      case PrtType.PRTTYPE_NONE:
        return 'Keine Angabe';
    }
  }

  ngOnDestroy(): void {
    this.loadSubscription?.unsubscribe();
  }
}

function isReportcenterShareState(value: unknown): value is ReportcenterShareState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const recordIds = (value as Record<string, unknown>)['recordIds'];
  return Array.isArray(recordIds) && recordIds.every((id: unknown) => typeof id === 'string');
}
