import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PrtType, ViewRouterService } from 'flow-platform';
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
    createdAt: '2026-09-07',
    prtType: PrtType.PRTTYPE_ORDER
  },
  {
    RecordID: 'FND-p-200-F-2-001',
    CaseID: 'F-2',
    PatientID: 'p-200',
    patientName: 'Erik Stern',
    text: 'Sonografie',
    status: 'Abgeschlossen',
    createdAt: '2026-09-08',
    prtType: PrtType.PRTTYPE_REPORT
  },
  {
    RecordID: 'p-200-t-1',
    CaseID: '',
    PatientID: 'p-200',
    patientName: 'Erik Stern',
    text: 'EK-Konserve',
    status: 'Dokumentiert',
    createdAt: '2026-09-08',
    prtType: PrtType.PRTTYPE_TRAFU
  }
];

class ApiServiceMock {
  getRecords = jasmine.createSpy('getRecords').and.returnValue(of(records));
}

class ViewRouterServiceMock {
  state: unknown;
  writes: unknown[] = [];

  read() { return this.state; }
  write(_scope: string, state: unknown) {
    this.writes.push(state);
    return Promise.resolve('/reportcenter?view=signed');
  }
}

describe('ReportcenterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportcenterComponent],
      providers: [
        { provide: ReportcenterApiService, useClass: ApiServiceMock },
        { provide: ViewRouterService, useClass: ViewRouterServiceMock }
      ]
    }).compileComponents();
  });

  it('renders all records', () => {
    const fixture = TestBed.createComponent(ReportcenterComponent);

    fixture.detectChanges();

    expect(TestBed.inject(ReportcenterApiService).getRecords).toHaveBeenCalledOnceWith();
    expect(fixture.nativeElement.textContent).toContain('ORD-p-100-F-1-001');
    expect(fixture.nativeElement.textContent).toContain('FND-p-200-F-2-001');
    expect(fixture.nativeElement.textContent).toContain('p-200-t-1');
    expect(fixture.nativeElement.textContent).toContain('Anna Weber');
    expect(fixture.nativeElement.textContent).toContain('Auftrag');
    expect(fixture.nativeElement.textContent).toContain('Befund');
    expect(fixture.nativeElement.textContent).toContain('Transfusion');
  });

  it('emits only the record identifier for server-side enrichment', () => {
    const fixture = TestBed.createComponent(ReportcenterComponent);
    const selected = jasmine.createSpy('selected');
    fixture.componentInstance.recordSelected.subscribe(selected);
    fixture.detectChanges();

    fixture.componentInstance.openRecord(records[0]);

    expect(selected).toHaveBeenCalledOnceWith({
      RecordID: 'ORD-p-100-F-1-001'
    });
  });

  it('creates a shareable view state for multiple selected records', async () => {
    const fixture = TestBed.createComponent(ReportcenterComponent);
    const viewRouter = TestBed.inject(ViewRouterService) as unknown as ViewRouterServiceMock;
    fixture.detectChanges();

    fixture.componentInstance.toggleRecord(records[1].RecordID, true);
    fixture.componentInstance.toggleRecord(records[0].RecordID, true);
    fixture.componentInstance.createValidationLink();
    await fixture.whenStable();

    expect(viewRouter.writes).toEqual([{
      recordIds: ['FND-p-200-F-2-001', 'ORD-p-100-F-1-001']
    }]);
    expect(fixture.componentInstance.validationLink).toContain('view=signed');
  });

  it('restores only record identifiers that are still available', () => {
    const viewRouter = TestBed.inject(ViewRouterService) as unknown as ViewRouterServiceMock;
    viewRouter.state = {
      recordIds: ['FND-p-200-F-2-001', 'missing-record']
    };
    const fixture = TestBed.createComponent(ReportcenterComponent);

    fixture.detectChanges();

    expect([...fixture.componentInstance.selectedRecordIds]).toEqual(['FND-p-200-F-2-001']);
  });
});
