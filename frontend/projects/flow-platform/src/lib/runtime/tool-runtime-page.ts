import { Directive, OnInit } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { FlowApiService } from '../flow-api.service';
import { FlowEngineService } from '../flow-engine.service';
import { FlowNode, FlowSidebar, FlowSummary, Tool } from '../models';

/**
 * Gemeinsame Steuerungslogik für Tool-Einstiege mit einem oder mehreren auswählbaren Flows.
 */
@Directive()
export abstract class ToolRuntimePage implements OnInit {
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

  protected constructor(
    public readonly engine: FlowEngineService,
    private readonly api: FlowApiService,
    private readonly tool: Tool,
    private readonly listError: string,
    private readonly loadError: string
  ) {
    this.vm$ = combineLatest({
      node: this.engine.currentNode$,
      sidebarNode: this.engine.sidebarNode$,
      sidebar: this.engine.sidebar$,
      context: this.engine.context$
    });
  }

  /**
   * Lädt die dem Tool zugeordneten Flows und startet einen eindeutigen Flow direkt.
   */
  ngOnInit(): void {
    this.api.getFlows(this.tool).subscribe({
      next: (flows) => {
        this.flows = flows;
        this.selectedFlowId = flows[0]?.id ?? '';
        if (flows.length === 0) {
          this.error = 'Für dieses Tool ist kein Flow verfügbar.';
        } else if (flows.length === 1) {
          this.startFlow();
        }
      },
      error: () => this.error = this.listError
    });
  }

  /**
   * Lädt und startet den ausgewählten Flow.
   */
  startFlow(): void {
    if (!this.selectedFlowId) {
      return;
    }
    this.error = '';
    this.flowStarted = false;
    this.api.getFlow(this.selectedFlowId).subscribe({
      next: (definition) => {
        this.engine.initialize(definition);
        this.flowStarted = true;
      },
      error: () => this.error = this.loadError
    });
  }

  /**
   * Delegiert den Rücksprung an die Flow-Engine.
   */
  back(): void {
    this.engine.goBack();
  }
}
