import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { DemographicsPanelComponent } from './demographics-panel.component';

class ApiServiceMock {
  getPatient() {
    return of({ id: 'p-1', name: 'Patient 1', birthDate: '2000-01-01' });
  }
}

describe('DemographicsPanelComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemographicsPanelComponent],
      providers: [{ provide: ApiService, useClass: ApiServiceMock }]
    }).compileComponents();
  });

  it('clears data when patientId becomes empty', () => {
    const fixture = TestBed.createComponent(DemographicsPanelComponent);
    fixture.componentRef.setInput('patientId', 'p-1');
    fixture.detectChanges();
    expect(fixture.componentInstance.data?.id).toBe('p-1');

    fixture.componentRef.setInput('patientId', '');
    fixture.detectChanges();
    expect(fixture.componentInstance.data).toBeUndefined();
  });
});
