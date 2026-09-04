import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { FlowTabService } from 'flow-platform';
import { PatientApiService } from '../../patient-api.service';
import { OrdersPanelComponent } from './orders-panel.component';

/** Testdoppel für das Laden von Patientenaufträgen ohne Backend-Abhängigkeit. */
class ApiServiceMock {
  getOrders() {
    return of([{
      RecordId: 'R-1',
      text: 'O1',
      status: 'Offen',
      createdAt: '2026-09-04'
    }]);
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
        FlowTabService,
        { provide: PatientApiService, useClass: ApiServiceMock }
      ]
    }).compileComponents();
  });

  it('clears orders when patientId becomes empty', () => {
    const fixture = TestBed.createComponent(OrdersPanelComponent);
    fixture.componentRef.setInput('patientId', 'p-1');
    fixture.componentRef.setInput('caseId', 'F-1');
    fixture.detectChanges();
    expect(fixture.componentInstance.items.length).toBe(1);

    fixture.componentRef.setInput('patientId', '');
    fixture.detectChanges();
    // Ohne Patient darf kein alter Auftragsstand im UI verbleiben.
    expect(fixture.componentInstance.items).toEqual([]);
  });

  it('opens an order detail tab with RecordId', () => {
    const fixture = TestBed.createComponent(OrdersPanelComponent);
    const tabs = TestBed.inject(FlowTabService);
    const open = spyOn(tabs, 'open');
    const selected = jasmine.createSpy('selected');
    fixture.componentInstance.patientId = 'p-1';
    fixture.componentInstance.caseId = 'F-1';
    fixture.componentInstance.orderSelected.subscribe(selected);
    const order = {
      RecordId: 'R-1',
      text: 'O1',
      status: 'Offen',
      createdAt: '2026-09-04'
    };

    fixture.componentInstance.openOrder(order);

    expect(selected).toHaveBeenCalledOnceWith({ RecordId: 'R-1' });
    expect(open).toHaveBeenCalledOnceWith(jasmine.objectContaining({
      key: 'order:F-1:R-1',
      title: 'Auftrag R-1'
    }));
  });
});
