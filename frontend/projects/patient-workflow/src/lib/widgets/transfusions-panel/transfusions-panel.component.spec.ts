import { TestBed } from '@angular/core/testing';
import { PrtType } from 'flow-platform';
import { of } from 'rxjs';
import { PatientApiService } from '../../patient-api.service';
import { TransfusionsPanelComponent } from './transfusions-panel.component';

/** Testdoppel für das Laden von Transfusionsdaten. */
class ApiServiceMock {
  getRecords = jasmine.createSpy('getRecords').and.returnValue(of([
    {
      RecordID: 't-1', CaseID: '', PatientID: 'p-1', patientName: 'Test',
      text: 'T1', status: 'Dokumentiert', createdAt: '2026-09-06',
      prtType: PrtType.PRTTYPE_TRAFU
    },
    {
      RecordID: 't-2', CaseID: '', PatientID: 'p-2', patientName: 'Andere Person',
      text: 'T2', status: 'Dokumentiert', createdAt: '2026-09-06',
      prtType: PrtType.PRTTYPE_TRAFU
    }
  ]));
}

/**
 * Schützt das Transfusions-Panel als patientenbezogene Fachansicht.
 * Die Suite stellt sicher, dass Blutprodukte korrekt geladen werden und der Kontextwechsel
 * den sichtbaren Zustand vollständig leert.
 */
describe('TransfusionsPanelComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransfusionsPanelComponent],
      providers: [{ provide: PatientApiService, useClass: ApiServiceMock }]
    }).compileComponents();
  });

  it('clears transfusions when patientId becomes empty', () => {
    const fixture = TestBed.createComponent(TransfusionsPanelComponent);
    fixture.componentRef.setInput('patientId', 'p-1');
    fixture.detectChanges();
    expect(fixture.componentInstance.items.length).toBe(1);
    expect(TestBed.inject(PatientApiService).getRecords)
      .toHaveBeenCalledOnceWith([PrtType.PRTTYPE_TRAFU]);

    fixture.componentRef.setInput('patientId', '');
    fixture.detectChanges();
    // Ein leerer Patient-Kontext muss die vorherigen Transfusionsdaten entfernen.
    expect(fixture.componentInstance.items).toEqual([]);
  });
});
