import { Component, OnDestroy, OnInit } from '@angular/core';
import { KeyValuePipe } from '@angular/common';

import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime } from 'rxjs';
import {
  ComponentDescriptor,
  FlowApiService,
  FlowDefinition,
  FlowTransition,
  FlowNode,
  InputBinding,
  InputDescriptor,
  OutputDescriptor,
  TOOL_MODULES,
  Tool,
  ValidationIssue,
  ViewRouterService
} from 'flow-platform';

interface RoutedEditorState {
  flowId: string;
  nodeId: string;
}

const EDITOR_SCOPE = 'flow-editor';

/**
 * Bietet eine einfache Authoring-Oberfläche zum Laden, Prüfen und Speichern von Flow-Definitionen.
 */
@Component({
    selector: 'app-editor-page',
    imports: [FormsModule, KeyValuePipe],
    templateUrl: './editor-page.component.html',
    styleUrl: './editor-page.component.scss'
})
export class EditorPageComponent implements OnInit, OnDestroy {
  readonly tools: Tool[] = ['WebclientTool', 'AppointmentTool', 'ReportcenterTool'];
  readonly toolModules = TOOL_MODULES;
  flows: Array<{ id: string; name: string }> = [];
  registry: ComponentDescriptor[] = [];
  flow?: FlowDefinition;
  selectedFlowId = '';
  selectedNodeId = '';
  issues: ValidationIssue[] = [];
  status = '';
  validationPerformed = false;
  isNewFlow = false;

  private readonly validationTrigger = new Subject<void>();
  private readonly validationSubscription: Subscription;
  private flowLoadRequest = 0;

  constructor(
    private readonly api: FlowApiService,
    private readonly viewRouter: ViewRouterService
  ) {
    // Validierung wird bewusst entprellt, damit Formularänderungen nicht für jeden Tastenanschlag HTTP-Requests auslösen.
    this.validationSubscription = this.validationTrigger.pipe(debounceTime(300)).subscribe(() => this.validate());
  }

  /**
   * Lädt Komponenten-Registry und Flow-Liste für die initiale Editoransicht.
   */
  ngOnInit(): void {
    const restoredState = this.readRestoredState();
    this.api.getRegistry().subscribe((registry) => {
      this.registry = registry;
      if (this.flow) {
        this.prepareNodes(this.flow);
      }
    });
    this.api.getFlows().subscribe((flows) => {
      this.flows = flows.map((flow) => ({ id: flow.id, name: flow.name }));
      if (this.flows.length > 0) {
        this.selectedFlowId = restoredState
          && this.flows.some((flow) => flow.id === restoredState.flowId)
          ? restoredState.flowId
          : this.flows[0].id;
        this.loadFlow(restoredState?.nodeId);
      }
    });
  }

  /**
   * Lädt den aktuell ausgewählten Flow als bearbeitbare Kopie und setzt den Editorzustand zurück.
   */
  loadFlow(preferredNodeId?: string): void {
    if (!this.selectedFlowId) {
      return;
    }
    const request = ++this.flowLoadRequest;
    this.api.getFlow(this.selectedFlowId).subscribe((flow) => {
      if (request !== this.flowLoadRequest) {
        return;
      }
      this.flow = structuredClone(flow);
      this.isNewFlow = false;
      this.prepareNodes(this.flow);
      this.selectedNodeId = preferredNodeId
        && this.flow.nodes.some((node) => node.id === preferredNodeId)
        ? preferredNodeId
        : this.flow.nodes[0]?.id ?? '';
      this.issues = [];
      this.status = '';
      this.validationPerformed = false;
      // Direkt nach dem Laden wird eine erste, entprellte Validierung ausgelöst.
      this.validationTrigger.next();
      this.persistViewState();
    });
  }

  /**
   * Beginnt eine neue, zunächst leere Flow-Definition.
   */
  createNewFlow(): void {
    this.flowLoadRequest++;
    this.flow = {
      id: `flow-${crypto.randomUUID()}`,
      name: 'Neuer Flow',
      tool: 'WebclientTool',
      entryNodeId: '',
      nodes: []
    };
    this.isNewFlow = true;
    this.selectedFlowId = '';
    this.selectedNodeId = '';
    this.issues = [];
    this.status = '';
    this.validationPerformed = false;
    this.validationTrigger.next();
  }

