import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { AContentPresenter } from 'ui-framework';
import { PatientApiService } from '../../patient-api.service';

/**
 * Listet Stationen auf und meldet die Auswahl an die Flow-Engine zurück.
 */
@Component({
    selector: 'app-ward-list-content',
    imports: [],
    templateUrl: './ward-list-content.component.html',
    styleUrl: './ward-list-content.component.scss'
})
export class WardListContentComponent extends AContentPresenter implements OnInit {
  @Output() readonly wardSelected = new EventEmitter<{ wardId: string }>();
  wards: Array<{ id: string; name: string }> = [];

  constructor(private readonly api: PatientApiService) {
    super('WebclientTool');
  }

  /**
   * Lädt die auswählbaren Stationen beim Initialisieren des Widgets.
   */
  ngOnInit(): void {
    this.api.getWards().subscribe((data) => this.wards = data);
  }

  /**
   * Meldet die Auswahl einer Station als standardisierte Flow-Payload.
   */
  selectWard(wardId: string): void {
    this.wardSelected.emit({ wardId });
  }
}
