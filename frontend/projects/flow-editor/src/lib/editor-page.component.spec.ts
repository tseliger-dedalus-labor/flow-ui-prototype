import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { FlowApiService, FlowNode } from 'flow-platform';
import { EditorPageComponent } from './editor-page.component';

class ApiServiceMock {
  failValidation = false;
  getRegistry() { return of([]); }
  getFlows() { return of([]); }
  getFlow() { return of({ id: 'f', name: 'n', entryNodeId: 'e', nodes: [] }); }
  updateFlow(flow: unknown) { return of(flow); }
  validateFlow() {
    if (this.failValidation) {
      return throwError(() => new Error('validation failed'));
    }
    return of({ valid: false, issues: [{ path: 'nodes.x', message: 'Fehler' }] });
  }
}

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
    component.flow = { id: 'flow', name: 'Test', entryNodeId: 'start', nodes: [] };

    component.validate();

    expect(component.issues.length).toBe(1);
    expect(component.issues[0].message).toBe('Fehler');
  });

  it('sets fallback issue when validation request fails', () => {
    const fixture = TestBed.createComponent(EditorPageComponent);
    const component = fixture.componentInstance;
    const api = TestBed.inject(FlowApiService) as unknown as ApiServiceMock;
    api.failValidation = true;
    component.flow = { id: 'flow', name: 'Test', entryNodeId: 'start', nodes: [] };

    component.validate();

    expect(component.issues.length).toBe(1);
    expect(component.issues[0].message).toContain('Validierung konnte nicht ausgeführt werden');
  });

  it('normalizes configured node permissions', () => {
    const fixture = TestBed.createComponent(EditorPageComponent);
    const node: FlowNode = { id: 'n', componentId: 'ward-list', inputBindings: {}, children: [], transitions: [] };

    fixture.componentInstance.setRequiredPermissions(node, ' APPOINTMENTS_READ, APPOINTMENTS_WRITE, APPOINTMENTS_READ ');

    expect(node.requiredPermissions).toEqual(['APPOINTMENTS_READ', 'APPOINTMENTS_WRITE']);
  });
});