  /**
   * Liefert den aktuell selektierten Knoten für den rechten Bearbeitungsbereich.
   */
  get selectedNode(): FlowNode | undefined {
    return this.flow?.nodes.find((node) => node.id === this.selectedNodeId);
  }

  /**
   * Aktiviert einen Editor-Knoten und übernimmt die Auswahl in den teilbaren Link.
   */
  selectNode(nodeId: string): void {
    this.selectedNodeId = nodeId;
    this.persistViewState();
  }

  /**
   * Sucht den Descriptor einer Widget-ID in der geladenen Registry.
   */
  descriptor(componentId: string): ComponentDescriptor | undefined {
    return this.registry.find((component) => component.id === componentId);
  }

  /**
   * Liefert nur Komponenten, die für die Rolle des Knotens zugelassen sind.
   */
  descriptorsFor(node: FlowNode): ComponentDescriptor[] {
    const presenter = this.isSidebarNode(node) ? 'SIDEBAR' : 'CONTENT';
    return this.registry.filter((descriptor) => descriptor.presenter === presenter);
  }

  /**
   * Liefert die Knoten, deren Komponenten als Sidebar registriert sind.
   */
  sidebarNodes(flow = this.flow): FlowNode[] {
    return flow?.nodes.filter((node) => this.descriptor(node.componentId)?.presenter === 'SIDEBAR') ?? [];
  }

  /**
   * Liefert die Knoten, deren Komponenten im Hauptbereich registriert sind.
   */
  contentNodes(flow = this.flow): FlowNode[] {
    return flow?.nodes.filter((node) => this.descriptor(node.componentId)?.presenter === 'CONTENT') ?? [];
  }

  private isSidebarNode(node: FlowNode): boolean {
    return this.descriptor(node.componentId)?.presenter === 'SIDEBAR'
      || this.flow?.sidebar?.nodeId === node.id
      || this.flow?.nodes.some((candidate) => candidate.sidebar?.nodeId === node.id)
      || false;
  }

  /**
   * Fügt einen neuen Inhalts- oder Sidebar-Knoten mit einer eindeutigen ID hinzu.
   */
  addNode(sidebar = false): void {
    if (!this.flow) {
      return;
    }
    const presenter = sidebar ? 'SIDEBAR' : 'CONTENT';
    const descriptor = this.registry.find((candidate) => candidate.presenter === presenter);
    if (!descriptor) {
      this.status = `Keine ${presenter}-Komponente verfügbar.`;
      return;
    }
    const node: FlowNode = {
      id: this.uniqueNodeId(descriptor.id),
      componentId: descriptor.id,
      inputBindings: {},
      children: [],
      transitions: []
    };
    this.flow.nodes.push(node);
    this.ensureInputBindings(node);
    if (!sidebar && !this.flow.entryNodeId) {
      this.flow.entryNodeId = node.id;
    }
    if (!sidebar) {
      this.connectPreviousNode(node);
    }
    this.selectedNodeId = node.id;
    this.status = '';
    this.persistViewState();
  }

  /**
   * Synchronisiert Komponente, sprechende Knoten-ID und alle Referenzen auf den Knoten.
   */
  changeNodeComponent(node: FlowNode): void {
    if (!this.flow) {
      return;
    }
    const previousId = node.id;
    const nextId = this.uniqueNodeId(node.componentId, node);
    this.ensureInputBindings(node);
    if (previousId !== nextId) {
      this.renameNodeReferences(this.flow.nodes, previousId, nextId);
      if (this.flow.entryNodeId === previousId) {
        this.flow.entryNodeId = nextId;
      }
      if (this.flow.sidebar?.nodeId === previousId) {
        this.flow.sidebar.nodeId = nextId;
      }
      this.selectedNodeId = nextId;
    }
    this.applyIncomingOutputBindings(node);
    this.persistViewState();
  }

