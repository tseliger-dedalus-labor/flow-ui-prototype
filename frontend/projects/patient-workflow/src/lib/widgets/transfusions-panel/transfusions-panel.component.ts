import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { PatientApiService } from '../../patient-api.service';
import { finalize, Subscription } from 'rxjs';
import { AContentPresenter } from 'ui-framework';

/**
 * Zeigt Transfusionseinträge des aktuell selektierten Patienten an.
 */
@Component({
    selector: 'app-transfusions-panel',
    imports: [],
    templateUrl: './transfusions-panel.component.html',
    styleUrl: './transfusions-panel.component.scss'
})
export class TransfusionsPanelComponent extends AContentPresenter implements OnChanges, OnDestroy {
  @Input({ required: true }) patientId = '';
  items: Array<{ id: string; text: string }> = [];
  private loadSubscription?: Subscription;

  constructor(private readonly api: PatientApiService) {
    super('WebclientTool');
  }

  /**
   * Lädt bei Patientwechsel die Transfusionsliste oder leert das Panel.
   */
  ngOnChanges(): void {
    this.loadSubscription?.unsubscribe();
    if (this.patientId) {
      this.loading = true;
      this.loadSubscription = this.api.getTransfusions(this.patientId)
        .pipe(finalize(() => this.loading = false))
        .subscribe((data) => this.items = data);
      return;
    }
    this.loading = false;
    this.items = [];
  }

  /**
   * Beendet laufende Requests beim Zerstören des Panels.
   */
  ngOnDestroy(): void {
    this.loadSubscription?.unsubscribe();
  }
}
