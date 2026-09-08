import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import {
  ComponentDescriptor,
  FlowApiService,
  FlowDefinition,
  FlowNode,
  FlowTransition,
  IxtDisplayType,
  PrtType,
  ViewRouterService
} from 'flow-platform';
import { EditorPageComponent } from './editor-page.component';

/** API-Doppel mit kontrolliertem Validierungsverhalten für die Editor-Interaktion. */
class ApiServiceMock {
  failValidation = false;
  flows: Array<{ id: string; name: string; tool: 'WebclientTool'; active: boolean }> = [];
  createdFlow?: FlowDefinition;
  updatedFlow?: FlowDefinition;
  flowResponse?: Subject<FlowDefinition>;
  registryResponse?: Subject<ComponentDescriptor[]>;
  getRegistry() { return this.registryResponse ?? of([]); }
  getFlows() { return of(this.flows); }
  getFlow(id: string) {
    if (this.flowResponse) {
      return this.flowResponse;
    }
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
    const nestedContainer: FlowNode = {
      id: 'nested',
      componentId: 'content',
      inputBindings: {},
      children: [structuredClone(sidebar)],
      transitions: [{ onOutput: 'next', targetNodeId: sidebar.id, contextMapping: {} }],
      sidebar: { nodeId: sidebar.id, position: 'LEFT', width: 280 }
    };
    content.children = [nestedContainer];
    content.transitions = [{ onOutput: 'next', targetNodeId: sidebar.id, contextMapping: {} }];
    content.sidebar = { nodeId: sidebar.id, position: 'LEFT', width: 280 };
    component.flow!.sidebar = { nodeId: sidebar.id, position: 'LEFT', width: 280 };

    component.removeSelectedNode();

    expect(component.flow!.nodes).toEqual([content]);
    expect(content.children).toEqual([jasmine.objectContaining({
      id: 'nested',
      children: [],
      transitions: []
    })]);
    expect(nestedContainer.sidebar).toBeUndefined();
    expect(content.transitions).toEqual([]);
    expect(content.sidebar).toBeUndefined();
    expect(component.flow!.sidebar).toBeUndefined();
    expect(component.flow!.entryNodeId).toBe(content.id);
  });

  it('derives unique node IDs from the selected presenter and updates references when it changes', () => {
    const fixture = TestBed.createComponent(EditorPageComponent);
    const component = fixture.componentInstance;
    component.registry = [
      { id: 'ward-list-content', title: 'Stationen', presenter: 'CONTENT', container: false, inputs: [], outputs: [] },
      { id: 'patient-list-content', title: 'Patienten', presenter: 'CONTENT', container: false, inputs: [], outputs: [] }
    ];

    component.createNewFlow();
    component.addNode();
    const first = component.selectedNode!;
    component.addNode();
    const second = component.selectedNode!;
    first.transitions.push({ onOutput: 'selected', targetNodeId: second.id, contextMapping: {} });
    component.flow!.sidebar = { nodeId: second.id, position: 'LEFT', width: 280 };

    expect(first.id).toBe('ward-list-content');
    expect(second.id).toBe('ward-list-content-2');

    second.componentId = 'patient-list-content';
    component.changeNodeComponent(second);

    expect(second.id).toBe('patient-list-content');
    expect(component.selectedNodeId).toBe('patient-list-content');
    expect(first.transitions[0].targetNodeId).toBe('patient-list-content');
    expect(component.flow!.sidebar.nodeId).toBe('patient-list-content');
  });

  it('connects a new presenter and prefills compatible inputs from the previous output', () => {
    const fixture = TestBed.createComponent(EditorPageComponent);
    const component = fixture.componentInstance;
    const sourceDescriptor = {
      id: 'ward-list-content', title: 'Stationen', presenter: 'CONTENT' as const, container: false, inputs: [],
      outputs: [{ name: 'wardSelected', payload: { WardID: 'WARD_ID' as const } }]
    };
    const targetDescriptor = {
      id: 'patient-list-content', title: 'Patienten', presenter: 'CONTENT' as const, container: false,
      inputs: [
        { name: 'wardId', semanticType: 'WARD_ID' as const, required: true, allowedValues: [] },
        { name: 'mode', semanticType: 'MODE' as const, required: true, allowedValues: ['normal', 'findings'] }
      ],
      outputs: []
    };
    component.registry = [sourceDescriptor, targetDescriptor];

    component.createNewFlow();
    component.addNode();
    const source = component.selectedNode!;
    component.registry = [targetDescriptor, sourceDescriptor];
    component.addNode();
    const target = component.selectedNode!;

    expect(target.id).toBe('patient-list-content');
    expect(target.inputBindings['wardId']).toEqual({ source: 'CONTEXT', contextKey: 'wardId' });
    expect(target.inputBindings['mode']).toEqual({ source: 'STATIC', staticValue: 'normal' });
    expect(source.transitions).toEqual([{
      onOutput: 'wardSelected',
      targetNodeId: 'patient-list-content',
      contextMapping: { wardId: '$event.WardID' }
    }]);
  });

  it('does not overwrite an explicitly configured input while prefilling a transition', () => {
    const fixture = TestBed.createComponent(EditorPageComponent);
    const component = fixture.componentInstance;
    component.registry = [
      {
        id: 'source', title: 'Quelle', presenter: 'CONTENT', container: false, inputs: [],
        outputs: [{ name: 'selected', payload: { patientId: 'PATIENT_ID' } }]
      },
      {
        id: 'target', title: 'Ziel', presenter: 'CONTENT', container: false,
        inputs: [{ name: 'patientId', semanticType: 'PATIENT_ID', required: true, allowedValues: [] }],
        outputs: []
      }
    ];
    const source: FlowNode = { id: 'source', componentId: 'source', inputBindings: {}, children: [], transitions: [] };
    const target: FlowNode = {
      id: 'target',
      componentId: 'target',
      inputBindings: { patientId: { source: 'STATIC', staticValue: 'patient-42' } },
      children: [],
      transitions: []
    };
    const transition: FlowTransition = {
      onOutput: 'selected',
      targetNodeId: 'target',
      contextMapping: {}
    };
    source.transitions.push(transition);
    component.flow = {
      id: 'flow',
      name: 'Test',
      tool: 'WebclientTool',
      entryNodeId: source.id,
      nodes: [source, target]
    };

    component.prefillTransition(source, transition);

    expect(target.inputBindings['patientId']).toEqual({ source: 'STATIC', staticValue: 'patient-42' });
    expect(transition.contextMapping).toEqual({});
  });

  it('keeps a new draft when an earlier flow load completes late', () => {
    const fixture = TestBed.createComponent(EditorPageComponent);
    const component = fixture.componentInstance;
    const api = TestBed.inject(FlowApiService) as unknown as ApiServiceMock;
    api.flowResponse = new Subject<FlowDefinition>();
    component.selectedFlowId = 'existing';

    component.loadFlow();
    component.createNewFlow();
    const draftId = component.flow!.id;
    api.flowResponse.next({
      id: 'existing',
      name: 'Bestehend',
      tool: 'WebclientTool',
      entryNodeId: 'first',
      nodes: [{ id: 'first', componentId: 'content', inputBindings: {}, children: [], transitions: [] }]
    });

    expect(component.isNewFlow).toBeTrue();
    expect(component.flow!.id).toBe(draftId);
  });

  it('shows panel input bindings when the registry loads after the flow', () => {
    const fixture = TestBed.createComponent(EditorPageComponent);
    const api = TestBed.inject(FlowApiService) as unknown as ApiServiceMock;
    api.flows = [{ id: 'flow', name: 'Flow', tool: 'WebclientTool', active: true }];
    api.registryResponse = new Subject<ComponentDescriptor[]>();

    fixture.detectChanges();

    const panel = fixture.componentInstance.selectedNode!;
    expect(panel.inputBindings['patientId']).toBeUndefined();

    api.registryResponse.next([{
      id: 'ward-list',
      title: 'Panel',
      presenter: 'CONTENT',
      container: false,
      inputs: [{ name: 'patientId', semanticType: 'PATIENT_ID', required: true, allowedValues: [] }],
      outputs: []
    }]);
    fixture.detectChanges();

    expect(panel.inputBindings['patientId']).toEqual({ source: 'CONTEXT', contextKey: 'patientId' });
    expect(fixture.nativeElement.textContent).toContain('patientId');
  });

  it('shows and edits descriptor bindings of container children', () => {
    const fixture = TestBed.createComponent(EditorPageComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    const child: FlowNode = {
      id: 'details',
      componentId: 'details-panel',
      inputBindings: { patientId: { source: 'STATIC', staticValue: '' } },
      children: [],
      transitions: []
    };
    const container: FlowNode = {
      id: 'tabs',
      componentId: 'tab-panel',
      inputBindings: {},
      children: [child],
      transitions: []
    };
    component.registry = [
      { id: 'tab-panel', title: 'Tab-Panel', presenter: 'CONTENT', container: true, inputs: [], outputs: [] },
      {
        id: 'details-panel',
        title: 'Details',
        presenter: 'CONTENT',
        container: false,
        inputs: [
          { name: 'patientId', semanticType: 'PATIENT_ID', required: true, allowedValues: [] },
          { name: 'mode', semanticType: 'MODE', required: true, allowedValues: ['normal', 'findings'] }
        ],
        outputs: []
      }
    ];
    component.flow = {
      id: 'flow',
      name: 'Test',
      tool: 'WebclientTool',
      entryNodeId: container.id,
      nodes: [container, child]
    };
    component.ensureInputBindings(child);
    component.selectedNodeId = container.id;

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Bindings der Kindknoten');
    expect(fixture.nativeElement.textContent).toContain('patientId');
    expect(child.inputBindings).toEqual({
      patientId: { source: 'CONTEXT', contextKey: 'patientId' },
      mode: { source: 'STATIC', staticValue: 'normal' }
    });
  });

  it('uses the globally editable node for a serialized container child', () => {
    const fixture = TestBed.createComponent(EditorPageComponent);
    const component = fixture.componentInstance;
    const api = TestBed.inject(FlowApiService) as unknown as ApiServiceMock;
    api.flows = [{ id: 'flow', name: 'Flow', tool: 'WebclientTool', active: true }];
    api.registryResponse = new Subject<ComponentDescriptor[]>();
    api.flowResponse = new Subject<FlowDefinition>();

    fixture.detectChanges();
    api.flowResponse.next({
      id: 'flow',
      name: 'Flow',
      tool: 'WebclientTool',
      entryNodeId: 'tabs',
      nodes: [
        {
          id: 'tabs',
          componentId: 'tab-panel',
          inputBindings: {},
          children: [{ id: 'details', componentId: 'details-panel', inputBindings: {}, children: [], transitions: [] }],
          transitions: []
        },
        { id: 'details', componentId: 'details-panel', inputBindings: {}, children: [], transitions: [] }
      ]
    });
    api.registryResponse.next([
      { id: 'tab-panel', title: 'Tab-Panel', presenter: 'CONTENT', container: true, inputs: [], outputs: [] },
      {
        id: 'details-panel',
        title: 'Details',
        presenter: 'CONTENT',
        container: false,
        inputs: [{ name: 'patientId', semanticType: 'PATIENT_ID', required: true, allowedValues: [] }],
        outputs: []
      }
    ]);

    const [container, child] = component.flow!.nodes;
    expect(container.children[0]).toBe(child);
    expect(container.children[0].inputBindings['patientId'])
      .toEqual({ source: 'CONTEXT', contextKey: 'patientId' });
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

  it('configures display type targets by PrtType on a transition', () => {
    const fixture = TestBed.createComponent(EditorPageComponent);
    const component = fixture.componentInstance;
    const transition: FlowTransition = {
      onOutput: 'selected',
      targetNodeId: 'target',
      contextMapping: {}
    };

    component.setPrtTypeDisplayType(
      transition,
      PrtType.PRTTYPE_ORDER,
      IxtDisplayType.DISPTYPE_FORM
    );

    expect(transition.prtTypeDisplayTypes).toEqual({
      [PrtType.PRTTYPE_ORDER]: IxtDisplayType.DISPTYPE_FORM
    });
    component.setPrtTypeDisplayType(transition, PrtType.PRTTYPE_ORDER, '');
    expect(transition.prtTypeDisplayTypes).toEqual({});
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