  /**
   * Entfernt einen Knoten und alle Verweise auf ihn aus dem Flow.
   */
  removeSelectedNode(): void {
    if (!this.flow || !this.selectedNodeId) {
      return;
    }
    const removedId = this.selectedNodeId;
    this.flow.nodes = this.removeNodeReferences(this.flow.nodes, removedId);
    if (this.flow.sidebar?.nodeId === removedId) {
      delete this.flow.sidebar;
    }
    if (this.flow.entryNodeId === removedId) {
      this.flow.entryNodeId = this.contentNodes()[0]?.id ?? '';
    }
    this.selectedNodeId = this.flow.nodes[0]?.id ?? '';
    this.validationTrigger.next();
    this.persistViewState();
  }

  private removeNodeReferences(nodes: FlowNode[], removedId: string): FlowNode[] {
    return nodes
      .filter((node) => node.id !== removedId)
      .map((node) => {
        node.children = this.removeNodeReferences(node.children ?? [], removedId);
        node.transitions = (node.transitions ?? []).filter((transition) => transition.targetNodeId !== removedId);
        if (node.sidebar?.nodeId === removedId) {
          delete node.sidebar;
        }
        return node;
      });
  }

  /**
   * Synchronisiert die konfigurierten Bindings eines Knotens mit den Inputs seiner gewählten Komponente.
   */
  ensureInputBindings(node: FlowNode): void {
    const descriptor = this.descriptor(node.componentId);
    if (!descriptor) {
      return;
    }
    const existing = node.inputBindings ?? {};
    const nextBindings: Record<string, { source: 'STATIC' | 'CONTEXT'; staticValue?: unknown; contextKey?: string }> = {};
    // Nicht mehr vorhandene Inputs werden bewusst verworfen, damit die Flow-Definition dem Descriptor entspricht.
    for (const input of descriptor.inputs) {
      const existingBinding = existing[input.name];
      const descriptorDefault = {
        ...(input.allowedValues.length > 0
          ? { source: 'STATIC' as const, staticValue: input.allowedValues[0] }
          : { source: 'CONTEXT' as const, contextKey: input.name })
      };
      nextBindings[input.name] = existingBinding && !this.isEmptyBinding(existingBinding)
        ? existingBinding
        : descriptorDefault;
    }
    node.inputBindings = nextBindings;
    this.validationTrigger.next();
  }

  /**
   * Übersetzt eine kommaseparierte Liste in konkrete Kindknoten-Verknüpfungen.
   */
  setChildren(node: FlowNode, childIdsText: string): void {
    if (!this.flow) {
      return;
    }
    const ids = childIdsText.split(',').map((part) => part.trim()).filter(Boolean);
    node.children = this.flow.nodes.filter((candidate) => ids.includes(candidate.id));
    this.validationTrigger.next();
  }

  /**
   * Formatiert die Kindknoten eines Knotens für das Eingabefeld.
   */
  childIds(node: FlowNode): string {
    return (node.children ?? []).map((child) => child.id).join(', ');
  }

  /**
   * Formatiert die Berechtigungen eines Knotens als editierbaren Text.
   */
  requiredPermissionsAsText(node: FlowNode): string {
    return (node.requiredPermissions ?? []).join(', ');
  }

  /**
   * Überführt die Texteingabe für Berechtigungen in eine deduplizierte Liste.
   */
  setRequiredPermissions(node: FlowNode, value: string): void {
    node.requiredPermissions = [...new Set(value.split(',').map((permission) => permission.trim()).filter(Boolean))];
    this.validationTrigger.next();
  }

  /**
   * Fügt eine leere Transition hinzu, die im Formular weiter konfiguriert werden kann.
   */
  addTransition(node: FlowNode): void {
    node.transitions ??= [];
    const output = this.descriptor(node.componentId)?.outputs
      .find((candidate) => !node.transitions.some((transition) => transition.onOutput === candidate.name));
    const target = output ? this.compatibleTargets(node, output.name).find((candidate) => candidate !== node) : undefined;
    const transition = {
      onOutput: output?.name ?? '',
      targetNodeId: target?.id ?? '',
      contextMapping: {}
    };
    node.transitions.push(transition);
    this.prefillTransition(node, transition);
    this.validationTrigger.next();
  }

