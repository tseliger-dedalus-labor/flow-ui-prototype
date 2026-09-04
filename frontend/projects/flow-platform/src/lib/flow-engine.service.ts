import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FlowDefinition, FlowNode, FlowSidebar } from './models';

/**
 * Verwaltet den navigierbaren Laufzeitzustand eines Flows inklusive Kontext und Rücksprunghistorie.
 */
@Injectable()
export class FlowEngineService {
  private definition?: FlowDefinition;
  private nodeMap = new Map<string, FlowNode>();
  // Für "Zurück" wird immer der vorherige Knoten samt Kontext-Snapshot abgelegt.
  private history: Array<{ nodeId: string; context: Record<string, unknown> }> = [];

  private currentNodeSubject = new BehaviorSubject<FlowNode | null>(null);
  private sidebarNodeSubject = new BehaviorSubject<FlowNode | null>(null);
  private sidebarSubject = new BehaviorSubject<FlowSidebar | null>(null);
  private contextSubject = new BehaviorSubject<Record<string, unknown>>({});

  /** Beobachtet den aktuell aktiven Hauptknoten. */
  readonly currentNode$ = this.currentNodeSubject.asObservable();
  /** Beobachtet den aktuell gerenderten Sidebar-Knoten. */
  readonly sidebarNode$ = this.sidebarNodeSubject.asObservable();
  /** Beobachtet die Sidebar-Konfiguration des geladenen Flows. */
  readonly sidebar$ = this.sidebarSubject.asObservable();
  /** Beobachtet den zwischen Knoten weitergereichten Flow-Kontext. */
  readonly context$ = this.contextSubject.asObservable();

  /**
   * Initialisiert den Engine-Zustand mit einer neuen Flow-Definition und setzt Navigation sowie Kontext zurück.
   */
  initialize(definition: FlowDefinition): void {
    this.definition = definition;
    this.nodeMap = new Map(definition.nodes.map((node) => [node.id, node]));
    this.history = [];
    const entry = this.nodeMap.get(definition.entryNodeId) ?? null;
    this.currentNodeSubject.next(entry);
    this.updateSidebar(entry);
    this.contextSubject.next({});
  }

  /**
   * Löst eine Transition vom aktuell sichtbaren Knoten aus.
   */
  transition(outputName: string, payload: unknown): void {
    const currentNode = this.currentNodeSubject.value;
    if (!currentNode) {
      return;
    }
    this.transitionFrom(currentNode.id, outputName, payload);
  }

  /**
   * Wechselt explizit von einem Quellknoten zu dessen Zielknoten und aktualisiert den Kontext gemäß Mapping.
   */
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
    // Alle Mapping-Ausdrücke werden gegen das eingehende Event und den bisherigen Kontext aufgelöst.
    for (const [key, expression] of Object.entries(transition.contextMapping ?? {})) {
      context[key] = this.resolveExpression(expression, payload, context);
    }

    // Der alte Zustand wird erst nach erfolgreicher Transition archiviert, damit "Zurück" exakt reproduzierbar bleibt.
    this.history.push({ nodeId: currentNode.id, context: { ...this.contextSubject.value } });
    this.contextSubject.next(context);
    const targetNode = this.nodeMap.get(transition.targetNodeId) ?? null;
    this.currentNodeSubject.next(targetNode);
    this.updateSidebar(targetNode);
  }

  /**
   * Springt zum zuletzt verlassenen Knoten zurück und stellt dessen Kontext wieder her.
   */
  goBack(): void {
    const previous = this.history.pop();
    if (!previous) {
      return;
    }
    const previousNode = this.nodeMap.get(previous.nodeId) ?? null;
    this.currentNodeSubject.next(previousNode);
    this.updateSidebar(previousNode);
    this.contextSubject.next(previous.context);
  }

  /**
   * Gibt an, ob ein Rücksprung über die gespeicherte Historie möglich ist.
   */
  canGoBack(): boolean {
    return this.history.length > 0;
  }

  /**
   * Aktiviert die knotenspezifische Sidebar oder den Flow-Fallback.
   */
  private updateSidebar(node: FlowNode | null): void {
    const sidebar = node?.sidebar ?? this.definition?.sidebar ?? null;
    this.sidebarSubject.next(sidebar);
    this.sidebarNodeSubject.next(sidebar ? this.nodeMap.get(sidebar.nodeId) ?? null : null);
  }

  /**
   * Löst die kleine Ausdruckssprache für Kontext-Mappings statisch zur Laufzeit auf.
   */
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
