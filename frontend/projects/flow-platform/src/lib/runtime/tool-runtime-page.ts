import { Directive, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { AContentPresenter } from 'ui-framework';
import { FlowApiService } from '../flow-api.service';
import { FlowEngineService, FlowEngineState, FlowSidebarPanel } from '../flow-engine.service';
import { FlowNode, FlowSidebar, FlowSummary, SidebarMode, Tool } from '../models';
import { ViewRouterService } from '../routing/view-router.service';

const TOOL_RUNTIME_SCOPE = 'tool-runtime';
const FLOW_TABS_SCOPE_PREFIX = 'flow-tabs:';

/**
 * Gemeinsame Steuerungslogik für Tool-Einstiege mit einem oder mehreren auswählbaren Flows.
 */
@Directive()
export abstract class ToolRuntimePage extends AContentPresenter implements OnInit, OnDestroy {
  flows: FlowSummary[] = [];
  selectedFlowId = '';
  flowStarted = false;
  error = '';
  readonly vm$: Observable<{
    node: FlowNode | null;
    sidebarNode: FlowNode | null;
    sidebar: FlowSidebar | null;
    sidebarPanels: FlowSidebarPanel[];
    sidebarMode: SidebarMode;
    context: Record<string, unknown>;
  }>;
  private readonly engineStateSubscription: Subscription;

  protected constructor(
    public readonly engine: FlowEngineService,
    private readonly api: FlowApiService,
    private readonly viewRouter: ViewRouterService,
    tool: Tool,
    private readonly listError: string,
    private readonly loadError: string
  ) {
    super(tool);
    this.vm$ = combineLatest({
      node: this.engine.currentNode$,
      sidebarNode: this.engine.sidebarNode$,
      sidebar: this.engine.sidebar$,
      sidebarPanels: this.engine.sidebarPanels$,
      sidebarMode: this.engine.sidebarMode$,
      context: this.engine.context$
    });
    this.engineStateSubscription = this.engine.state$.subscribe((state) => {
      if (state && this.flowStarted && this.selectedFlowId) {
        this.persistState(state);
      }
    });
  }

  /**
   * Lädt die dem Tool zugeordneten Flows und startet einen eindeutigen Flow direkt.
   */
  ngOnInit(): void {
    const restoredState = this.readRestoredState();
    this.loading = true;
    this.api.getFlows(this.tool).subscribe({
      next: (flows) => {
        this.flows = flows;
        const restoredFlowExists = restoredState
          ? flows.some((flow) => flow.id === restoredState.flowId)
          : false;
        this.selectedFlowId = restoredFlowExists ? restoredState!.flowId : flows[0]?.id ?? '';
        if (flows.length === 0) {
          this.error = 'Für dieses Tool ist kein Flow verfügbar.';
          this.loading = false;
        } else if (restoredFlowExists) {
          this.restoreFlow(restoredState!.executionId);
        } else if (flows.length === 1) {
          this.startFlow();
        } else {
          this.loading = false;
        }
      },
      error: () => {
        this.error = this.listError;
        this.loading = false;
      }
    });
  }

  /**
   * Lädt und startet den ausgewählten Flow.
   */
  startFlow(): void {
    this.viewRouter.clearByPrefix(FLOW_TABS_SCOPE_PREFIX);
    this.loadFlow();
  }

  private loadFlow(): void {
    if (!this.selectedFlowId) {
      this.loading = false;
      return;
    }
    this.error = '';
    this.flowStarted = false;
    this.loading = true;
    this.engine.start(this.selectedFlowId).subscribe({
      next: () => {
        this.flowStarted = true;
        this.loading = false;
        const state = this.engine.snapshot();
        if (state) {
          this.persistState(state);
        }
      },
      error: () => {
        this.error = this.loadError;
        this.loading = false;
      }
    });
  }

  private restoreFlow(executionId: string): void {
    this.error = '';
    this.loading = true;
    this.engine.restore(executionId).subscribe({
      next: () => {
        this.flowStarted = true;
        this.loading = false;
      },
      error: () => this.loadFlow()
    });
  }

  /**
   * Delegiert den Rücksprung an die Flow-Engine.
   */
  back(): void {
    this.engine.goBack();
  }

  ngOnDestroy(): void {
    this.engineStateSubscription.unsubscribe();
  }

  private readRestoredState(): FlowEngineState | null {
    const value = this.viewRouter.read(TOOL_RUNTIME_SCOPE);
    if (!FlowEngineService.isState(value)) {
      return null;
    }
    return value;
  }

  private persistState(engine: FlowEngineState): void {
    this.viewRouter.write(TOOL_RUNTIME_SCOPE, engine);
  }
}
