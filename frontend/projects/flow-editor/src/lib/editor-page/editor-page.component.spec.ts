import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FlowApiService, FlowDefinition, FlowNode, ViewRouterService } from 'flow-platform';
import { EditorPageComponent } from './editor-page.component';

/** API-Doppel mit kontrolliertem Validierungsverhalten für die Editor-Interaktion. */
class ApiServiceMock {
  failValidation = false;
  flows: Array<{ id: string; name: string; tool: 'WebclientTool'; active: boolean }> = [];
  createdFlow?: FlowDefinition;
  updatedFlow?: FlowDefinition;
  getRegistry() { return of([]); }
  getFlows() { return of(this.flows); }
  getFlow(id: string) {
    return of({
      id,
      name: id,
      tool: 'WebclientTool' as const,
      entryNodeId: 'first',
      nodes: [
        { id: 'first', componentId: 'ward-list', inputBindings: {}, children: [], transitions: [] },
        { id: 'second', componentId: 'patient-list', inputBindings: {}, children: [], transitions: [] }
      ]
    });
  }
  createFlow(flow: FlowDefinition) {
    this.createdFlow = flow;
    return of(flow);
  }
  updateFlow(flow: FlowDefinition) {
    this.updatedFlow = flow;
    return of(flow);
  }
  validateFlow() {
    if (this.failValidation) {
      return throwError(() => new Error('validation failed'));
    }
    return of({ valid: false, issues: [{ path: 'nodes.x', message: 'Fehler' }] });
  }
}

class ViewRouterServiceMock {
  state: unknown;
  readonly writes: unknown[] = [];

  read() { return this.state; }
  write(_scope: string, state: unknown) { this.writes.push(state); }
}

/**
 * Schützt die Editor-Seite als zentrale Bearbeitungsschicht für Flows.
 * Die Suite prüft Validierung, Sidebar-Konfiguration, Berechtigungen und Zielvorschläge
 * als Architekturvertrag zwischen Formularlogik und Flow-Registry.
 */