  removeTransition(node: FlowNode, index: number): void {
    node.transitions.splice(index, 1);
    this.validationTrigger.next();
  }

  /**
   * Übernimmt kompatible Felder des gewählten Outputs in Context-Mapping und Ziel-Inputs.
   */
  prefillTransition(source: FlowNode, transition: FlowTransition): void {
    if (!this.flow || !transition.onOutput || !transition.targetNodeId) {
      this.validationTrigger.next();
      return;
    }
    const output = this.descriptor(source.componentId)?.outputs
      .find((candidate) => candidate.name === transition.onOutput);
    const target = this.flow.nodes.find((candidate) => candidate.id === transition.targetNodeId);
    const targetDescriptor = target && this.descriptor(target.componentId);
    if (!output || !target || !targetDescriptor) {
      this.validationTrigger.next();
      return;
    }

    transition.contextMapping ??= {};
    for (const input of targetDescriptor.inputs) {
      const outputKey = this.matchingOutputKey(input, output);
      if (!outputKey) {
        continue;
      }
      const binding = target.inputBindings?.[input.name];
      if (this.isEmptyBinding(binding)) {
        target.inputBindings[input.name] = { source: 'CONTEXT', contextKey: input.name };
      }
      const contextKey = target.inputBindings[input.name]?.source === 'CONTEXT'
        ? target.inputBindings[input.name].contextKey
        : undefined;
      if (contextKey && !transition.contextMapping[contextKey]) {
        transition.contextMapping[contextKey] = `$event.${outputKey}`;
      }
    }
    this.validationTrigger.next();
  }

  /**
   * Ermittelt Zielknoten, deren Pflicht-Inputs mit dem gewählten Output kompatibel befüllt werden können.
   */
  compatibleTargets(source: FlowNode, outputName: string): FlowNode[] {
    const output = this.descriptor(source.componentId)?.outputs.find((candidate) => candidate.name === outputName);
    if (!this.flow || !output) {
      return [];
    }
    const availableTypes = Object.values(output.payload);
    return this.flow.nodes.filter((target) => {
      const descriptor = this.descriptor(target.componentId);
      if (!descriptor) {
        return false;
      }
      // Ein Ziel ist kompatibel, wenn jeder Pflicht-Input entweder statisch versorgt ist oder vom Output-Typ abgedeckt wird.
      return descriptor.inputs.filter((input) => input.required).every((input) => {
        const binding = target.inputBindings?.[input.name];
        return binding?.source === 'STATIC'
          || availableTypes.some((type) => type === input.semanticType || input.semanticType === 'STRING');
      });
    });
  }

  /**
   * Ergänzt einen einzelnen Context-Mapping-Eintrag.
   */
  addMapping(transition: { contextMapping: Record<string, string> }, key: string, value: string): void {
    if (key) {
      transition.contextMapping[key] = value;
      this.validationTrigger.next();
    }
  }

  /**
   * Entfernt einen Context-Mapping-Eintrag.
   */
  removeMapping(transition: { contextMapping: Record<string, string> }, key: string): void {
    delete transition.contextMapping[key];
    this.validationTrigger.next();
  }

  /**
   * Persistiert den aktuell bearbeiteten Flow und synchronisiert den lokalen Editorzustand mit der Serverantwort.
   */
  save(): void {
    if (!this.flow) {
      return;
    }
    const request = this.isNewFlow ? this.api.createFlow(this.flow) : this.api.updateFlow(this.flow);
    request.subscribe({
      next: (saved) => {
        this.flow = saved;
        this.prepareNodes(this.flow);
        this.isNewFlow = false;
        this.selectedFlowId = saved.id;
        const existingSummary = this.flows.find((flow) => flow.id === saved.id);
        if (existingSummary) {
          existingSummary.name = saved.name;
        } else {
          this.flows.push({ id: saved.id, name: saved.name });
        }
        const preferredNodeId = this.selectedNodeId;
        const fallbackNodeId = this.flow.nodes[0]?.id ?? '';
        this.selectedNodeId = this.flow.nodes.some((node) => node.id === preferredNodeId) ? preferredNodeId : fallbackNodeId;
        this.status = 'Flow gespeichert.';
        this.persistViewState();
        // Nach dem Speichern wird bewusst sofort die serverseitige Validierung erneut angezeigt.
        this.validate();
      },
      error: (error) => {
        this.status = `Speichern fehlgeschlagen: ${error.error?.message ?? error.message}`;
      }
    });
  }

