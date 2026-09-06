import { Component, EventEmitter, Output } from '@angular/core';
import { AContentPresenter } from 'ui-framework';

@Component({
  selector: 'laboratory-reportcenter',
  imports: [],
  template: '<p>Reportcenter</p>'
})
export class ReportcenterComponent extends AContentPresenter {
  @Output() readonly recordSelected = new EventEmitter<{ RecordID: string }>();

  constructor() {
    super('Reportcenter');
  }
}
