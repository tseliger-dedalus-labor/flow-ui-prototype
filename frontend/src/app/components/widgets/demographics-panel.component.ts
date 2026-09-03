import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-demographics-panel',
  standalone: true,
  imports: [CommonModule],
  template: '<article class="panel"><h3>Stammdaten</h3><p *ngIf="data">{{ data.name }} · {{ data.birthDate }}</p></article>',
  styles: ['.panel { border:1px solid #d8d8d8; padding:.75rem; border-radius:.25rem; background:#fff; }']
})
export class DemographicsPanelComponent implements OnChanges {
  @Input() patientId = '';
  data?: { id: string; name: string; birthDate: string };

  constructor(private readonly api: ApiService) {}

  ngOnChanges(): void {
    if (this.patientId) {
      this.api.getPatient(this.patientId).subscribe((data) => this.data = data);
    }
  }
}
