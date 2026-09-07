import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ReportcenterApiService, ReportcenterRecord } from '../../reportcenter-api.service';
import { ReportcenterComponent } from './reportcenter.component';

const records: ReportcenterRecord[] = [
  {
    RecordID: 'ORD-p-100-F-1-001',
    CaseID: 'F-1',
    PatientID: 'p-100',
    patientName: 'Anna Weber',
    text: 'Kleines Blutbild',
    status: 'Offen',
    createdAt: '2026-09-07'
  },
  {
    RecordID: 'ORD-p-200-F-2-001',
    CaseID: 'F-2',
    PatientID: 'p-200',
    patientName: 'Erik Stern',
    text: 'Sonografie',
    status: 'Geplant',
    createdAt: '2026-09-08'
  }
];

class ApiServiceMock {
  getRecords = jasmine.createSpy('getRecords').and.returnValue(of(records));
}

describe('ReportcenterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportcenterComponent],
      providers: [{ provide: ReportcenterApiService, useClass: ApiServiceMock }]
    }).compileComponents();
  });

  it('renders all records', () => {
    const fixture = TestBed.createComponent(ReportcenterComponent);

    fixture.detectChanges();

    expect(TestBed.inject(ReportcenterApiService).getRecords).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('ORD-p-100-F-1-001');
    expect(fixture.nativeElement.textContent).toContain('ORD-p-200-F-2-001');
    expect(fixture.nativeElement.textContent).toContain('Anna Weber');
  });

  it('emits record, case and patient identifiers for navigation', () => {
    const fixture = TestBed.createComponent(ReportcenterComponent);
    const selected = jasmine.createSpy('selected');
    fixture.componentInstance.recordSelected.subscribe(selected);
    fixture.detectChanges();

    fixture.componentInstance.openRecord(records[0]);

    expect(selected).toHaveBeenCalledOnceWith({
      RecordID: 'ORD-p-100-F-1-001',
      CaseID: 'F-1',
      PatientID: 'p-100'
    });
  });
});
