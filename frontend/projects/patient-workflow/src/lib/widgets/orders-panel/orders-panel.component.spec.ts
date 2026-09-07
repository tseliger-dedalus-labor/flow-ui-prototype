import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PatientApiService } from '../../patient-api.service';
import { OrdersPanelComponent } from './orders-panel.component';

/** Testdoppel für das Laden von Patientenaufträgen ohne Backend-Abhängigkeit. */
class ApiServiceMock {
  getOrder() {
    return of({
      RecordId: 'R-1',
      text: 'O1',
      status: 'Offen',
      createdAt: '2026-09-04'
    });
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
      providers: [
        { provide: PatientApiService, useClass: ApiServiceMock }
      ]
    }).compileComponents();
  });

  it('loads the selected order and clears it when its context becomes incomplete', () => {
    const fixture = TestBed.createComponent(OrdersPanelComponent);
    fixture.componentRef.setInput('patientId', 'p-1');
    fixture.componentRef.setInput('caseId', 'F-1');
    fixture.componentRef.setInput('RecordId', 'R-1');
    fixture.detectChanges();
    expect(fixture.componentInstance.order?.RecordId).toBe('R-1');
    expect(fixture.nativeElement.textContent).toContain('O1');

    fixture.componentRef.setInput('patientId', '');
    fixture.detectChanges();
    expect(fixture.componentInstance.order).toBeUndefined();
  });
});
