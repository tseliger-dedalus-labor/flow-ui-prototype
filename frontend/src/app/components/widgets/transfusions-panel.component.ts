import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-transfusions-panel',
  standalone: true,
  imports: [CommonModule],
  template: '<article class="panel"><h3>Transfusionen</h3><ul><li *ngFor="let item of items">{{ item.text }}</li></ul></article>',
  styles: ['.panel { border:1px solid #d8d8d8; padding:.75rem; border-radius:.25rem; background:#fff; }']
})
export class TransfusionsPanelComponent implements OnChanges, OnDestroy {
  @Input() patientId = '';
  items: Array<{ id: string; text: string }> = [];
  private loadSubscription?: Subscription;

  constructor(private readonly api: ApiService) {}

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
