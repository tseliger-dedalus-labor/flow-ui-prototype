import { IxtDisplayType } from './ixt-display-type';
import { PrtType } from './prt-type';
export type { Tool } from 'ui-framework';
import type { PresenterType, Tool } from 'ui-framework';

/**
 * Fachliche Typisierung für Flow-Inputs und Output-Payloads.
 */
export type SemanticType = 'STRING' | 'MODE' | 'WARD_ID' | 'PATIENT_ID' | 'CASE_ID' | 'RECORD_ID' | 'PRT_TYPE';
/**
 * Herkunft eines Input-Bindings innerhalb einer Flow-Definition.
 */
export type BindingSource = 'STATIC' | 'CONTEXT';

/**
 * Beschreibt einen einzelnen Input einer Flow-Komponente.
 */
export interface InputDescriptor {
  /** Öffentlicher Angular-Input-Name. */
  name: string;
  /** Fachlicher Datentyp, gegen den Flows validiert werden. */
  semanticType: SemanticType;
  /** Kennzeichnet Inputs, die vor der Ausführung gebunden sein müssen. */
  required: boolean;
  /** Optionale Menge zulässiger Literalwerte. */
  allowedValues: string[];
}

/**
 * Beschreibt ein vom Widget ausgelöstes Event.
 */
export interface OutputDescriptor {
  /** Öffentlicher Angular-Output-Name. */
  name: string;
  /** Payload-Felder mit ihren semantischen Typen. */
  payload: Record<string, SemanticType>;
}

/**
 * Metadaten einer Flow-fähigen Angular-Komponente.
 */
export interface ComponentDescriptor {
  /** Eindeutige technische Komponenten-ID. */
  id: string;
  /** Anzeigename für Editor und Registry. */
  title: string;
  /** Optionales fachliches Anzeigeformat aus der ixserv-Welt. */
  displayType?: IxtDisplayType;
  /** Zulässiger Darstellungsbereich des Presenters. */
  presenter: PresenterType;
  /** Kennzeichnet Container-Komponenten, die Kindknoten rendern dürfen. */
  container: boolean;
  /** Deklarierte Inputs der Komponente. */
  inputs: InputDescriptor[];
  /** Deklarierte Outputs der Komponente. */
  outputs: OutputDescriptor[];
}

/**
 * Bindet einen Flow-Input entweder an einen statischen Wert oder an den Laufzeitkontext.
 */
export interface InputBinding {
  source: BindingSource;
  staticValue?: unknown;
  contextKey?: string;
}

/**
 * Beschreibt eine Kante im Flow-Graphen, ausgelöst durch einen Component-Output.
 */
export interface FlowTransition {
  onOutput: string;
  targetNodeId: string;
  contextMapping: Record<string, string>;
  /** Überschreibt das statische Ziel für Events mit einem gemappten PrtType. */
  prtTypeDisplayTypes?: Partial<Record<PrtType, IxtDisplayType>>;
}

/**
 * Knoten des Flow-Graphen inklusive verschachtelter Kindknoten.
 */
export interface FlowNode {
  id: string;
  componentId: string;
  inputBindings: Record<string, InputBinding>;
  children: FlowNode[];
  transitions: FlowTransition[];
  requiredPermissions?: string[];
  /** Sidebar, die angezeigt wird, solange dieser Knoten der aktive Hauptknoten ist. */
  sidebar?: FlowSidebar;
}

/**
 * Vertrag für Container-Komponenten, die ihre Flow-Kindknoten selbst rendern.
 */
export interface EmbeddedFlowContainer {
  flowChildren: FlowNode[];
  flowContext: Record<string, unknown>;
  /** Stabile Knoten-ID für containerlokalen, URL-serialisierbaren UI-Zustand. */
  flowContainerId?: string;
}

/**
 * Erlaubte Positionen für die optionale Flow-Sidebar.
 */
export type SidebarPosition = 'LEFT' | 'RIGHT';

/**
 * Steuert, ob nur die aktive Sidebar oder alle Sidebars als umschaltbare Bereiche erscheinen.
 */
export type SidebarMode = 'SINGLE' | 'COLLAPSE';

/**
 * Konfiguriert die sekundäre Sidebar-Ansicht eines Flows.
 */
export interface FlowSidebar {
  nodeId: string;
  position: SidebarPosition;
  width: number;
  ariaLabel?: string;
}

/**
 * Technische Tool-IDs aus der ixserv-Tool-Enum.
 */
/**
 * Verknüpft Tool-IDs mit den Lazy-Load-Modulen der Anwendung.
 */
export const TOOL_MODULES: Record<Tool, string> = {
  AppointmentTool: 'appointments',
  ReportcenterTool: 'laboratory-portal',
  WebclientTool: 'patient-workflow'
};

/**
 * Serverseitig persistierte Definition eines renderbaren Flows.
 */
export interface FlowDefinition {
  id: string;
  name: string;
  tool: Tool;
  entryNodeId: string;
  /** Rückwärtskompatible Standard-Sidebar für Knoten ohne eigene Konfiguration. */
  sidebar?: FlowSidebar;
  /** Optionale Darstellung aller referenzierten Sidebars in einem Collapse-Container. */
  sidebarMode?: SidebarMode;
  nodes: FlowNode[];
}

/**
 * Kompakte Übersicht über verfügbare Flows.
 */
export interface FlowSummary {
  id: string;
  name: string;
  tool: Tool;
  active: boolean;
}

/**
 * Einzelner Validierungsfehler eines Flows.
 */
export interface ValidationIssue {
  path: string;
  message: string;
}

/**
 * Ergebnis einer Flow-Validierung.
 */
export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}
