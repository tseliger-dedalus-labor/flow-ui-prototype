import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { FlowApiService, FlowDefinition, FlowEngineService, Tool } from 'flow-platform';
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

  getFlow(id: string) {
    const definition: FlowDefinition = {
      id,
      name: 'Terminplanung',
      tool: 'AppointmentTool',
      entryNodeId: 'appointments',
      nodes: []
    };
    return of(definition);
  }
}

/** Minimale Engine für den Startnachweis der Termin-Runtime. */
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

describe('AppointmentsPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentsPageComponent],
      providers: [
        { provide: FlowApiService, useClass: ApiServiceMock },
        { provide: FlowEngineService, useClass: FlowEngineServiceMock }
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
