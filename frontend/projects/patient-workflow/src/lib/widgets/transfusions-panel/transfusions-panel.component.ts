import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { PatientApiService } from '../../patient-api.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-transfusions-panel',
    imports: [],
    templateUrl: './transfusions-panel.component.html',
    styleUrl: './transfusions-panel.component.scss'
})
export class TransfusionsPanelComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) patientId = '';
  items: Array<{ id: string; text: string }> = [];
  private loadSubscription?: Subscription;

  constructor(private readonly api: PatientApiService) {}

  ngOnChanges(): void {
    this.loadSubscription?.unsubscribe();
    if (this.patientId) {
      this.loadSubscription = this.api.getTransfusions(this.patientId).subscribe((data) => this.items = data);
      return;
    }
    this.items = [];
  }

  ngOnDestroy(): void {
    this.loadSubscription?.unsubscribe();
  }
}
