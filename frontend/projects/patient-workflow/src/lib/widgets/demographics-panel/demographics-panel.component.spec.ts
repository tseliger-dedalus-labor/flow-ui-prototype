import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PatientApiService } from '../../patient-api.service';
import { DemographicsPanelComponent } from './demographics-panel.component';

/** Testdoppel für das Laden eines einzelnen Patientenstammsatzes. */
class ApiServiceMock {
  getPatient() {
    return of({ id: 'p-1', name: 'Patient 1', birthDate: '2000-01-01' });
  }
}

/**
 * Schützt die Stammdatenansicht als Patienten-Kontextmodul.
 * Die Suite stellt sicher, dass geladene Stammdaten angezeigt und bei leerem Kontext
 * wieder vollständig verworfen werden.
 */
describe('DemographicsPanelComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemographicsPanelComponent],
      providers: [{ provide: PatientApiService, useClass: ApiServiceMock }]
    }).compileComponents();
  });

  it('clears data when patientId becomes empty', () => {
    const fixture = TestBed.createComponent(DemographicsPanelComponent);
    fixture.componentRef.setInput('patientId', 'p-1');
    fixture.detectChanges();
    expect(fixture.componentInstance.data?.id).toBe('p-1');

    fixture.componentRef.setInput('patientId', '');
    fixture.detectChanges();
    // Leerer Patient-Kontext muss die vorherige Stammdatenansicht vollständig zurücksetzen.
    expect(fixture.componentInstance.data).toBeUndefined();
  });
});
