import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import {
  FlowApiService,
  FlowEngineService,
  FlowEngineState,
  Tool,
  ViewRouterService
} from 'flow-platform';
import { ReportcenterPageComponent } from './reportcenter-page.component';

class ApiServiceMock {
  requestedTool?: Tool;

  getFlows(tool: Tool) {
    this.requestedTool = tool;
    return of([
      { id: 'flow-reportcenter', name: 'Reportcenter', tool: 'ReportcenterTool' as const, active: false }
    ]);
  }

}

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
    this.state$.next({ flowId, executionId: `run-${flowId}`, resumeToken: `resume-${flowId}` });
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

describe('ReportcenterPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportcenterPageComponent],
      providers: [
        { provide: FlowApiService, useClass: ApiServiceMock },
        { provide: FlowEngineService, useClass: FlowEngineServiceMock },
        { provide: ViewRouterService, useClass: ViewRouterServiceMock }
      ]
    }).compileComponents();
  });

  it('loads ReportcenterTool flows and starts the only available flow', () => {
    const fixture = TestBed.createComponent(ReportcenterPageComponent);
    const api = TestBed.inject(FlowApiService) as unknown as ApiServiceMock;
    const engine = TestBed.inject(FlowEngineService) as unknown as FlowEngineServiceMock;

    fixture.detectChanges();

    expect(api.requestedTool).toBe('ReportcenterTool');
    expect(engine.initializedFlowIds).toEqual(['flow-reportcenter']);
    expect(fixture.componentInstance.flowStarted).toBeTrue();
  });
});
