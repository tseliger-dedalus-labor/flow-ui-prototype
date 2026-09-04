import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PatientApiService } from '../../patient-api.service';
import { TransfusionsPanelComponent } from './transfusions-panel.component';

/** Testdoppel für das Laden von Transfusionsdaten. */
class ApiServiceMock {
  getTransfusions() {
    return of([{ id: 't-1', text: 'T1' }]);
  }
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

    fixture.componentRef.setInput('patientId', '');
    fixture.detectChanges();
    // Ein leerer Patient-Kontext muss die vorherigen Transfusionsdaten entfernen.
    expect(fixture.componentInstance.items).toEqual([]);
  });
});
