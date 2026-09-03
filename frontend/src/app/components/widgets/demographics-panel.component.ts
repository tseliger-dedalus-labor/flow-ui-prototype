import { Component, Input, OnChanges, OnDestroy } from '@angular/core';

import { ApiService } from '../../services/api.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-demographics-panel',
    imports: [],
    template: '<article class="panel"><h3>Stammdaten</h3>@if (data) {<p>{{ data.name }} · {{ data.birthDate }}</p>}</article>',
    styles: ['.panel { border:1px solid #d8d8d8; padding:.75rem; border-radius:.25rem; background:#fff; }']
})
export class DemographicsPanelComponent implements OnChanges, OnDestroy {
  @Input() patientId = '';
  data?: { id: string; name: string; birthDate: string };
  private loadSubscription?: Subscription;

  constructor(private readonly api: ApiService) {}

  ngOnChanges(): void {
    this.loadSubscription?.unsubscribe();
    if (this.patientId) {
      this.loadSubscription = this.api.getPatient(this.patientId).subscribe((data) => this.data = data);
      return;
    }
    this.data = undefined;
  }

  ngOnDestroy(): void {
    this.loadSubscription?.unsubscribe();
  }
}
