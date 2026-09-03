import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-findings-panel',
  standalone: true,
  imports: [CommonModule],
  template: '<article class="panel"><h3>Befunde</h3><ul><li *ngFor="let item of items">{{ item.text }}</li></ul></article>',
  styles: ['.panel { border:1px solid #d8d8d8; padding:.75rem; border-radius:.25rem; background:#fff; }']
})
export class FindingsPanelComponent implements OnChanges {
  @Input() patientId = '';
  items: Array<{ id: string; text: string }> = [];

  constructor(private readonly api: ApiService) {}

  ngOnChanges(): void {
    if (this.patientId) {
      this.api.getFindings(this.patientId).subscribe((data) => this.items = data);
    }
  }
}
