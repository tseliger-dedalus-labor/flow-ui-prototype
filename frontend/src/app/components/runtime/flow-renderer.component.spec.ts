import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { FlowRendererComponent } from './flow-renderer.component';
import { FlowNode } from '../../models';
import { FlowEngineService } from '../../services/flow-engine.service';
import { ApiService } from '../../services/api.service';
import { PatientViewComponent } from '../widgets/patient-view.component';
import { PatientListComponent } from '../widgets/patient-list.component';

class ApiServiceMock {
  getWards() { return of([]); }
  getPatients() { return of([]); }
  getPatient() { return of({ id: 'p', name: 'n', birthDate: '2000-01-01' }); }
  getFindings() { return of([]); }
  getOrders() { return of([]); }
  getTransfusions() { return of([]); }
}

class FlowEngineServiceMock {
  transition = jasmine.createSpy('transition');
}

@Component({
  standalone: true,
  imports: [FlowRendererComponent],
  template: '<app-flow-renderer [node]="node" [context]="context" />'
})
class HostComponent {
  node!: FlowNode;
  context: Record<string, unknown> = {};
}

describe('FlowRendererComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let engine: FlowEngineServiceMock;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        { provide: FlowEngineService, useClass: FlowEngineServiceMock },
        { provide: ApiService, useClass: ApiServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    engine = TestBed.inject(FlowEngineService) as unknown as FlowEngineServiceMock;
  });

  it('binds context input values to rendered components', () => {
    host.node = {
      id: 'view',
      componentId: 'patient-view',
      inputBindings: {
        patientId: { source: 'CONTEXT', contextKey: 'patientId' }
      },
      children: [],
      transitions: []
    };
    host.context = { patientId: 'p-123' };

    fixture.detectChanges();

    const patientView = fixture.debugElement.query(By.directive(PatientViewComponent));
    expect(patientView).toBeTruthy();
    expect((patientView.componentInstance as PatientViewComponent).patientId).toBe('p-123');
  });

  it('subscribes output transitions only once across re-renders', () => {
    host.node = {
      id: 'patients',
      componentId: 'patient-list',
      inputBindings: {
        wardId: { source: 'STATIC', staticValue: '' },
        mode: { source: 'STATIC', staticValue: 'normal' }
      },
      children: [],
      transitions: [
        { onOutput: 'patientSelected', targetNodeId: 'next', contextMapping: { patientId: '$event.patientId' } }
      ]
    };
    host.context = { any: 'v1' };
    fixture.detectChanges();

    host.context = { any: 'v2' };
    fixture.detectChanges();

    const patientList = fixture.debugElement.query(By.directive(PatientListComponent));
    (patientList.componentInstance as PatientListComponent).patientSelected.emit({ patientId: 'p-1' });

    expect(engine.transition).toHaveBeenCalledTimes(1);
    expect(engine.transition).toHaveBeenCalledWith('patientSelected', { patientId: 'p-1' });
  });
});
