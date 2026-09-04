import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PatientApiService } from '../../patient-api.service';
import { FindingsPanelComponent } from './findings-panel.component';

/** Testdoppel für das Laden patientenbezogener Befunde. */
class ApiServiceMock {
  getFindings() {
    return of([{ id: 'f-1', text: 'F1' }]);
  }
}

/**
 * Schützt das Befunde-Panel als fachliche Patientenansicht.
 * Die Suite stellt sicher, dass Befunde geladen und bei fehlendem Patienten-Kontext
 * keine veralteten Daten angezeigt werden.
 */
describe('FindingsPanelComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FindingsPanelComponent],
      providers: [{ provide: PatientApiService, useClass: ApiServiceMock }]
    }).compileComponents();
  });

  it('clears findings when patientId becomes empty', () => {
    const fixture = TestBed.createComponent(FindingsPanelComponent);
    fixture.componentRef.setInput('patientId', 'p-1');
    fixture.detectChanges();
    expect(fixture.componentInstance.items.length).toBe(1);

    fixture.componentRef.setInput('patientId', '');
    fixture.detectChanges();
    // Ein leerer Kontext muss alle vorherigen Befunde aus dem Panel entfernen.
    expect(fixture.componentInstance.items).toEqual([]);
  });
});
