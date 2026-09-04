import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AContentPresenter } from 'ui-framework';
import { PatientApiService, PatientOrder } from '../../patient-api.service';

/**
 * Zeigt einen einzelnen Auftrag innerhalb eines dynamischen Tabs.
 */
@Component({
  selector: 'app-order',
  standalone: true,
  templateUrl: './order.component.html',
  styleUrl: './order.component.scss'
})
export class OrderComponent extends AContentPresenter implements OnChanges, OnDestroy {
  @Input({ required: true }) patientId = '';
  @Input({ required: true }) caseId = '';
  @Input({ required: true }) RecordId = '';

  order?: PatientOrder;
  private loadSubscription?: Subscription;

  constructor(private readonly api: PatientApiService) {
    super('WebclientTool');
  }

  /**
   * Lädt den Auftrag erneut, sobald sich Patient, Fall oder RecordId ändern.
   */
  ngOnChanges(): void {
    this.loadSubscription?.unsubscribe();
    if (!this.patientId || !this.caseId || !this.RecordId) {
      this.order = undefined;
      return;
    }
    this.loadSubscription = this.api.getOrder(this.patientId, this.caseId, this.RecordId)
      .subscribe((order) => this.order = order);
  }

  /**
   * Beendet einen noch laufenden Detailabruf.
   */
  ngOnDestroy(): void {
    this.loadSubscription?.unsubscribe();
  }
}