describe('EditorPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorPageComponent],
      providers: [
        { provide: FlowApiService, useClass: ApiServiceMock },
        { provide: ViewRouterService, useClass: ViewRouterServiceMock }
      ]
    }).compileComponents();
  });

  it('applies validation issues to component state', () => {
    const fixture = TestBed.createComponent(EditorPageComponent);
    const component = fixture.componentInstance;
    component.flow = { id: 'flow', name: 'Test', tool: 'WebclientTool', entryNodeId: 'start', nodes: [] };

    component.validate();

    // Die Validierungsfehler müssen 1:1 in den lokalen Status übernommen werden.
    expect(component.issues.length).toBe(1);
    expect(component.issues[0].message).toBe('Fehler');
  });

  it('sets fallback issue when validation request fails', () => {
    const fixture = TestBed.createComponent(EditorPageComponent);
    const component = fixture.componentInstance;
    const api = TestBed.inject(FlowApiService) as unknown as ApiServiceMock;
    api.failValidation = true;
    component.flow = { id: 'flow', name: 'Test', tool: 'WebclientTool', entryNodeId: 'start', nodes: [] };

    component.validate();

    expect(component.issues.length).toBe(1);
    expect(component.issues[0].message).toContain('Validierung konnte nicht ausgeführt werden');
  });

  it('normalizes configured node permissions', () => {
    const fixture = TestBed.createComponent(EditorPageComponent);
    const node: FlowNode = { id: 'n', componentId: 'ward-list', inputBindings: {}, children: [], transitions: [] };

    fixture.componentInstance.setRequiredPermissions(node, ' APPOINTMENTS_READ, APPOINTMENTS_WRITE, APPOINTMENTS_READ ');

    // Doppelte und leere Einträge dürfen die Berechtigungsmenge nicht verfälschen.
    expect(node.requiredPermissions).toEqual(['APPOINTMENTS_READ', 'APPOINTMENTS_WRITE']);
  });

  it('creates and saves a new flow through the create endpoint', () => {
    const fixture = TestBed.createComponent(EditorPageComponent);
    const component = fixture.componentInstance;
    const api = TestBed.inject(FlowApiService) as unknown as ApiServiceMock;
    component.registry = [
      { id: 'ward-list-content', title: 'Stationsliste', presenter: 'CONTENT', container: false, inputs: [], outputs: [] }
    ];

    component.createNewFlow();
    component.addNode();
    component.flow!.name = 'Mein Flow';
    component.save();

    expect(api.createdFlow).toBeDefined();
    expect(api.updatedFlow).toBeUndefined();
    expect(component.isNewFlow).toBeFalse();
    expect(component.selectedFlowId).toBe(component.flow!.id);
    expect(component.flows).toContain(jasmine.objectContaining({ id: component.flow!.id, name: 'Mein Flow' }));
  });

  it('adds and removes nodes including references to the removed node', () => {
    const fixture = TestBed.createComponent(EditorPageComponent);
    const component = fixture.componentInstance;
    component.registry = [
      { id: 'content', title: 'Inhalt', presenter: 'CONTENT', container: true, inputs: [], outputs: [] },
      { id: 'sidebar', title: 'Sidebar', presenter: 'SIDEBAR', container: false, inputs: [], outputs: [] }
    ];

    component.createNewFlow();
    component.addNode();
    const content = component.selectedNode!;
    component.addNode(true);
    const sidebar = component.selectedNode!;
    content.children = [sidebar];
    content.transitions = [{ onOutput: 'next', targetNodeId: sidebar.id, contextMapping: {} }];
    content.sidebar = { nodeId: sidebar.id, position: 'LEFT', width: 280 };
    component.flow!.sidebar = { nodeId: sidebar.id, position: 'LEFT', width: 280 };

    component.removeSelectedNode();

    expect(component.flow!.nodes).toEqual([content]);
    expect(content.children).toEqual([]);
    expect(content.transitions).toEqual([]);
    expect(content.sidebar).toBeUndefined();
    expect(component.flow!.sidebar).toBeUndefined();
    expect(component.flow!.entryNodeId).toBe(content.id);
  });

  it('creates and removes sidebar configuration', () => {
    const fixture = TestBed.createComponent(EditorPageComponent);
    const component = fixture.componentInstance;
    const flow: FlowDefinition = {
      id: 'flow',
      name: 'Test',
      tool: 'WebclientTool',
      entryNodeId: 'wards',
      nodes: [
        { id: 'wards', componentId: 'ward-list-content', inputBindings: {}, children: [], transitions: [] },
        { id: 'wards-sidebar', componentId: 'ward-list-sidebar', inputBindings: {}, children: [], transitions: [] }
      ]
    };
    component.registry = [
      { id: 'ward-list-content', title: 'Stationsliste', presenter: 'CONTENT', container: false, inputs: [], outputs: [] },
      { id: 'ward-list-sidebar', title: 'Stationsliste Sidebar', presenter: 'SIDEBAR', container: false, inputs: [], outputs: [] }
    ];

    component.setSidebarEnabled(flow, true);
    // Die Sidebar-Konfiguration ist ein fester Teil des Flow-Layouts und darf nicht abweichen.
    expect(flow.sidebar).toEqual({
      nodeId: 'wards-sidebar',
      position: 'LEFT',
      width: 280,
      ariaLabel: 'Flow-Navigation'
    });

    component.setSidebarEnabled(flow, false);
    expect(flow.sidebar).toBeUndefined();
  });

  it('configures the flow-wide sidebar collapse mode', () => {
    const fixture = TestBed.createComponent(EditorPageComponent);
    const component = fixture.componentInstance;
    const flow: FlowDefinition = {
      id: 'f',
      name: 'flow',
      tool: 'WebclientTool',
      entryNodeId: 'wards',
      nodes: []
    };

    component.setSidebarMode(flow, true);
    expect(flow.sidebarMode).toBe('COLLAPSE');

    component.setSidebarMode(flow, false);
    expect(flow.sidebarMode).toBe('SINGLE');
  });

  it('creates and removes a node-specific sidebar configuration', () => {
    const fixture = TestBed.createComponent(EditorPageComponent);
    const component = fixture.componentInstance;
    const wards: FlowNode = { id: 'wards', componentId: 'ward-list-sidebar', inputBindings: {}, children: [], transitions: [] };
    const patients: FlowNode = { id: 'patients', componentId: 'patient-list-content', inputBindings: {}, children: [], transitions: [] };
    component.registry = [
      { id: 'ward-list-sidebar', title: 'Stationsliste Sidebar', presenter: 'SIDEBAR', container: false, inputs: [], outputs: [] },
      { id: 'patient-list-content', title: 'Patientenliste', presenter: 'CONTENT', container: false, inputs: [], outputs: [] }
    ];
    component.flow = {
      id: 'flow',
      name: 'Test',
      tool: 'WebclientTool',
      entryNodeId: 'wards',
      nodes: [wards, patients]
    };

    component.setNodeSidebarEnabled(patients, true);

    expect(patients.sidebar).toEqual({
      nodeId: 'wards',
      position: 'LEFT',
      width: 280,
      ariaLabel: 'Flow-Navigation'
    });

    component.setNodeSidebarEnabled(patients, false);
    expect(patients.sidebar).toBeUndefined();
  });

  it('suggests targets whose required inputs match an output type', () => {
    const fixture = TestBed.createComponent(EditorPageComponent);
    const component = fixture.componentInstance;
    component.registry = [
      {
        id: 'source', title: 'Source', presenter: 'CONTENT', container: false, inputs: [],
        outputs: [{ name: 'selected', payload: { patientId: 'PATIENT_ID', caseId: 'CASE_ID' } }]
      },
      {
        id: 'matching', title: 'Matching', presenter: 'CONTENT', container: false,
        inputs: [{ name: 'patientId', semanticType: 'PATIENT_ID', required: true, allowedValues: [] }],
        outputs: []
      },
      {
        id: 'case-matching', title: 'Case Matching', presenter: 'CONTENT', container: false,
        inputs: [{ name: 'caseId', semanticType: 'CASE_ID', required: true, allowedValues: [] }],
        outputs: []
      },
      {
        id: 'other', title: 'Other', presenter: 'CONTENT', container: false,
        inputs: [{ name: 'wardId', semanticType: 'WARD_ID', required: true, allowedValues: [] }],
        outputs: []
      }
    ];
    const source: FlowNode = { id: 's', componentId: 'source', inputBindings: {}, children: [], transitions: [] };
    const matching: FlowNode = {
      id: 'm', componentId: 'matching',
      inputBindings: { patientId: { source: 'CONTEXT', contextKey: 'patientId' } },
      children: [], transitions: []
    };
    const caseMatching: FlowNode = {
      id: 'c', componentId: 'case-matching',
      inputBindings: { caseId: { source: 'CONTEXT', contextKey: 'caseId' } },
      children: [], transitions: []
    };
    const other: FlowNode = {
      id: 'o', componentId: 'other',
      inputBindings: { wardId: { source: 'CONTEXT', contextKey: 'wardId' } },
      children: [], transitions: []
    };
    component.flow = {
      id: 'flow',
      name: 'Test',
      tool: 'WebclientTool',
      entryNodeId: 's',
      nodes: [source, matching, caseMatching, other]
    };

    // Nur Ziele mit kompatiblen semantischen Eingaben dürfen vorgeschlagen werden.
    expect(component.compatibleTargets(source, 'selected').map((node) => node.id)).toEqual(['s', 'm', 'c']);
  });

  it('restores the selected flow and node from the linked editor state', () => {
    const fixture = TestBed.createComponent(EditorPageComponent);
    const api = TestBed.inject(FlowApiService) as unknown as ApiServiceMock;
    const viewRouter = TestBed.inject(ViewRouterService) as unknown as ViewRouterServiceMock;
    api.flows = [
      { id: 'flow-a', name: 'A', tool: 'WebclientTool', active: true },
      { id: 'flow-b', name: 'B', tool: 'WebclientTool', active: false }
    ];
    viewRouter.state = { flowId: 'flow-b', nodeId: 'second' };

    fixture.detectChanges();

    expect(fixture.componentInstance.selectedFlowId).toBe('flow-b');
    expect(fixture.componentInstance.selectedNodeId).toBe('second');
    expect(viewRouter.writes).toContain(jasmine.objectContaining({
      flowId: 'flow-b',
      nodeId: 'second'
    }));
  });
});
