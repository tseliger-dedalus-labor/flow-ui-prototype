import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { PatientApiService } from '../../patient-api.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-demographics-panel',
    imports: [],
    templateUrl: './demographics-panel.component.html',
    styleUrl: './demographics-panel.component.scss'
})
export class DemographicsPanelComponent implements OnChanges, OnDestroy {
  @Input() patientId = '';
  data?: { id: string; name: string; birthDate: string };
  private loadSubscription?: Subscription;

  constructor(private readonly api: PatientApiService) {}

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
