import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PatientApiService } from '../../patient-api.service';
import { WardListComponent } from './ward-list.component';

/** Testdoppel für das Laden der Stationsliste aus dem Patienten-Backend. */
class ApiServiceMock {
  getWards() {
    return of([{ id: 'ward-a', name: 'Station A' }]);
  }
}

/**
 * Schützt die Stationsauswahl als Einstiegspunkt des Patienten-Workflows.
 * Die Suite stellt sicher, dass die Komponente Stationsdaten lädt und das fachliche
 * Auswahl-Event korrekt an nachfolgende Flows weitergibt.
 */
describe('WardListComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WardListComponent],
      providers: [{ provide: PatientApiService, useClass: ApiServiceMock }]
    }).compileComponents();
  });

  it('loads wards on init', () => {
    const fixture = TestBed.createComponent(WardListComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.wards.length).toBe(1);
    expect(fixture.componentInstance.wards[0].id).toBe('ward-a');
  });

  it('emits wardSelected payload', () => {
    const fixture = TestBed.createComponent(WardListComponent);
    const emitted: Array<{ wardId: string }> = [];
    fixture.componentInstance.wardSelected.subscribe((value) => emitted.push(value));

    fixture.componentInstance.selectWard('ward-b');

    expect(emitted).toEqual([{ wardId: 'ward-b' }]);
  });
});
