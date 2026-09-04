import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { FlowApiService, FlowDefinition, FlowEngineService, FlowSummary, Tool } from 'flow-platform';
import { RuntimePageComponent } from './runtime-page.component';

/** Mockt die Tool-gefilterte Flow-Auswahl und das anschließende Laden einer Definition. */
class ApiServiceMock {
  failList = true;
  flows: FlowSummary[] = [];
  requestedTool?: Tool;
  loadedFlowIds: string[] = [];

  getFlows(tool: Tool) {
    this.requestedTool = tool;
    return this.failList ? throwError(() => new Error('boom')) : of(this.flows);
  }

  getFlow(id: string) {
    this.loadedFlowIds.push(id);
    const definition: FlowDefinition = {
      id,
      name: id,
      tool: 'WebclientTool',
      entryNodeId: 'entry',
      nodes: []
    };
    return of(definition);
  }
}

/** Einfacher Engine-Doppelzustand, damit die Seite ohne echte Navigation instanziierbar bleibt. */
class FlowEngineServiceMock {
  currentNode$ = new BehaviorSubject(null);
  sidebarNode$ = new BehaviorSubject(null);
  sidebar$ = new BehaviorSubject(null);
  context$ = new BehaviorSubject<Record<string, unknown>>({});
  initializedFlowIds: string[] = [];
  initialize(flow: FlowDefinition) { this.initializedFlowIds.push(flow.id); }
  goBack() {}
  canGoBack() { return false; }
}

/**
 * Schützt die Runtime-Seite als Integrationspunkt für geladene Flows.
 * Die Suite stellt sicher, dass Ladefehler sauber in einen Benutzerfehler übersetzt werden,
 * ohne die Laufzeitmaschine der Plattform zu beeinflussen.
 */
describe('RuntimePageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RuntimePageComponent],
      providers: [
        { provide: FlowApiService, useClass: ApiServiceMock },
        { provide: FlowEngineService, useClass: FlowEngineServiceMock }
      ]
    }).compileComponents();
  });

  it('sets an error message when tool flow loading fails', () => {
    const fixture = TestBed.createComponent(RuntimePageComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.error).toBe('Verfügbare Webclient-Flows konnten nicht geladen werden.');
  });

  it('waits for a user selection when multiple flows belong to the tool', () => {
    const fixture = TestBed.createComponent(RuntimePageComponent);
    const api = TestBed.inject(FlowApiService) as unknown as ApiServiceMock;
    const engine = TestBed.inject(FlowEngineService) as unknown as FlowEngineServiceMock;
    api.failList = false;
    api.flows = [
      { id: 'flow-normal', name: 'Standardfluss', tool: 'WebclientTool', active: true },
      { id: 'flow-orders', name: 'Auftragsfokus', tool: 'WebclientTool', active: false }
    ];

    fixture.detectChanges();

    expect(api.requestedTool).toBe('WebclientTool');
    expect(api.loadedFlowIds).toEqual([]);
    expect(fixture.componentInstance.flowStarted).toBeFalse();

    fixture.componentInstance.selectedFlowId = 'flow-orders';
    fixture.componentInstance.startFlow();

    expect(api.loadedFlowIds).toEqual(['flow-orders']);
    expect(engine.initializedFlowIds).toEqual(['flow-orders']);
    expect(fixture.componentInstance.flowStarted).toBeTrue();
  });

  it('starts the only available tool flow automatically', () => {
    const fixture = TestBed.createComponent(RuntimePageComponent);
    const api = TestBed.inject(FlowApiService) as unknown as ApiServiceMock;
    const engine = TestBed.inject(FlowEngineService) as unknown as FlowEngineServiceMock;
    api.failList = false;
    api.flows = [
      { id: 'flow-normal', name: 'Standardfluss', tool: 'WebclientTool', active: true }
    ];

    fixture.detectChanges();

    expect(api.loadedFlowIds).toEqual(['flow-normal']);
    expect(engine.initializedFlowIds).toEqual(['flow-normal']);
    expect(fixture.componentInstance.flowStarted).toBeTrue();
  });
});
