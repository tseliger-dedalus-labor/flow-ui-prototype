import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { PatientApiService, PatientFinding } from '../../patient-api.service';
import { finalize, Subscription } from 'rxjs';
import { AContentPresenter } from 'ui-framework';

/**
 * Zeigt den Inhalt eines ausgewählten Befunds an.
 */
@Component({
    selector: 'app-findings-panel',
    imports: [],
    templateUrl: './findings-panel.component.html',
    styleUrl: './findings-panel.component.scss'
})
export class FindingsPanelComponent extends AContentPresenter implements OnChanges, OnDestroy {
  @Input({ required: true }) patientId = '';
  @Input({ required: true }) caseId = '';
  @Input({ required: true }) RecordId = '';
  finding?: PatientFinding;
  private loadSubscription?: Subscription;

  constructor(private readonly api: PatientApiService) {
    super('WebclientTool');
  }

  /**
   * Lädt den ausgewählten Befund oder leert das Panel.
   */
  ngOnChanges(): void {
    this.loadSubscription?.unsubscribe();
    if (this.patientId && this.caseId && this.RecordId) {
      this.finding = undefined;
      this.loading = true;
      this.loadSubscription = this.api.getFinding(this.patientId, this.caseId, this.RecordId)
        .pipe(finalize(() => this.loading = false))
        .subscribe((finding) => this.finding = finding);
      return;
    }
    this.loading = false;
    this.finding = undefined;
  }

  /**
   * Beendet laufende Requests beim Zerstören des Panels.
   */
  ngOnDestroy(): void {
    this.loadSubscription?.unsubscribe();
  }
}
