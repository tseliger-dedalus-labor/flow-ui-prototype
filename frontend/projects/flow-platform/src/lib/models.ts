import { IxtDisplayType } from './ixt-display-type';

export type SemanticType = 'STRING' | 'MODE' | 'WARD_ID' | 'PATIENT_ID';
export type BindingSource = 'STATIC' | 'CONTEXT';

export interface InputDescriptor {
  name: string;
  semanticType: SemanticType;
  required: boolean;
  allowedValues: string[];
}

export interface OutputDescriptor {
  name: string;
  payload: Record<string, SemanticType>;
}

export interface ComponentDescriptor {
  id: string;
  title: string;
  displayType?: IxtDisplayType;
  container: boolean;
  inputs: InputDescriptor[];
  outputs: OutputDescriptor[];
}

export interface InputBinding {
  source: BindingSource;
  staticValue?: unknown;
  contextKey?: string;
}

export interface FlowTransition {
  onOutput: string;
  targetNodeId: string;
  contextMapping: Record<string, string>;
}

export interface FlowNode {
  id: string;
  componentId: string;
  inputBindings: Record<string, InputBinding>;
  children: FlowNode[];
  transitions: FlowTransition[];
  requiredPermissions?: string[];
}

export type SidebarPosition = 'LEFT' | 'RIGHT';

export interface FlowSidebar {
  nodeId: string;
  position: SidebarPosition;
  width: number;
  ariaLabel?: string;
}

export interface FlowDefinition {
  id: string;
  name: string;
  entryNodeId: string;
  sidebar?: FlowSidebar;
  nodes: FlowNode[];
}

export interface FlowSummary {
  id: string;
  name: string;
  active: boolean;
}

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}
