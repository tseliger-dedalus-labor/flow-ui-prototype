import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { forkJoin, finalize, Subscription } from 'rxjs';
import { AContentPresenter } from 'ui-framework';
import { PatientApiService, PatientFinding, PatientOrder } from '../../patient-api.service';

/**
 * Listet alle Aufträge und Befunde des ausgewählten Patientenfalls.
 */
@Component({
  selector: 'app-patient-view',
  standalone: true,
  templateUrl: './patient-view.component.html',
  styleUrl: './patient-view.component.scss'
})
export class PatientViewComponent extends AContentPresenter implements OnChanges, OnDestroy {
  @Input({ required: true }) patientId = '';
  @Input({ required: true }) caseId = '';
  @Output() readonly orderSelected = new EventEmitter<{ RecordId: string }>();
  @Output() readonly findingSelected = new EventEmitter<{ RecordId: string }>();

  orders: PatientOrder[] = [];
  findings: PatientFinding[] = [];
  private loadSubscription?: Subscription;

  constructor(private readonly api: PatientApiService) {
    super('WebclientTool');
  }

  ngOnChanges(): void {
    this.loadSubscription?.unsubscribe();
    if (!this.patientId || !this.caseId) {
      this.loading = false;
      this.orders = [];
      this.findings = [];
      return;
    }
    this.orders = [];
    this.findings = [];
    this.loading = true;
    this.loadSubscription = forkJoin({
      orders: this.api.getOrders(this.patientId, this.caseId),
      findings: this.api.getFindings(this.patientId, this.caseId)
    })
      .pipe(finalize(() => this.loading = false))
      .subscribe(({ orders, findings }) => {
        this.orders = orders;
        this.findings = findings;
      });
  }

  ngOnDestroy(): void {
    this.loadSubscription?.unsubscribe();
  }
}
