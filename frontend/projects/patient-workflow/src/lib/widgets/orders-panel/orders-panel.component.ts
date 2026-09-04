import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { PatientApiService } from '../../patient-api.service';
import { Subscription } from 'rxjs';

/**
 * Zeigt Aufträge des aktuell selektierten Patienten an.
 */
@Component({
    selector: 'app-orders-panel',
    imports: [],
    templateUrl: './orders-panel.component.html',
    styleUrl: './orders-panel.component.scss'
})
export class OrdersPanelComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) patientId = '';
  items: Array<{ id: string; text: string }> = [];
  private loadSubscription?: Subscription;

  constructor(private readonly api: PatientApiService) {}

  /**
   * Lädt bei Patientwechsel die Auftragsliste oder leert das Panel.
   */
  ngOnChanges(): void {
    this.loadSubscription?.unsubscribe();
    if (this.patientId) {
      this.loadSubscription = this.api.getOrders(this.patientId).subscribe((data) => this.items = data);
      return;
    }
    this.items = [];
  }

  /**
   * Beendet laufende Requests beim Zerstören des Panels.
   */
  ngOnDestroy(): void {
    this.loadSubscription?.unsubscribe();
  }
}
