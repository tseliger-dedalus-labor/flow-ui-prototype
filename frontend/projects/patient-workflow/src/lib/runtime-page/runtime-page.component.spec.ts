import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import {
  FlowApiService,
  FlowEngineService,
  FlowEngineState,
  FlowSummary,
  Tool,
  ViewRouterService
} from 'flow-platform';
import { RuntimePageComponent } from './runtime-page.component';

/** Mockt die Tool-gefilterte Flow-Auswahl und das anschließende Laden einer Definition. */
class ApiServiceMock {
  failList = true;
  flows: FlowSummary[] = [];
  requestedTool?: Tool;

  getFlows(tool: Tool) {
    this.requestedTool = tool;
    return this.failList ? throwError(() => new Error('boom')) : of(this.flows);
  }

}

/** Einfacher Engine-Doppelzustand, damit die Seite ohne echte Navigation instanziierbar bleibt. */
class FlowEngineServiceMock {
  currentNode$ = new BehaviorSubject(null);
  sidebarNode$ = new BehaviorSubject(null);
  sidebar$ = new BehaviorSubject(null);
  sidebarPanels$ = new BehaviorSubject([]);
  sidebarMode$ = new BehaviorSubject('SINGLE');
  context$ = new BehaviorSubject<Record<string, unknown>>({});
  state$ = new BehaviorSubject<FlowEngineState | null>(null);
  startedFlowIds: string[] = [];
  restoredExecutionIds: string[] = [];
  start(flowId: string) {
    this.startedFlowIds.push(flowId);
    this.state$.next({ flowId, executionId: `run-${flowId}`, resumeToken: `resume-${flowId}` });
    return of({});
  }
  restore(resumeToken: string) {
    this.restoredExecutionIds.push(resumeToken);
    this.state$.next({ flowId: 'flow-orders', executionId: 'new-run', resumeToken });
    return of({});
  }
  snapshot() { return this.state$.value; }
  goBack() {}
  canGoBack() { return false; }
}

class ViewRouterServiceMock {
  state: unknown;
  readonly writes: unknown[] = [];
  clearedPrefixes: string[] = [];

  read() { return this.state; }
  write(_scope: string, state: unknown) { this.writes.push(state); }
  clearByPrefix(prefix: string) { this.clearedPrefixes.push(prefix); }
  applyVerifiedScopes() {}
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
        { provide: FlowEngineService, useClass: FlowEngineServiceMock },
        { provide: ViewRouterService, useClass: ViewRouterServiceMock }
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
    expect(engine.startedFlowIds).toEqual([]);
    expect(fixture.componentInstance.flowStarted).toBeFalse();

    fixture.componentInstance.selectedFlowId = 'flow-orders';
    fixture.componentInstance.startFlow();

    expect(engine.startedFlowIds).toEqual(['flow-orders']);
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

    expect(engine.startedFlowIds).toEqual(['flow-normal']);
    expect(fixture.componentInstance.flowStarted).toBeTrue();
  });

  it('restores a linked flow automatically even when several flows are available', () => {
    const fixture = TestBed.createComponent(RuntimePageComponent);
    const api = TestBed.inject(FlowApiService) as unknown as ApiServiceMock;
    const engine = TestBed.inject(FlowEngineService) as unknown as FlowEngineServiceMock;
    const viewRouter = TestBed.inject(ViewRouterService) as unknown as ViewRouterServiceMock;
    const restoredEngine: FlowEngineState = {
      flowId: 'flow-orders',
      executionId: 'run-orders',
      resumeToken: 'resume-orders.signature'
    };
    api.failList = false;
    api.flows = [
      { id: 'flow-normal', name: 'Standardfluss', tool: 'WebclientTool', active: true },
      { id: 'flow-orders', name: 'Auftragsfokus', tool: 'WebclientTool', active: false }
    ];
    viewRouter.state = restoredEngine;

    fixture.detectChanges();

    expect(engine.restoredExecutionIds).toEqual(['resume-orders.signature']);
    expect(viewRouter.clearedPrefixes).toEqual([]);
  });

  it('starts a flow instead of restoring an unsigned runtime state', () => {
    const fixture = TestBed.createComponent(RuntimePageComponent);
    const api = TestBed.inject(FlowApiService) as unknown as ApiServiceMock;
    const engine = TestBed.inject(FlowEngineService) as unknown as FlowEngineServiceMock;
    const viewRouter = TestBed.inject(ViewRouterService) as unknown as ViewRouterServiceMock;
    api.failList = false;
    api.flows = [
      { id: 'flow-normal', name: 'Standardfluss', tool: 'WebclientTool', active: true }
    ];
    viewRouter.state = {
      flowId: 'flow-normal',
      executionId: 'run-normal',
      resumeToken: ''
    };

    fixture.detectChanges();

    expect(engine.startedFlowIds).toEqual(['flow-normal']);
    expect(engine.restoredExecutionIds).toEqual([]);
  });
});