  /**
   * Führt die serverseitige Validierung aus und aktualisiert die sichtbare Fehlerliste.
   */
  validate(): void {
    if (!this.flow) {
      return;
    }
    this.api.validateFlow(this.flow).subscribe({
      next: (result) => {
        this.issues = result.issues;
        this.validationPerformed = true;
      },
      error: () => {
        // Netzwerk- oder Backendfehler werden in dieselbe Fehlerliste gemappt wie fachliche Validierungsprobleme.
        this.issues = [{ path: 'flow', message: 'Validierung konnte nicht ausgeführt werden.' }];
        this.validationPerformed = true;
      }
    });
  }

  /**
   * Plant eine entprellte Validierung für die aktuelle Bearbeitung ein.
   */
  triggerValidation(): void {
    this.validationTrigger.next();
  }

  setSidebarMode(flow: FlowDefinition, collapse: boolean): void {
    flow.sidebarMode = collapse ? 'COLLAPSE' : 'SINGLE';
    this.validationTrigger.next();
  }

  /**
   * Aktiviert oder deaktiviert die Sidebar-Konfiguration mit sinnvollen Standardwerten.
   */
  setSidebarEnabled(flow: FlowDefinition, enabled: boolean): void {
    if (!enabled) {
      delete flow.sidebar;
    } else {
      flow.sidebar = {
        nodeId: this.sidebarNodes(flow)[0]?.id ?? '',
        position: 'LEFT',
        width: 280,
        ariaLabel: 'Flow-Navigation'
      };
    }
    this.validationTrigger.next();
  }

  /**
   * Aktiviert oder deaktiviert die Sidebar für einen einzelnen Hauptknoten.
   */
  setNodeSidebarEnabled(node: FlowNode, enabled: boolean): void {
    if (!enabled) {
      delete node.sidebar;
    } else {
      node.sidebar = {
        nodeId: this.sidebarNodes().find((candidate) => candidate.id !== node.id)?.id ?? '',
        position: 'LEFT',
        width: 280,
        ariaLabel: 'Flow-Navigation'
      };
    }
    this.validationTrigger.next();
  }

  /**
   * Serialisiert Context-Mappings in das mehrzeilige Editorformat.
   */
  mappingAsText(mapping: Record<string, string>): string {
    return Object.entries(mapping ?? {})
      .map(([key, value]) => `${key}:${value}`)
      .join('\n');
  }

