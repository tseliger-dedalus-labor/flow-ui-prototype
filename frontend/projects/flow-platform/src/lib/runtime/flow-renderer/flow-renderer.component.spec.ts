import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FlowEngineService } from '../../flow-engine.service';
import { EmbeddedFlowContainer, FlowNode } from '../../models';
import { PermissionService } from '../../permission.service';
import { FlowRendererComponent } from './flow-renderer.component';
import { FLOW_WIDGET } from '../flow-widget';

/** Leichter Spy-Doppel für die Runtime-Engine, damit Transitionen ohne echte Navigation überprüft werden können. */
class FlowEngineServiceMock {
  transitionFrom = jasmine.createSpy('transitionFrom');
}

/**
 * Test-Komponente für die gerenderte Patientenansicht; sie prüft reine Input-Bindings ohne Template-Logik.
 * So bleibt die Renderer-Suite auf die Bindung zwischen Kontext und Komponenten-API fokussiert.
 */
@Component({ selector: 'flow-test-view', template: '' })
class TestViewComponent {
  @Input() patientId = '';
  @Input() caseId = '';
}

/** Test-Doppel für einen Listenknoten, der Input-Bindings und ein Transition-Output-Signal bereitstellt. */
@Component({ selector: 'flow-test-list', template: '' })
class TestListComponent {
  @Input() wardId = '';
  @Input() mode = '';
  @Output() patientSelected = new EventEmitter<{ patientId: string; caseId: string }>();
}

/** Test-Container, der Kindknoten bewusst selbst übernimmt. */
@Component({ selector: 'flow-test-container', template: '' })
class TestContainerComponent implements EmbeddedFlowContainer {
  flowChildren: FlowNode[] = [];
  flowContext: Record<string, unknown> = {};
}

/** Host-Komponente für die Renderer-Integration; die Inputs simulieren den Laufzeitknoten aus dem Flow-Engine-Status. */
@Component({
  imports: [FlowRendererComponent],
  template: '<app-flow-renderer [node]="node" [context]="context" />'
})
class HostComponent {
  node!: FlowNode;
  context: Record<string, unknown> = {};
}

/**
 * Testet das dynamische Rendern einzelner Flow-Knoten.
 * Die Suite schützt die Bindung von Kontext, Outputs und Berechtigungen zwischen Registry,
 * Runtime-Engine und gerendertem Komponenten-Host.
 */
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
        { provide: FLOW_WIDGET, useValue: { componentId: 'patient-list', descriptor: { id: 'patient-list' }, component: TestListComponent }, multi: true },
        { provide: FLOW_WIDGET, useValue: { componentId: 'test-container', descriptor: { id: 'test-container' }, component: TestContainerComponent }, multi: true }
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
        patientId: { source: 'CONTEXT', contextKey: 'patientId' },
        caseId: { source: 'CONTEXT', contextKey: 'caseId' }
      },
      children: [],
      transitions: []
    };
    host.context = { patientId: 'p-123', caseId: 'F-123' };

    fixture.detectChanges();

    const patientView = fixture.debugElement.query(By.directive(TestViewComponent));
    expect(patientView).toBeTruthy();
    expect((patientView.componentInstance as TestViewComponent).patientId).toBe('p-123');
    expect((patientView.componentInstance as TestViewComponent).caseId).toBe('F-123');
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
        {
          onOutput: 'patientSelected',
          targetNodeId: 'next',
          contextMapping: { patientId: '$event.patientId', caseId: '$event.caseId' }
        }
      ]
    };
    host.context = { any: 'v1' };
    fixture.detectChanges();

    host.context = { any: 'v2' };
    fixture.detectChanges();

    const patientList = fixture.debugElement.query(By.directive(TestListComponent));
    // Die Transition darf nicht mehrfach registriert werden, sonst würden doppelte Navigationen entstehen.
    (patientList.componentInstance as TestListComponent).patientSelected.emit({ patientId: 'p-1', caseId: 'F-1' });

    expect(engine.transitionFrom).toHaveBeenCalledTimes(1);
    expect(engine.transitionFrom).toHaveBeenCalledWith(
      'patients',
      'patientSelected',
      { patientId: 'p-1', caseId: 'F-1' }
    );
  });

  it('lets embedded containers render their own child nodes', () => {
    const child: FlowNode = {
      id: 'child',
      componentId: 'patient-view',
      inputBindings: {},
      children: [],
      transitions: []
    };
    host.node = {
      id: 'container',
      componentId: 'test-container',
      inputBindings: {},
      children: [child],
      transitions: []
    };
    host.context = { patientId: 'p-1', caseId: 'F-1' };

    fixture.detectChanges();

    const container = fixture.debugElement.query(By.directive(TestContainerComponent));
    expect(container.componentInstance.flowChildren).toEqual([child]);
    expect(container.componentInstance.flowContext).toEqual(host.context);
    expect(fixture.debugElement.query(By.directive(TestViewComponent))).toBeNull();
  });

  it('does not render a node without its required permission', () => {
    const permissions = TestBed.inject(PermissionService);
    // Ohne vollständige Berechtigung muss der Knoten vollständig aus dem DOM verschwinden.
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
