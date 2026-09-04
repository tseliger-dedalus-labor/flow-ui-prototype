import { Component, OnDestroy, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime } from 'rxjs';
import { ComponentDescriptor, FlowApiService, FlowDefinition, FlowNode, ValidationIssue } from 'flow-platform';

@Component({
    selector: 'app-editor-page',
    imports: [FormsModule],
    templateUrl: './editor-page.component.html',
    styleUrl: './editor-page.component.css'
})
export class EditorPageComponent implements OnInit, OnDestroy {
  flows: Array<{ id: string; name: string }> = [];
  registry: ComponentDescriptor[] = [];
  flow?: FlowDefinition;
  selectedFlowId = '';
  selectedNodeId = '';
  issues: ValidationIssue[] = [];
  status = '';
  validationPerformed = false;

  private readonly validationTrigger = new Subject<void>();
  private readonly validationSubscription: Subscription;

  constructor(private readonly api: FlowApiService) {
    this.validationSubscription = this.validationTrigger.pipe(debounceTime(300)).subscribe(() => this.validate());
  }

  ngOnInit(): void {
    this.api.getRegistry().subscribe((registry) => this.registry = registry);
    this.api.getFlows().subscribe((flows) => {
      this.flows = flows.map((flow) => ({ id: flow.id, name: flow.name }));
      if (this.flows.length > 0) {
        this.selectedFlowId = this.flows[0].id;
        this.loadFlow();
      }
    });
  }

  loadFlow(): void {
    if (!this.selectedFlowId) {
      return;
    }
    this.api.getFlow(this.selectedFlowId).subscribe((flow) => {
      this.flow = structuredClone(flow);
      this.flow.nodes.forEach((node) => this.ensureInputBindings(node));
      this.selectedNodeId = this.flow.nodes[0]?.id ?? '';
      this.issues = [];
      this.status = '';
      this.validationPerformed = false;
      this.validationTrigger.next();
    });
  }

  get selectedNode(): FlowNode | undefined {
    return this.flow?.nodes.find((node) => node.id === this.selectedNodeId);
  }

  descriptor(componentId: string): ComponentDescriptor | undefined {
    return this.registry.find((component) => component.id === componentId);
  }

  ensureInputBindings(node: FlowNode): void {
    const descriptor = this.descriptor(node.componentId);
    if (!descriptor) {
      return;
    }
    const existing = node.inputBindings ?? {};
    const nextBindings: Record<string, { source: 'STATIC' | 'CONTEXT'; staticValue?: unknown; contextKey?: string }> = {};
    for (const input of descriptor.inputs) {
      nextBindings[input.name] = existing[input.name] ?? { source: 'STATIC', staticValue: '' };
    }
    node.inputBindings = nextBindings;
    this.validationTrigger.next();
  }

  setChildren(node: FlowNode, childIdsText: string): void {
    if (!this.flow) {
      return;
    }
    const ids = childIdsText.split(',').map((part) => part.trim()).filter(Boolean);
    node.children = this.flow.nodes.filter((candidate) => ids.includes(candidate.id));
    this.validationTrigger.next();
  }

  childIds(node: FlowNode): string {
    return (node.children ?? []).map((child) => child.id).join(', ');
  }

  requiredPermissionsAsText(node: FlowNode): string {
    return (node.requiredPermissions ?? []).join(', ');
  }

  setRequiredPermissions(node: FlowNode, value: string): void {
    node.requiredPermissions = [...new Set(value.split(',').map((permission) => permission.trim()).filter(Boolean))];
    this.validationTrigger.next();
  }

  addTransition(node: FlowNode): void {
    node.transitions ??= [];
    node.transitions.push({ onOutput: '', targetNodeId: '', contextMapping: {} });
    this.validationTrigger.next();
  }

  addMapping(transition: { contextMapping: Record<string, string> }, key: string, value: string): void {
    if (key) {
      transition.contextMapping[key] = value;
      this.validationTrigger.next();
    }
  }

  removeMapping(transition: { contextMapping: Record<string, string> }, key: string): void {
    delete transition.contextMapping[key];
    this.validationTrigger.next();
  }

  save(): void {
    if (!this.flow) {
      return;
    }
    this.api.updateFlow(this.flow).subscribe({
      next: (saved) => {
        this.flow = saved;
        this.flow.nodes.forEach((node) => this.ensureInputBindings(node));
        const preferredNodeId = this.selectedNodeId;
        const fallbackNodeId = this.flow.nodes[0]?.id ?? '';
        this.selectedNodeId = this.flow.nodes.some((node) => node.id === preferredNodeId) ? preferredNodeId : fallbackNodeId;
        this.status = 'Flow gespeichert.';
        this.validate();
      },
      error: (error) => {
        this.status = `Speichern fehlgeschlagen: ${error.error?.message ?? error.message}`;
      }
    });
  }

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
        this.issues = [{ path: 'flow', message: 'Validierung konnte nicht ausgeführt werden.' }];
        this.validationPerformed = true;
      }
    });
  }

  triggerValidation(): void {
    this.validationTrigger.next();
  }

  mappingAsText(mapping: Record<string, string>): string {
    return Object.entries(mapping ?? {})
      .map(([key, value]) => `${key}:${value}`)
      .join('\n');
  }

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
      next[key] = value;
    }
    transition.contextMapping = next;
    this.validationTrigger.next();
  }

  ngOnDestroy(): void {
    this.validationSubscription.unsubscribe();
  }
}
