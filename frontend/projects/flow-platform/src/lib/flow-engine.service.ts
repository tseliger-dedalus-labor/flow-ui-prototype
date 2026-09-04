import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FlowDefinition, FlowNode, FlowSidebar } from './models';

@Injectable()
export class FlowEngineService {
  private definition?: FlowDefinition;
  private nodeMap = new Map<string, FlowNode>();
  private history: Array<{ nodeId: string; context: Record<string, unknown> }> = [];

  private currentNodeSubject = new BehaviorSubject<FlowNode | null>(null);
  private sidebarNodeSubject = new BehaviorSubject<FlowNode | null>(null);
  private sidebarSubject = new BehaviorSubject<FlowSidebar | null>(null);
  private contextSubject = new BehaviorSubject<Record<string, unknown>>({});

  readonly currentNode$ = this.currentNodeSubject.asObservable();
  readonly sidebarNode$ = this.sidebarNodeSubject.asObservable();
  readonly sidebar$ = this.sidebarSubject.asObservable();
  readonly context$ = this.contextSubject.asObservable();

  initialize(definition: FlowDefinition): void {
    this.definition = definition;
    this.nodeMap = new Map(definition.nodes.map((node) => [node.id, node]));
    this.history = [];
    const entry = this.nodeMap.get(definition.entryNodeId) ?? null;
    this.currentNodeSubject.next(entry);
    this.sidebarNodeSubject.next(definition.sidebar ? this.nodeMap.get(definition.sidebar.nodeId) ?? null : null);
    this.sidebarSubject.next(definition.sidebar ?? null);
    this.contextSubject.next({});
  }

  transition(outputName: string, payload: unknown): void {
    const currentNode = this.currentNodeSubject.value;
    if (!currentNode) {
      return;
    }
    this.transitionFrom(currentNode.id, outputName, payload);
  }

  transitionFrom(sourceNodeId: string, outputName: string, payload: unknown): void {
    const sourceNode = this.nodeMap.get(sourceNodeId);
    const currentNode = this.currentNodeSubject.value;
    if (!sourceNode || !currentNode) {
      return;
    }
    const transition = sourceNode.transitions.find((item) => item.onOutput === outputName);
    if (!transition) {
      return;
    }

    const context = { ...this.contextSubject.value };
    for (const [key, expression] of Object.entries(transition.contextMapping ?? {})) {
      context[key] = this.resolveExpression(expression, payload, context);
    }

    this.history.push({ nodeId: currentNode.id, context: { ...this.contextSubject.value } });
    this.contextSubject.next(context);
    this.currentNodeSubject.next(this.nodeMap.get(transition.targetNodeId) ?? null);
  }

  goBack(): void {
    const previous = this.history.pop();
    if (!previous) {
      return;
    }
    this.currentNodeSubject.next(this.nodeMap.get(previous.nodeId) ?? null);
    this.contextSubject.next(previous.context);
  }

  canGoBack(): boolean {
    return this.history.length > 0;
  }

  private resolveExpression(expression: string, payload: unknown, context: Record<string, unknown>): unknown {
    if (expression?.startsWith('$event.')) {
      const key = expression.slice(7);
      return (payload as Record<string, unknown> | undefined)?.[key];
    }
    if (expression?.startsWith('$context.')) {
      const key = expression.slice(9);
      return context[key];
    }
    return expression;
  }
}
