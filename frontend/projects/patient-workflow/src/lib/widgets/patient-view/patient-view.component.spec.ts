import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PatientApiService } from '../../patient-api.service';
import { PatientViewComponent } from './patient-view.component';

class ApiServiceMock {
  getOrders() {
    return of([{ RecordId: 'O-1', text: 'Laborauftrag', status: 'Offen', createdAt: '2026-09-04' }]);
  }

  getFindings() {
    return of([{ RecordId: 'F-1', text: 'Laborbefund', createdAt: '2026-09-05' }]);
  }
}

describe('PatientViewComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientViewComponent],
      providers: [{ provide: PatientApiService, useClass: ApiServiceMock }]
    }).compileComponents();
  });

  it('lists all case orders and findings and emits their RecordIds', () => {
    const fixture = TestBed.createComponent(PatientViewComponent);
    const orderSelected = jasmine.createSpy('orderSelected');
    const findingSelected = jasmine.createSpy('findingSelected');
    fixture.componentInstance.orderSelected.subscribe(orderSelected);
    fixture.componentInstance.findingSelected.subscribe(findingSelected);
    fixture.componentRef.setInput('patientId', 'p-1');
    fixture.componentRef.setInput('caseId', 'C-1');

    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    buttons[0].click();
    buttons[1].click();

    expect(fixture.nativeElement.textContent).toContain('Laborauftrag');
    expect(fixture.nativeElement.textContent).toContain('Laborbefund');
    expect(orderSelected).toHaveBeenCalledOnceWith({ RecordId: 'O-1' });
    expect(findingSelected).toHaveBeenCalledOnceWith({ RecordId: 'F-1' });
  });
});
