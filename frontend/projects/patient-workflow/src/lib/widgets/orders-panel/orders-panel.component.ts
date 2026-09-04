import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { PatientApiService } from '../../patient-api.service';
import { Subscription } from 'rxjs';

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

  ngOnChanges(): void {
    this.loadSubscription?.unsubscribe();
    if (this.patientId) {
      this.loadSubscription = this.api.getOrders(this.patientId).subscribe((data) => this.items = data);
      return;
    }
    this.items = [];
  }

  ngOnDestroy(): void {
    this.loadSubscription?.unsubscribe();
  }
}
