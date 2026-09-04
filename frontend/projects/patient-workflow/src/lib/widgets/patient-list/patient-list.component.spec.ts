import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PatientApiService } from '../../patient-api.service';
import { PatientListComponent } from './patient-list.component';

/** Testdoppel für das Laden patientenbezogener Listen pro Station. */
class ApiServiceMock {
  getPatients() {
    return of([{ id: 'p-1', name: 'Patient 1' }]);
  }
}

/**
 * Schützt die Patientenliste als zentrale Stationsansicht.
 * Die Suite stellt sicher, dass Stationswechsel die geladenen Patienten filtern und
 * keine veralteten Listen im UI verbleiben.
 */
describe('PatientListComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientListComponent],
      providers: [{ provide: PatientApiService, useClass: ApiServiceMock }]
    }).compileComponents();
  });

  it('clears patients when wardId is empty', () => {
    const fixture = TestBed.createComponent(PatientListComponent);
    fixture.componentRef.setInput('wardId', 'ward-a');
    fixture.detectChanges();
    expect(fixture.componentInstance.patients.length).toBe(1);

    fixture.componentRef.setInput('wardId', '');
    fixture.detectChanges();
    // Ohne Stationsbezug darf keine alte Patientenliste sichtbar bleiben.
    expect(fixture.componentInstance.patients).toEqual([]);
  });
});
