import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { PatientApiService } from '../../patient-api.service';

@Component({
    selector: 'app-ward-list',
    imports: [],
    templateUrl: './ward-list.component.html',
    styleUrl: './ward-list.component.scss'
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
