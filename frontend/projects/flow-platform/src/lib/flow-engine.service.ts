import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { IxtDisplayType } from './ixt-display-type';
import { FlowDefinition, FlowNode, FlowSidebar, SidebarMode } from './models';
import { PrtType } from './prt-type';

export interface FlowSidebarPanel {
  node: FlowNode;
  sidebar: FlowSidebar;
}

export interface FlowEngineState {
  currentNodeId: string | null;
  context: Record<string, unknown>;
  history: Array<{ nodeId: string; context: Record<string, unknown> }>;
}

/**
 * Verwaltet den navigierbaren Laufzeitzustand eines Flows inklusive Kontext und Rücksprunghistorie.
 */
@Injectable()
export class FlowEngineService {
  private definition?: FlowDefinition;
  private nodeMap = new Map<string, FlowNode>();
  private componentIdByDisplayType = new Map<IxtDisplayType, string>();
  // Bei einer gefundenen Transition wird der aktuell angezeigte Knoten samt Kontext-Snapshot für "Zurück" gespeichert.
  private history: Array<{ nodeId: string; context: Record<string, unknown> }> = [];

  private currentNodeSubject = new BehaviorSubject<FlowNode | null>(null);
  private sidebarNodeSubject = new BehaviorSubject<FlowNode | null>(null);
  private sidebarSubject = new BehaviorSubject<FlowSidebar | null>(null);
  private sidebarPanelsSubject = new BehaviorSubject<FlowSidebarPanel[]>([]);
  private sidebarModeSubject = new BehaviorSubject<SidebarMode>('SINGLE');
  private contextSubject = new BehaviorSubject<Record<string, unknown>>({});
  private stateSubject = new BehaviorSubject<FlowEngineState | null>(null);

  /** Beobachtet den aktuell aktiven Hauptknoten. */
  readonly currentNode$ = this.currentNodeSubject.asObservable();
  /** Beobachtet den aktuell gerenderten Sidebar-Knoten. */
  readonly sidebarNode$ = this.sidebarNodeSubject.asObservable();
  /** Beobachtet die Sidebar-Konfiguration des geladenen Flows. */
  readonly sidebar$ = this.sidebarSubject.asObservable();
  /** Beobachtet alle im Flow referenzierten Sidebar-Knoten. */
  readonly sidebarPanels$ = this.sidebarPanelsSubject.asObservable();
  /** Beobachtet den konfigurierten Darstellungsmodus der Sidebar. */
  readonly sidebarMode$ = this.sidebarModeSubject.asObservable();
  /** Beobachtet den zwischen Knoten weitergereichten Flow-Kontext. */
  readonly context$ = this.contextSubject.asObservable();
  /** Beobachtet den für die URL-Persistenz vorgesehenen Navigationszustand. */
  readonly state$ = this.stateSubject.asObservable();

  /**
   * Registriert die im aktuellen Tool verfügbaren Komponenten für DisplayType-basierte Ziele.
   */
  registerDisplayTypes(entries: Array<{ componentId: string; displayType?: IxtDisplayType }>): void {
    this.componentIdByDisplayType = new Map(
      entries
        .filter((entry): entry is { componentId: string; displayType: IxtDisplayType } => !!entry.displayType)
        .map((entry) => [entry.displayType, entry.componentId])
    );
  }

