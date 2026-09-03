import { Component, Input, OnChanges, OnDestroy } from '@angular/core';

import { ApiService } from '../../services/api.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-orders-panel',
    imports: [],
    template: '<article class="panel"><h3>Aufträge</h3><ul>@for (item of items; track item) {<li>{{ item.text }}</li>}</ul></article>',
    styles: ['.panel { border:1px solid #d8d8d8; padding:.75rem; border-radius:.25rem; background:#fff; }']
})
export class OrdersPanelComponent implements OnChanges, OnDestroy {
  @Input() patientId = '';
  items: Array<{ id: string; text: string }> = [];
  private loadSubscription?: Subscription;

  constructor(private readonly api: ApiService) {}

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
