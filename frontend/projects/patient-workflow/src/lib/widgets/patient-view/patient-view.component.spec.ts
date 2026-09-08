import { TestBed } from '@angular/core/testing';
import { PrtType } from 'flow-platform';
import { of } from 'rxjs';
import { PatientApiService } from '../../patient-api.service';
import { PatientViewComponent } from './patient-view.component';

class ApiServiceMock {
  getRecords = jasmine.createSpy('getRecords').and.returnValue(of([
    {
      RecordID: 'O-1', CaseID: 'C-1', PatientID: 'p-1', patientName: 'Test',
      text: 'Laborauftrag', status: 'Offen', createdAt: '2026-09-04',
      prtType: PrtType.PRTTYPE_ORDER
    },
    {
      RecordID: 'F-1', CaseID: 'C-1', PatientID: 'p-1', patientName: 'Test',
      text: 'Laborbefund', status: 'Abgeschlossen', createdAt: '2026-09-05',
      prtType: PrtType.PRTTYPE_REPORT
    },
    {
      RecordID: 'O-2', CaseID: 'C-2', PatientID: 'p-1', patientName: 'Test',
      text: 'Anderer Fall', status: 'Offen', createdAt: '2026-09-04',
      prtType: PrtType.PRTTYPE_ORDER
    }
  ]));
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
    expect(fixture.nativeElement.textContent).not.toContain('Anderer Fall');
    expect(TestBed.inject(PatientApiService).getRecords).toHaveBeenCalledOnceWith([
      PrtType.PRTTYPE_ORDER,
      PrtType.PRTTYPE_REPORT
    ]);
    expect(orderSelected).toHaveBeenCalledOnceWith({ RecordId: 'O-1' });
    expect(findingSelected).toHaveBeenCalledOnceWith({ RecordId: 'F-1' });
  });
});
