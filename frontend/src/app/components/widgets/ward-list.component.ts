import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
    selector: 'app-ward-list',
    imports: [CommonModule],
    template: `
    <h2>Stationsliste</h2>
    <ul class="cards">
      <li *ngFor="let ward of wards">
        <button type="button" (click)="selectWard(ward.id)">{{ ward.name }} ({{ ward.id }})</button>
      </li>
    </ul>
  `,
    styles: ['.cards { list-style: none; padding: 0; } .cards button { width: 100%; text-align: left; margin-bottom: .5rem; padding: .75rem; }']
})
export class WardListComponent implements OnInit {
  @Output() readonly wardSelected = new EventEmitter<{ wardId: string }>();
  wards: Array<{ id: string; name: string }> = [];

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.api.getWards().subscribe((data) => this.wards = data);
  }

  selectWard(wardId: string): void {
    this.wardSelected.emit({ wardId });
  }
}
