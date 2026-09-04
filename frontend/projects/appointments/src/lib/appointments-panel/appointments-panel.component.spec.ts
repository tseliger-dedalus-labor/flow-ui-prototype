import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PermissionService } from 'flow-platform';
import { PatientApiService } from 'patient-workflow';
import { AppointmentsApiService } from '../appointments-api.service';
import { AppointmentsPanelComponent } from './appointments-panel.component';

class ApiServiceMock {
  getAppointments = jasmine.createSpy('getAppointments').and.returnValue(of([
    { id: 'a-1', wardId: 'ward-a', patientId: 'p-100', patientName: 'Anna Weber', date: '2026-09-04', time: '09:00', reason: 'Kontrolle' }
  ]));
  getPatients = jasmine.createSpy('getPatients').and.returnValue(of([{ id: 'p-100', name: 'Anna Weber' }]));
  createAppointment = jasmine.createSpy('createAppointment').and.returnValue(of(
    { id: 'a-2', wardId: 'ward-a', patientId: 'p-100', patientName: 'Anna Weber', date: '2026-09-05', time: '10:00', reason: 'Nachsorge' }
  ));
}

describe('AppointmentsPanelComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentsPanelComponent],
      providers: [
        { provide: AppointmentsApiService, useClass: ApiServiceMock },
        { provide: PatientApiService, useClass: ApiServiceMock }
      ]
    }).compileComponents();
  });

  it('loads and renders ward appointments', () => {
    const fixture = TestBed.createComponent(AppointmentsPanelComponent);
    fixture.componentRef.setInput('wardId', 'ward-a');
    fixture.detectChanges();

    expect(TestBed.inject(AppointmentsApiService).getAppointments).toHaveBeenCalledWith('ward-a');
    expect(fixture.nativeElement.textContent).toContain('Anna Weber');
    expect(fixture.nativeElement.textContent).toContain('Kontrolle');
  });

  it('schedules an appointment and adds it to the list', () => {
    const fixture = TestBed.createComponent(AppointmentsPanelComponent);
    fixture.componentRef.setInput('wardId', 'ward-a');
    fixture.detectChanges();
    fixture.componentInstance.draft = { patientId: 'p-100', date: '2026-09-05', time: '10:00', reason: 'Nachsorge' };

    fixture.componentInstance.schedule();

    expect(TestBed.inject(AppointmentsApiService).createAppointment).toHaveBeenCalled();
    expect(fixture.componentInstance.appointments.length).toBe(2);
  });

  it('hides appointment creation without write permission', () => {
    spyOn(TestBed.inject(PermissionService), 'hasAll').and.returnValue(false);
    const fixture = TestBed.createComponent(AppointmentsPanelComponent);
    fixture.componentRef.setInput('wardId', 'ward-a');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Anna Weber');
  });
});
