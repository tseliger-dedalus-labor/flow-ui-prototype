import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { FindingsPanelComponent } from './findings-panel.component';

class ApiServiceMock {
  getFindings() {
    return of([{ id: 'f-1', text: 'F1' }]);
  }
}

describe('FindingsPanelComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FindingsPanelComponent],
      providers: [{ provide: ApiService, useClass: ApiServiceMock }]
    }).compileComponents();
  });

  it('clears findings when patientId becomes empty', () => {
    const fixture = TestBed.createComponent(FindingsPanelComponent);
    fixture.componentRef.setInput('patientId', 'p-1');
    fixture.detectChanges();
    expect(fixture.componentInstance.items.length).toBe(1);

    fixture.componentRef.setInput('patientId', '');
    fixture.detectChanges();
    expect(fixture.componentInstance.items).toEqual([]);
  });
});
