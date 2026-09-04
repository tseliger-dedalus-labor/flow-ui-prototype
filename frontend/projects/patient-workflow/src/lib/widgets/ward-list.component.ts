import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { PatientApiService } from '../patient-api.service';

@Component({
    selector: 'app-ward-list',
    imports: [],
    template: `
    <h2>Stationsliste</h2>
    <ul class="cards">
      @for (ward of wards; track ward) {
        <li>
          <button type="button" (click)="selectWard(ward.id)">{{ ward.name }} ({{ ward.id }})</button>
        </li>
      }
    </ul>
    `,
    styles: ['.cards { list-style: none; padding: 0; } .cards button { width: 100%; text-align: left; margin-bottom: .5rem; padding: .75rem; }']
})
export class WardListComponent implements OnInit {
  @Output() readonly wardSelected = new EventEmitter<{ wardId: string }>();
  wards: Array<{ id: string; name: string }> = [];

  constructor(private readonly api: PatientApiService) {}

  ngOnInit(): void {
    this.api.getWards().subscribe((data) => this.wards = data);
  }

  selectWard(wardId: string): void {
    this.wardSelected.emit({ wardId });
  }
}
