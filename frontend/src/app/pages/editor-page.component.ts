import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime } from 'rxjs';
import { ApiService } from '../services/api.service';
import { ComponentDescriptor, FlowDefinition, FlowNode, ValidationIssue } from '../models';

@Component({
  selector: 'app-editor-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editor-page.component.html',
  styleUrl: './editor-page.component.css'
})
export class EditorPageComponent implements OnInit {
  flows: Array<{ id: string; name: string }> = [];
  registry: ComponentDescriptor[] = [];
  flow?: FlowDefinition;
  selectedFlowId = '';
  selectedNodeId = '';
  issues: ValidationIssue[] = [];
  status = '';

  private readonly validationTrigger = new Subject<void>();

  constructor(private readonly api: ApiService) {
    this.validationTrigger.pipe(debounceTime(300)).subscribe(() => this.validate());
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
    node.inputBindings ??= {};
    for (const input of descriptor.inputs) {
      node.inputBindings[input.name] ??= { source: 'STATIC', staticValue: '' };
    }
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
    this.api.validateFlow(this.flow).subscribe((result) => this.issues = result.issues);
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
}
