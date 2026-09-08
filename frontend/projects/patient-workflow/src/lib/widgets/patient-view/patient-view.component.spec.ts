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
    const recordSelected = jasmine.createSpy('recordSelected');
    fixture.componentInstance.recordSelected.subscribe(recordSelected);
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
    expect(recordSelected).toHaveBeenCalledWith({
      RecordId: 'O-1',
      prtType: PrtType.PRTTYPE_ORDER
    });
    expect(recordSelected).toHaveBeenCalledWith({
      RecordId: 'F-1',
      prtType: PrtType.PRTTYPE_REPORT
    });
  });
});