  /**
   * Initialisiert den Engine-Zustand mit einer neuen Flow-Definition und setzt Navigation sowie Kontext zurück.
   */
  initialize(definition: FlowDefinition, restoredState?: FlowEngineState): void {
    this.definition = definition;
    this.nodeMap = new Map(definition.nodes.map((node) => [node.id, node]));
    this.sidebarPanelsSubject.next(this.collectSidebarPanels(definition));
    this.sidebarModeSubject.next(definition.sidebarMode ?? 'SINGLE');
    const entry = this.nodeMap.get(definition.entryNodeId) ?? null;
    const currentNode = restoredState
      ? this.nodeMap.get(restoredState.currentNodeId ?? '') ?? entry
      : entry;
    this.history = restoredState
      ? restoredState.history
        .filter((item) => this.nodeMap.has(item.nodeId))
        .map((item) => ({ nodeId: item.nodeId, context: { ...item.context } }))
      : [];
    this.currentNodeSubject.next(currentNode);
    this.updateSidebar(currentNode);
    this.contextSubject.next(restoredState ? { ...restoredState.context } : {});
    this.emitState();
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

    // Der bisherige Zustand wird nach gefundener Transition vor dem Zustandswechsel archiviert.
    this.history.push({ nodeId: currentNode.id, context: { ...this.contextSubject.value } });
    this.contextSubject.next(context);
    const targetNode = this.resolveTargetNode(transition, payload);
    this.currentNodeSubject.next(targetNode);
    this.updateSidebar(targetNode);
    this.emitState();
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
    this.emitState();
  }

  /**
   * Gibt an, ob ein Rücksprung über die gespeicherte Historie möglich ist.
   */
  canGoBack(): boolean {
    return this.history.length > 0;
  }

  /**
   * Liefert einen vom internen Zustand entkoppelten Snapshot für URL-Persistenz.
   */
  snapshot(): FlowEngineState | null {
    const state = this.stateSubject.value;
    return state ? {
      currentNodeId: state.currentNodeId,
      context: { ...state.context },
      history: state.history.map((item) => ({
        nodeId: item.nodeId,
        context: { ...item.context }
      }))
    } : null;
  }

  /**
   * Prüft unbekannte URL-Daten vor der Wiederherstellung des Engine-Zustands.
   */
  static isState(value: unknown): value is FlowEngineState {
    if (!isRecord(value)) {
      return false;
    }
    const currentNodeId = value['currentNodeId'];
    const history = value['history'];
    return (typeof currentNodeId === 'string' || currentNodeId === null)
      && isRecord(value['context'])
      && Array.isArray(history)
      && history.every((item) => isHistoryEntry(item));
  }

  /**
   * Aktiviert die knotenspezifische Sidebar oder den Flow-Fallback.
   */
  private updateSidebar(node: FlowNode | null): void {
    const sidebar = node?.sidebar ?? this.definition?.sidebar ?? null;
    this.sidebarSubject.next(sidebar);
    this.sidebarNodeSubject.next(sidebar ? this.nodeMap.get(sidebar.nodeId) ?? null : null);
  }

  private collectSidebarPanels(definition: FlowDefinition): FlowSidebarPanel[] {
    const sidebars = new Map<string, FlowSidebar>();
    for (const node of definition.nodes) {
      if (node.sidebar && !sidebars.has(node.sidebar.nodeId)) {
        sidebars.set(node.sidebar.nodeId, node.sidebar);
      }
    }
    if (definition.sidebar && !sidebars.has(definition.sidebar.nodeId)) {
      sidebars.set(definition.sidebar.nodeId, definition.sidebar);
    }
    return definition.nodes.flatMap((node) => {
      const sidebar = sidebars.get(node.id);
      return sidebar ? [{ node, sidebar }] : [];
    });
  }

  private resolveTargetNode(
    transition: FlowNode['transitions'][number],
    payload: unknown
  ): FlowNode | null {
    if (isRecord(payload) && typeof payload['prtType'] === 'string') {
      const displayType = transition.prtTypeDisplayTypes?.[payload['prtType'] as PrtType];
      const componentId = displayType && this.componentIdByDisplayType.get(displayType);
      if (componentId) {
        return this.definition?.nodes.find((node) => node.componentId === componentId) ?? null;
      }
    }
    return this.nodeMap.get(transition.targetNodeId) ?? null;
  }

  private emitState(): void {
    this.stateSubject.next({
      currentNodeId: this.currentNodeSubject.value?.id ?? null,
      context: { ...this.contextSubject.value },
      history: this.history.map((item) => ({
        nodeId: item.nodeId,
        context: { ...item.context }
      }))
    });
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

function isHistoryEntry(value: unknown): value is FlowEngineState['history'][number] {
  return isRecord(value)
    && typeof value['nodeId'] === 'string'
    && isRecord(value['context']);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
