import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PatientApiService } from '../../patient-api.service';
import { OrdersPanelComponent } from './orders-panel.component';

/** Testdoppel für das Laden von Patientenaufträgen ohne Backend-Abhängigkeit. */
class ApiServiceMock {
  getOrders() {
    return of([{ id: 'o-1', text: 'O1' }]);
  }
}

/**
 * Schützt das Anordnungs-Panel als patientenbezogene Fachansicht.
 * Die Suite stellt sicher, dass Bestellungen geladen und beim Verlassen des Patienten
 * wieder vollständig geleert werden.
 */
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
    // Ohne Patient darf kein alter Auftragsstand im UI verbleiben.
    expect(fixture.componentInstance.items).toEqual([]);
  });
});
