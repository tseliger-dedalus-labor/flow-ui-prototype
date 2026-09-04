import { Component, EventEmitter, Input, OnChanges, OnDestroy, SimpleChanges, Type, ViewChild, ViewContainerRef, forwardRef } from '@angular/core';

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
import { AppointmentsPanelComponent } from '../widgets/appointments-panel.component';
import { PermissionService } from '../../services/permission.service';

@Component({
    selector: 'app-flow-renderer',
    template: `
    <section class="node-shell">
      <ng-container #host />
      @if (hasAccess) {
        @if (node.children.length) {
          <div class="children">
            @for (child of node.children; track child) {
              <app-flow-renderer
                [node]="child"
                [context]="context" />
            }
          </div>
        }
      } @else {
        <p class="access-denied">Keine Berechtigung für diese Komponente.</p>
      }
    </section>
    `,
    styles: ['.node-shell { margin-bottom: 1rem; } .children { margin-top: 0.75rem; padding-left: 0.75rem; border-left: 2px solid #e0e5f5; } .access-denied { color: #a32727; }'],
    imports: [forwardRef(() => FlowRendererComponent)]
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
    'transfusions-panel': TransfusionsPanelComponent,
    'appointments-panel': AppointmentsPanelComponent
  };
  private subscriptions: Subscription[] = [];
  hasAccess = true;

  constructor(private readonly engine: FlowEngineService, private readonly permissions: PermissionService) {}

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
