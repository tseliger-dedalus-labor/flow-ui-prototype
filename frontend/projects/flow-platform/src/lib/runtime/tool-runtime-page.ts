import { Directive, OnDestroy, OnInit } from '@angular/core';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { AContentPresenter } from 'ui-framework';
import { FlowApiService } from '../flow-api.service';
import { FlowEngineService, FlowEngineState } from '../flow-engine.service';
import { FlowNode, FlowSidebar, FlowSummary, Tool } from '../models';
import { ViewRouterService } from '../routing/view-router.service';

interface RoutedToolRuntimeState {
  flowId: string;
  engine: FlowEngineState;
}

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
          this.loadFlow(restoredState!.engine);
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

  private loadFlow(restoredState?: FlowEngineState): void {
    if (!this.selectedFlowId) {
      this.loading = false;
      return;
    }
    this.error = '';
    this.flowStarted = false;
    this.loading = true;
    this.api.getFlow(this.selectedFlowId).subscribe({
      next: (definition) => {
        this.engine.initialize(definition, restoredState);
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

  /**
   * Delegiert den Rücksprung an die Flow-Engine.
   */
  back(): void {
    this.engine.goBack();
  }

  ngOnDestroy(): void {
    this.engineStateSubscription.unsubscribe();
  }

  private readRestoredState(): RoutedToolRuntimeState | null {
    const value = this.viewRouter.read(TOOL_RUNTIME_SCOPE);
    if (!isRecord(value)
      || typeof value['flowId'] !== 'string'
      || !FlowEngineService.isState(value['engine'])) {
      return null;
    }
    return {
      flowId: value['flowId'],
      engine: value['engine']
    };
  }

  private persistState(engine: FlowEngineState): void {
    this.viewRouter.write(TOOL_RUNTIME_SCOPE, {
      flowId: this.selectedFlowId,
      engine
    } satisfies RoutedToolRuntimeState);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
