import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { PrtType } from 'flow-platform';
import { PatientApiService, PatientRecord } from '../../patient-api.service';
import { finalize, Subscription } from 'rxjs';
import { AContentPresenter } from 'ui-framework';

/**
 * Zeigt Transfusionseinträge des aktuell selektierten Patienten an.
 */
@Component({
    selector: 'app-transfusions-panel',
    imports: [],
    templateUrl: './transfusions-panel.component.html',
    styleUrl: './transfusions-panel.component.scss'
})
export class TransfusionsPanelComponent extends AContentPresenter implements OnChanges, OnDestroy {
  @Input({ required: true }) patientId = '';
  @Input() RecordId = '';
  items: PatientRecord[] = [];
  private loadSubscription?: Subscription;

  constructor(private readonly api: PatientApiService) {
    super('WebclientTool');
  }

  /**
   * Lädt bei Patientwechsel die Transfusionsliste oder leert das Panel.
   */
  ngOnChanges(): void {
    this.loadSubscription?.unsubscribe();
    if (this.patientId) {
      this.loading = true;
      this.loadSubscription = this.api.getRecords([PrtType.PRTTYPE_TRAFU])
        .pipe(finalize(() => this.loading = false))
        .subscribe((records) => {
          this.items = records.filter(record =>
            record.PatientID === this.patientId
              && (!this.RecordId || record.RecordID === this.RecordId)
          );
        });
      return;
    }
    this.loading = false;
    this.items = [];
  }

  /**
   * Beendet laufende Requests beim Zerstören des Panels.
   */
  ngOnDestroy(): void {
    this.loadSubscription?.unsubscribe();
  }
}
