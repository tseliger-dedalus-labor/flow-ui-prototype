import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { PatientApiService, PatientOrder } from '../../patient-api.service';
import { finalize, Subscription } from 'rxjs';
import { AContentPresenter } from 'ui-framework';

/**
 * Zeigt einen ausgewählten Auftrag des aktuellen Patientenfalls an.
 */
@Component({
    selector: 'app-orders-panel',
    imports: [],
    templateUrl: './orders-panel.component.html',
    styleUrl: './orders-panel.component.scss'
})
export class OrdersPanelComponent extends AContentPresenter implements OnChanges, OnDestroy {
  @Input({ required: true }) patientId = '';
  @Input({ required: true }) caseId = '';
  @Input({ required: true }) RecordId = '';

  order?: PatientOrder;
  private loadSubscription?: Subscription;

  constructor(private readonly api: PatientApiService) {
    super('WebclientTool');
  }

  /**
   * Lädt den ausgewählten Auftrag oder leert das Panel.
   */
  ngOnChanges(): void {
    this.loadSubscription?.unsubscribe();
    if (this.patientId && this.caseId && this.RecordId) {
      this.order = undefined;
      this.loading = true;
      this.loadSubscription = this.api.getOrder(this.patientId, this.caseId, this.RecordId)
        .pipe(finalize(() => this.loading = false))
        .subscribe((order) => this.order = order);
      return;
    }
    this.loading = false;
    this.order = undefined;
  }

  /**
   * Beendet laufende Requests beim Zerstören des Panels.
   */
  ngOnDestroy(): void {
    this.loadSubscription?.unsubscribe();
  }
}
