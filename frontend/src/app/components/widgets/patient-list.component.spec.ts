import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { PatientListComponent } from './patient-list.component';

class ApiServiceMock {
  getPatients() {
    return of([{ id: 'p-1', name: 'Patient 1' }]);
  }
}

describe('PatientListComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientListComponent],
      providers: [{ provide: ApiService, useClass: ApiServiceMock }]
    }).compileComponents();
  });

  it('clears patients when wardId is empty', () => {
    const fixture = TestBed.createComponent(PatientListComponent);
    fixture.componentRef.setInput('wardId', 'ward-a');
    fixture.detectChanges();
    expect(fixture.componentInstance.patients.length).toBe(1);

    fixture.componentRef.setInput('wardId', '');
    fixture.detectChanges();
    expect(fixture.componentInstance.patients).toEqual([]);
  });
});