  /**
   * Parst die textarea-basierte Mapping-Eingabe zurück in das persistierte Objektformat.
   */
  updateMappingFromText(transition: { contextMapping: Record<string, string> }, text: string): void {
    const next: Record<string, string> = {};
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }
      const splitIndex = trimmed.indexOf(':');
      if (splitIndex <= 0) {
        continue;
      }
      const key = trimmed.slice(0, splitIndex).trim();
      const value = trimmed.slice(splitIndex + 1).trim();
      // Nur vollständig parsebare "key:value"-Zeilen werden übernommen, damit Zwischenstände nicht sofort Fehlerzustände erzeugen.
      next[key] = value;
    }
    transition.contextMapping = next;
    this.validationTrigger.next();
  }

  private uniqueNodeId(componentId: string, currentNode?: FlowNode): string {
    const baseId = componentId.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'node';
    if (!this.flow?.nodes.some((node) => node !== currentNode && node.id === baseId)) {
      return baseId;
    }
    let suffix = 2;
    while (this.flow.nodes.some((node) => node !== currentNode && node.id === `${baseId}-${suffix}`)) {
      suffix++;
    }
    return `${baseId}-${suffix}`;
  }

  private renameNodeReferences(nodes: FlowNode[], previousId: string, nextId: string): void {
    for (const node of nodes) {
      if (node.id === previousId) {
        node.id = nextId;
      }
      for (const transition of node.transitions ?? []) {
        if (transition.targetNodeId === previousId) {
          transition.targetNodeId = nextId;
        }
      }
      if (node.sidebar?.nodeId === previousId) {
        node.sidebar.nodeId = nextId;
      }
      this.renameNodeReferences(node.children ?? [], previousId, nextId);
    }
  }

  private connectPreviousNode(target: FlowNode): void {
    const contentNodes = this.contentNodes();
    const targetIndex = contentNodes.indexOf(target);
    const source = targetIndex > 0 ? contentNodes[targetIndex - 1] : undefined;
    const targetDescriptor = this.descriptor(target.componentId);
    if (!source || !targetDescriptor) {
      return;
    }
    const outputs = this.descriptor(source.componentId)?.outputs
      .filter((output) => !source.transitions.some((transition) => transition.onOutput === output.name)) ?? [];
    const output = outputs
      .map((candidate) => ({
        candidate,
        matches: targetDescriptor.inputs.filter((input) => this.matchingOutputKey(input, candidate)).length
      }))
      .sort((left, right) => right.matches - left.matches)[0];
    if (!output || output.matches === 0) {
      return;
    }
    const transition: FlowTransition = {
      onOutput: output.candidate.name,
      targetNodeId: target.id,
      contextMapping: {}
    };
    source.transitions.push(transition);
    this.prefillTransition(source, transition);
  }

  private applyIncomingOutputBindings(target: FlowNode): void {
    if (!this.flow) {
      return;
    }

    for (const source of this.flow.nodes) {
      for (const transition of source.transitions ?? []) {
        if (transition.targetNodeId === target.id) {
          this.prefillTransition(source, transition);
        }
      }
    }
  }

  /**
   * Verknüpft serialisierte Kindknoten wieder mit ihren global bearbeitbaren Knoten und ergänzt Descriptor-Bindings.
   */
  private prepareNodes(flow: FlowDefinition): void {
    const nodesById = new Map(flow.nodes.map((node) => [node.id, node]));
    for (const node of flow.nodes) {
      node.children = (node.children ?? []).map((child) => nodesById.get(child.id) ?? child);
    }
    flow.nodes.forEach((node) => this.ensureInputBindings(node));
  }

  private matchingOutputKey(input: InputDescriptor, output: OutputDescriptor): string | undefined {
    const normalizedInputName = input.name.toLowerCase();
    const entries = Object.entries(output.payload);
    const namedMatch = entries.find(([name, type]) =>
      name.toLowerCase() === normalizedInputName && this.isCompatibleType(type, input));
    if (namedMatch) {
      return namedMatch[0];
    }
    const typeMatches = entries.filter(([, type]) => this.isCompatibleType(type, input));
    return typeMatches.length === 1 ? typeMatches[0][0] : undefined;
  }

  private isCompatibleType(type: string, input: InputDescriptor): boolean {
    return type === input.semanticType || input.semanticType === 'STRING';
  }

  private isEmptyBinding(binding?: InputBinding): boolean {
    return !binding
      || (binding.source === 'STATIC' && (binding.staticValue === '' || binding.staticValue == null))
      || (binding.source === 'CONTEXT' && !binding.contextKey);
  }

  /**
   * Gibt das entprellte Validierungsabonnement beim Verlassen der Seite frei.
   */
  ngOnDestroy(): void {
    this.validationSubscription.unsubscribe();
  }

  private readRestoredState(): RoutedEditorState | null {
    const value = this.viewRouter.read(EDITOR_SCOPE);
    if (!isRecord(value)
      || typeof value['flowId'] !== 'string'
      || typeof value['nodeId'] !== 'string') {
      return null;
    }
    return { flowId: value['flowId'], nodeId: value['nodeId'] };
  }

  private persistViewState(): void {
    if (!this.selectedFlowId) {
      return;
    }
    this.viewRouter.write(EDITOR_SCOPE, {
      flowId: this.selectedFlowId,
      nodeId: this.selectedNodeId
    } satisfies RoutedEditorState);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
