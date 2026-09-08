import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { FlowApiService } from './flow-api.service';
import { FlowExecutionView, FlowNode, FlowSidebar, SidebarMode } from './models';

export interface FlowSidebarPanel {
  node: FlowNode;
  sidebar: FlowSidebar;
}

export interface FlowEngineState {
  flowId: string;
  executionId?: string;
  resumeToken: string;
}

/**
 * Spiegelt eine serverseitige Flow-Ausführung für die Angular-Darstellung.
 */
@Injectable()
export class FlowEngineService {
  private execution: FlowExecutionView | null = null;
  private requestPending = false;

  private readonly currentNodeSubject = new BehaviorSubject<FlowNode | null>(null);
  private readonly sidebarNodeSubject = new BehaviorSubject<FlowNode | null>(null);
  private readonly sidebarSubject = new BehaviorSubject<FlowSidebar | null>(null);
  private readonly sidebarPanelsSubject = new BehaviorSubject<FlowSidebarPanel[]>([]);
  private readonly sidebarModeSubject = new BehaviorSubject<SidebarMode>('SINGLE');
  private readonly contextSubject = new BehaviorSubject<Record<string, unknown>>({});
  private readonly stateSubject = new BehaviorSubject<FlowEngineState | null>(null);

  readonly currentNode$ = this.currentNodeSubject.asObservable();
  readonly sidebarNode$ = this.sidebarNodeSubject.asObservable();
  readonly sidebar$ = this.sidebarSubject.asObservable();
  readonly sidebarPanels$ = this.sidebarPanelsSubject.asObservable();
  readonly sidebarMode$ = this.sidebarModeSubject.asObservable();
  readonly context$ = this.contextSubject.asObservable();
  readonly state$ = this.stateSubject.asObservable();

  constructor(private readonly api: FlowApiService) {}

  start(flowId: string): Observable<FlowExecutionView> {
    return this.api.startExecution(flowId).pipe(tap((view) => this.apply(view)));
  }

  restore(resumeToken: string): Observable<FlowExecutionView> {
    return this.api.resumeExecution(resumeToken).pipe(tap((view) => this.apply(view)));
  }

  transition(outputName: string, payload: unknown): void {
    const nodeId = this.currentNodeSubject.value?.id;
    if (nodeId) {
      this.transitionFrom(nodeId, outputName, payload);
    }
  }

  transitionFrom(sourceNodeId: string, outputName: string, payload: unknown): void {
    if (!this.execution || this.requestPending) {
      return;
    }
    this.requestPending = true;
    this.api.transition(
      this.execution.executionId,
      this.execution.version,
      sourceNodeId,
      outputName,
      payload
    ).subscribe({
      next: (view) => {
        this.apply(view);
        this.requestPending = false;
      },
      error: () => this.requestPending = false
    });
  }

  goBack(): void {
    if (!this.execution || !this.execution.canGoBack || this.requestPending) {
      return;
    }
    this.requestPending = true;
    this.api.back(this.execution.executionId, this.execution.version).subscribe({
      next: (view) => {
        this.apply(view);
        this.requestPending = false;
      },
      error: () => this.requestPending = false
    });
  }

  canGoBack(): boolean {
    return this.execution?.canGoBack ?? false;
  }

  inputsFor(nodeId: string): Record<string, unknown> {
    return this.execution?.resolvedInputsByNode[nodeId] ?? {};
  }

  snapshot(): FlowEngineState | null {
    return this.execution
      ? {
          flowId: this.execution.flowId,
          executionId: this.execution.executionId,
          resumeToken: this.execution.resumeToken
        }
      : null;
  }

  static isState(value: unknown): value is FlowEngineState {
    return isRecord(value)
      && typeof value['flowId'] === 'string'
      && typeof value['resumeToken'] === 'string';
  }

  private apply(view: FlowExecutionView): void {
    this.execution = view;
    const nodes = new Map(view.definition.nodes.map((node) => [node.id, node]));
    const currentNode = nodes.get(view.currentNodeId) ?? null;
    const sidebar = currentNode?.sidebar ?? view.definition.sidebar ?? null;
    this.currentNodeSubject.next(currentNode);
    this.sidebarSubject.next(sidebar);
    this.sidebarNodeSubject.next(sidebar ? nodes.get(sidebar.nodeId) ?? null : null);
    this.sidebarModeSubject.next(view.definition.sidebarMode ?? 'SINGLE');
    this.sidebarPanelsSubject.next(this.collectSidebarPanels(view.definition.nodes, view.definition.sidebar));
    this.contextSubject.next({ ...view.context });
    this.stateSubject.next({
      flowId: view.flowId,
      executionId: view.executionId,
      resumeToken: view.resumeToken
    });
  }

  private collectSidebarPanels(nodes: FlowNode[], fallback?: FlowSidebar): FlowSidebarPanel[] {
    const sidebars = new Map<string, FlowSidebar>();
    for (const node of nodes) {
      if (node.sidebar && !sidebars.has(node.sidebar.nodeId)) {
        sidebars.set(node.sidebar.nodeId, node.sidebar);
      }
    }
    if (fallback && !sidebars.has(fallback.nodeId)) {
      sidebars.set(fallback.nodeId, fallback);
    }
    return nodes.flatMap((node) => {
      const sidebar = sidebars.get(node.id);
      return sidebar ? [{ node, sidebar }] : [];
    });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
