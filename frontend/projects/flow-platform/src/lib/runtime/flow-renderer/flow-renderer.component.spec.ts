import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FlowEngineService } from '../../flow-engine.service';
import { FlowNode } from '../../models';
import { PermissionService } from '../../permission.service';
import { FlowRendererComponent } from './flow-renderer.component';
import { FLOW_WIDGET } from '../flow-widget';

class FlowEngineServiceMock {
  transitionFrom = jasmine.createSpy('transitionFrom');
}

@Component({ selector: 'flow-test-view', template: '' })
class TestViewComponent {
  @Input() patientId = '';
}

@Component({ selector: 'flow-test-list', template: '' })
class TestListComponent {
  @Input() wardId = '';
  @Input() mode = '';
  @Output() patientSelected = new EventEmitter<{ patientId: string }>();
}

@Component({
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
        { provide: FLOW_WIDGET, useValue: { componentId: 'patient-view', descriptor: { id: 'patient-view' }, component: TestViewComponent }, multi: true },
        { provide: FLOW_WIDGET, useValue: { componentId: 'patient-list', descriptor: { id: 'patient-list' }, component: TestListComponent }, multi: true }
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

    const patientView = fixture.debugElement.query(By.directive(TestViewComponent));
    expect(patientView).toBeTruthy();
    expect((patientView.componentInstance as TestViewComponent).patientId).toBe('p-123');
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

    const patientList = fixture.debugElement.query(By.directive(TestListComponent));
    (patientList.componentInstance as TestListComponent).patientSelected.emit({ patientId: 'p-1' });

    expect(engine.transitionFrom).toHaveBeenCalledTimes(1);
    expect(engine.transitionFrom).toHaveBeenCalledWith('patients', 'patientSelected', { patientId: 'p-1' });
  });

  it('does not render a node without its required permission', () => {
    const permissions = TestBed.inject(PermissionService);
    spyOn(permissions, 'hasAll').and.returnValue(false);
    host.node = {
      id: 'view',
      componentId: 'patient-view',
      inputBindings: {},
      children: [],
      transitions: [],
      requiredPermissions: ['PATIENT_READ']
    };

    fixture.detectChanges();

    expect(fixture.debugElement.query(By.directive(TestViewComponent))).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Keine Berechtigung');
  });
});
