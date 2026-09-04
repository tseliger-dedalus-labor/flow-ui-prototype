import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { PatientApiService } from '../../patient-api.service';
import { finalize, Subscription } from 'rxjs';
import { AContentPresenter } from 'ui-framework';

/**
 * Zeigt Stammdaten des aktuell selektierten Patienten an.
 */
@Component({
    selector: 'app-demographics-panel',
    imports: [],
    templateUrl: './demographics-panel.component.html',
    styleUrl: './demographics-panel.component.scss'
})
export class DemographicsPanelComponent extends AContentPresenter implements OnChanges, OnDestroy {
  @Input({ required: true }) patientId = '';
  @Input({ required: true }) caseId = '';
  data?: {
    id: string;
    name: string;
    birthDate: string;
    room: string;
    insurance: string;
  };
  private loadSubscription?: Subscription;

  constructor(private readonly api: PatientApiService) {
    super('WebclientTool');
  }

  /**
   * Lädt bei Patientwechsel die aktuellen Stammdaten oder leert das Panel.
   */
  ngOnChanges(): void {
    this.loadSubscription?.unsubscribe();
    if (this.patientId) {
      this.loading = true;
      this.loadSubscription = this.api.getPatient(this.patientId)
        .pipe(finalize(() => this.loading = false))
        .subscribe((data) => this.data = data);
      return;
    }
    this.loading = false;
    this.data = undefined;
  }

  /**
   * Beendet laufende Requests beim Zerstören des Panels.
   */
  ngOnDestroy(): void {
    this.loadSubscription?.unsubscribe();
  }
}
