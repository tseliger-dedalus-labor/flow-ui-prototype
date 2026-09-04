import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FlowApiService, FlowDefinition, FlowNode } from 'flow-platform';
import { EditorPageComponent } from './editor-page.component';

/** API-Doppel mit kontrolliertem Validierungsverhalten für die Editor-Interaktion. */
class ApiServiceMock {
  failValidation = false;
  getRegistry() { return of([]); }
  getFlows() { return of([]); }
  getFlow() { return of({ id: 'f', name: 'n', tool: 'WebclientTool', entryNodeId: 'e', nodes: [] }); }
  updateFlow(flow: unknown) { return of(flow); }
  validateFlow() {
    if (this.failValidation) {
      return throwError(() => new Error('validation failed'));
    }
    return of({ valid: false, issues: [{ path: 'nodes.x', message: 'Fehler' }] });
  }
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
      providers: [{ provide: FlowApiService, useClass: ApiServiceMock }]
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

  it('creates and removes sidebar configuration', () => {
    const fixture = TestBed.createComponent(EditorPageComponent);
    const component = fixture.componentInstance;
    const flow: FlowDefinition = {
      id: 'flow',
      name: 'Test',
      tool: 'WebclientTool',
      entryNodeId: 'wards',
      nodes: [{ id: 'wards', componentId: 'ward-list', inputBindings: {}, children: [], transitions: [] }]
    };

    component.setSidebarEnabled(flow, true);
    // Die Sidebar-Konfiguration ist ein fester Teil des Flow-Layouts und darf nicht abweichen.
    expect(flow.sidebar).toEqual({
      nodeId: 'wards',
      position: 'LEFT',
      width: 280,
      ariaLabel: 'Flow-Navigation'
    });

    component.setSidebarEnabled(flow, false);
    expect(flow.sidebar).toBeUndefined();
  });

  it('creates and removes a node-specific sidebar configuration', () => {
    const fixture = TestBed.createComponent(EditorPageComponent);
    const component = fixture.componentInstance;
    const wards: FlowNode = { id: 'wards', componentId: 'ward-list', inputBindings: {}, children: [], transitions: [] };
    const patients: FlowNode = { id: 'patients', componentId: 'patient-list', inputBindings: {}, children: [], transitions: [] };
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
        id: 'source', title: 'Source', container: false, inputs: [],
        outputs: [{ name: 'selected', payload: { patientId: 'PATIENT_ID' } }]
      },
      {
        id: 'matching', title: 'Matching', container: false,
        inputs: [{ name: 'patientId', semanticType: 'PATIENT_ID', required: true, allowedValues: [] }],
        outputs: []
      },
      {
        id: 'other', title: 'Other', container: false,
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
    const other: FlowNode = {
      id: 'o', componentId: 'other',
      inputBindings: { wardId: { source: 'CONTEXT', contextKey: 'wardId' } },
      children: [], transitions: []
    };
    component.flow = { id: 'flow', name: 'Test', tool: 'WebclientTool', entryNodeId: 's', nodes: [source, matching, other] };

    // Nur Ziele mit kompatiblen semantischen Eingaben dürfen vorgeschlagen werden.
    expect(component.compatibleTargets(source, 'selected').map((node) => node.id)).toEqual(['s', 'm']);
  });
});
