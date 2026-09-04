import { Component, EventEmitter, Inject, Input, OnChanges, OnDestroy, Optional, Output } from '@angular/core';
import { FlowTabService } from 'flow-platform';
import { PatientApiService, PatientOrder } from '../../patient-api.service';
import { Subscription } from 'rxjs';
import { AContentPresenter } from 'ui-framework';

/**
 * Zeigt Aufträge des aktuell selektierten Patienten an.
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
  @Output() readonly orderSelected = new EventEmitter<{ RecordId: string }>();

  items: PatientOrder[] = [];
  private loadSubscription?: Subscription;

  constructor(
    private readonly api: PatientApiService,
    @Optional() @Inject(FlowTabService) private readonly tabs: FlowTabService | null
  ) {
    super('WebclientTool');
  }

  /**
   * Lädt bei Patientwechsel die Auftragsliste oder leert das Panel.
   */
  ngOnChanges(): void {
    this.loadSubscription?.unsubscribe();
    if (this.patientId && this.caseId) {
      this.loadSubscription = this.api.getOrders(this.patientId, this.caseId)
        .subscribe((data) => this.items = data);
      return;
    }
    this.items = [];
  }

  /**
   * Meldet den Auftrag als Output und öffnet ihn im umgebenden TabPanel.
   */
  openOrder(order: PatientOrder): void {
    this.orderSelected.emit({ RecordId: order.RecordId });
    this.tabs?.open({
      key: `order:${this.caseId}:${order.RecordId}`,
      title: `Auftrag ${order.RecordId}`,
      node: {
        id: `order-${this.caseId}-${order.RecordId}`,
        componentId: 'order-view',
        inputBindings: {
          patientId: { source: 'STATIC', staticValue: this.patientId },
          caseId: { source: 'STATIC', staticValue: this.caseId },
          RecordId: { source: 'STATIC', staticValue: order.RecordId }
        },
        children: [],
        transitions: []
      }
    });
  }

  /**
   * Beendet laufende Requests beim Zerstören des Panels.
   */
  ngOnDestroy(): void {
    this.loadSubscription?.unsubscribe();
  }
}
