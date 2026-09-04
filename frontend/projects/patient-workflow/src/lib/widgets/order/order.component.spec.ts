import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PatientApiService } from '../../patient-api.service';
import { OrderComponent } from './order.component';

class ApiServiceMock {
  getOrder() {
    return of({
      RecordId: 'R-1',
      text: 'Laborauftrag',
      status: 'In Bearbeitung',
      createdAt: '2026-09-04'
    });
  }
}

/**
 * Schützt das Laden eines Auftrags über seinen RecordId.
 */
describe('OrderComponent', () => {
  it('loads the selected order', async () => {
    await TestBed.configureTestingModule({
      imports: [OrderComponent],
      providers: [{ provide: PatientApiService, useClass: ApiServiceMock }]
    }).compileComponents();
    const fixture = TestBed.createComponent(OrderComponent);
    fixture.componentRef.setInput('patientId', 'p-1');
    fixture.componentRef.setInput('caseId', 'F-1');
    fixture.componentRef.setInput('RecordId', 'R-1');

    fixture.detectChanges();

    expect(fixture.componentInstance.order?.RecordId).toBe('R-1');
  });
});
