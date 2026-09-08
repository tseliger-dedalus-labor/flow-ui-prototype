import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import {
  FlowApiService,
  FlowEngineService,
  FlowEngineState,
  Tool,
  ViewRouterService
} from 'flow-platform';
import { AppointmentsPageComponent } from './appointments-page.component';

/** API-Doppel für die Tool-Zuordnung und das automatische Starten eines eindeutigen Termin-Flows. */
class ApiServiceMock {
  requestedTool?: Tool;

  getFlows(tool: Tool) {
    this.requestedTool = tool;
    return of([
      { id: 'flow-appointments', name: 'Terminplanung', tool: 'AppointmentTool' as const, active: false }
    ]);
  }

}

/** Minimale Engine für den Startnachweis der Termin-Runtime. */
class FlowEngineServiceMock {
  currentNode$ = new BehaviorSubject(null);
  sidebarNode$ = new BehaviorSubject(null);
  sidebar$ = new BehaviorSubject(null);
  sidebarPanels$ = new BehaviorSubject([]);
  sidebarMode$ = new BehaviorSubject('SINGLE');
  context$ = new BehaviorSubject<Record<string, unknown>>({});
  state$ = new BehaviorSubject<FlowEngineState | null>(null);
  initializedFlowIds: string[] = [];

  start(flowId: string) {
    this.initializedFlowIds.push(flowId);
    this.state$.next({ flowId, executionId: `run-${flowId}` });
    return of({});
  }
  snapshot() { return this.state$.value; }
  goBack() {}
  canGoBack() { return false; }
}

class ViewRouterServiceMock {
  read() { return undefined; }
  write() {}
  clearByPrefix() {}
}

describe('AppointmentsPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentsPageComponent],
      providers: [
        { provide: FlowApiService, useClass: ApiServiceMock },
        { provide: FlowEngineService, useClass: FlowEngineServiceMock },
        { provide: ViewRouterService, useClass: ViewRouterServiceMock }
      ]
    }).compileComponents();
  });

  it('loads AppointmentTool flows and starts the only available flow', () => {
    const fixture = TestBed.createComponent(AppointmentsPageComponent);
    const api = TestBed.inject(FlowApiService) as unknown as ApiServiceMock;
    const engine = TestBed.inject(FlowEngineService) as unknown as FlowEngineServiceMock;

    fixture.detectChanges();

    expect(api.requestedTool).toBe('AppointmentTool');
    expect(engine.initializedFlowIds).toEqual(['flow-appointments']);
    expect(fixture.componentInstance.flowStarted).toBeTrue();
  });
});
