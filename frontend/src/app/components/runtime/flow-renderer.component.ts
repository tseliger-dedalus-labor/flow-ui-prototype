import { Component, EventEmitter, Input, OnChanges, OnDestroy, SimpleChanges, Type, ViewChild, ViewContainerRef, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { FlowNode, InputBinding } from '../../models';
import { FlowEngineService } from '../../services/flow-engine.service';
import { WardListComponent } from '../widgets/ward-list.component';
import { PatientListComponent } from '../widgets/patient-list.component';
import { PatientViewComponent } from '../widgets/patient-view.component';
import { StackLayoutComponent } from '../widgets/stack-layout.component';
import { DemographicsPanelComponent } from '../widgets/demographics-panel.component';
import { FindingsPanelComponent } from '../widgets/findings-panel.component';
import { OrdersPanelComponent } from '../widgets/orders-panel.component';
import { TransfusionsPanelComponent } from '../widgets/transfusions-panel.component';

@Component({
    selector: 'app-flow-renderer',
    template: `
    <section class="node-shell">
      <ng-container #host />
      <div class="children" *ngIf="node?.children?.length">
        <app-flow-renderer
          *ngFor="let child of node.children"
          [node]="child"
          [context]="context" />
      </div>
    </section>
  `,
    styles: ['.node-shell { margin-bottom: 1rem; } .children { margin-top: 0.75rem; padding-left: 0.75rem; border-left: 2px solid #e0e5f5; }'],
    imports: [CommonModule, forwardRef(() => FlowRendererComponent)]
})
export class FlowRendererComponent implements OnChanges, OnDestroy {
  @Input() node!: FlowNode;
  @Input() context: Record<string, unknown> = {};

  @ViewChild('host', { read: ViewContainerRef, static: true })
  private readonly host!: ViewContainerRef;

  private readonly componentMap: Record<string, Type<unknown>> = {
    'ward-list': WardListComponent,
    'patient-list': PatientListComponent,
    'patient-view': PatientViewComponent,
    'stack-layout': StackLayoutComponent,
    'demographics-panel': DemographicsPanelComponent,
    'findings-panel': FindingsPanelComponent,
    'orders-panel': OrdersPanelComponent,
    'transfusions-panel': TransfusionsPanelComponent
  };
  private subscriptions: Subscription[] = [];

  constructor(private readonly engine: FlowEngineService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['node'] && !changes['context']) {
      return;
    }
    this.renderNode();
  }

  private renderNode(): void {
    this.cleanupSubscriptions();
    this.host.clear();
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
