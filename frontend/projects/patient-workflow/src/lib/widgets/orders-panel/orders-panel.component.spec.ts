import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PatientApiService } from '../../patient-api.service';
import { OrdersPanelComponent } from './orders-panel.component';

class ApiServiceMock {
  getOrders() {
    return of([{ id: 'o-1', text: 'O1' }]);
  }
}

describe('OrdersPanelComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdersPanelComponent],
      providers: [{ provide: PatientApiService, useClass: ApiServiceMock }]
    }).compileComponents();
  });

  it('clears orders when patientId becomes empty', () => {
    const fixture = TestBed.createComponent(OrdersPanelComponent);
    fixture.componentRef.setInput('patientId', 'p-1');
    fixture.detectChanges();
    expect(fixture.componentInstance.items.length).toBe(1);

    fixture.componentRef.setInput('patientId', '');
    fixture.detectChanges();
    expect(fixture.componentInstance.items).toEqual([]);
  });
});
