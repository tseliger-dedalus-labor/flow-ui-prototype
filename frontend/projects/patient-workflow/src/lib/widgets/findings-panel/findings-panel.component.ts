import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { PatientApiService } from '../../patient-api.service';
import { Subscription } from 'rxjs';
import { AContentPresenter } from 'ui-framework';

/**
 * Zeigt Befunde des aktuell selektierten Patienten an.
 */
@Component({
    selector: 'app-findings-panel',
    imports: [],
    templateUrl: './findings-panel.component.html',
    styleUrl: './findings-panel.component.scss'
})
export class FindingsPanelComponent extends AContentPresenter implements OnChanges, OnDestroy {
  @Input({ required: true }) patientId = '';
  items: Array<{ id: string; text: string }> = [];
  private loadSubscription?: Subscription;

  constructor(private readonly api: PatientApiService) {
    super('WebclientTool');
  }

  /**
   * Lädt bei Patientwechsel die Befundliste oder leert das Panel.
   */
  ngOnChanges(): void {
    this.loadSubscription?.unsubscribe();
    if (this.patientId) {
      this.loadSubscription = this.api.getFindings(this.patientId).subscribe((data) => this.items = data);
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
