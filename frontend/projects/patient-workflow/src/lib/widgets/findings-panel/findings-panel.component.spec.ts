import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PatientApiService } from '../../patient-api.service';
import { FindingsPanelComponent } from './findings-panel.component';

/** Testdoppel für das Laden patientenbezogener Befunde. */
class ApiServiceMock {
  getFinding() {
    return of({ RecordId: 'F-1', text: 'Befundinhalt', createdAt: '2026-09-04' });
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

  it('shows the selected finding content and clears it when its context becomes incomplete', () => {
    const fixture = TestBed.createComponent(FindingsPanelComponent);
    fixture.componentRef.setInput('patientId', 'p-1');
    fixture.componentRef.setInput('caseId', 'C-1');
    fixture.componentRef.setInput('RecordId', 'F-1');
    fixture.detectChanges();
    expect(fixture.componentInstance.finding?.RecordId).toBe('F-1');
    expect(fixture.nativeElement.textContent).toContain('Befundinhalt');

    fixture.componentRef.setInput('patientId', '');
    fixture.detectChanges();
    expect(fixture.componentInstance.finding).toBeUndefined();
  });
});
