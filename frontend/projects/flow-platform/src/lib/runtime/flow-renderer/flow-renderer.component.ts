import { Component, EventEmitter, Inject, Input, OnChanges, OnDestroy, Optional, SimpleChanges, Type, ViewChild, ViewContainerRef, forwardRef } from '@angular/core';

import { Subscription } from 'rxjs';
import { FlowNode, InputBinding } from '../../models';
import { FlowEngineService } from '../../flow-engine.service';
import { PermissionService } from '../../permission.service';
import { FLOW_WIDGET, FlowWidgetRegistration } from '../flow-widget';

@Component({
    selector: 'app-flow-renderer',
    templateUrl: './flow-renderer.component.html',
    styleUrl: './flow-renderer.component.scss',
    imports: [forwardRef(() => FlowRendererComponent)]
})
export class FlowRendererComponent implements OnChanges, OnDestroy {
  @Input() node!: FlowNode;
  @Input() context: Record<string, unknown> = {};

  @ViewChild('host', { read: ViewContainerRef, static: true })
  private readonly host!: ViewContainerRef;

  private readonly componentMap: Record<string, Type<unknown>>;
  private subscriptions: Subscription[] = [];
  hasAccess = true;

  constructor(
    private readonly engine: FlowEngineService,
    private readonly permissions: PermissionService,
    @Optional() @Inject(FLOW_WIDGET) widgets: FlowWidgetRegistration[] | null
  ) {
    this.componentMap = Object.fromEntries(
      (widgets ?? []).map((widget) => [widget.componentId, widget.component])
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['node'] && !changes['context']) {
      return;
    }
    this.renderNode();
  }

  private renderNode(): void {
    this.cleanupSubscriptions();
    this.host.clear();
    this.hasAccess = this.permissions.hasAll(this.node.requiredPermissions ?? []);
    if (!this.hasAccess) {
      return;
    }
    const componentType = this.componentMap[this.node.componentId];
    if (!componentType) {
      return;
    }
    const ref = this.host.createComponent(componentType);
    for (const [name, binding] of Object.entries(this.node.inputBindings ?? {})) {
      ref.setInput(name, this.resolveBinding(binding));
    }

    const instance = ref.instance as Record<string, unknown>;
    for (const transition of this.node.transitions ?? []) {
      const emitter = instance[transition.onOutput];
      if (emitter instanceof EventEmitter) {
        this.subscriptions.push(emitter.subscribe((value) => this.engine.transition(transition.onOutput, value)));
      }
    }
  }

  private resolveBinding(binding: InputBinding): unknown {
    if (binding.source === 'CONTEXT') {
      return this.context[binding.contextKey ?? ''];
    }
    return binding.staticValue;
  }

  ngOnDestroy(): void {
    this.cleanupSubscriptions();
  }

  private cleanupSubscriptions(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.subscriptions = [];
  }
}
