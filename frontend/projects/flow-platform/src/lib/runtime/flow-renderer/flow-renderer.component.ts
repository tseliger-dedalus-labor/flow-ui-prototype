import { Component, EventEmitter, Inject, Input, OnChanges, OnDestroy, Optional, SimpleChanges, ViewChild, ViewContainerRef, forwardRef } from '@angular/core';
import { APresenter, type PresenterType } from 'ui-framework';

import { Subscription } from 'rxjs';
import { EmbeddedFlowContainer, FlowNode } from '../../models';
import { FlowEngineService } from '../../flow-engine.service';
import { PermissionService } from '../../permission.service';
import { FLOW_WIDGET, FlowWidgetRegistration } from '../flow-widget';

/**
 * Rendert einen Flow-Knoten dynamisch, bindet dessen Inputs und verdrahtet deklarierte Outputs zurück an die Engine.
 */
@Component({
    selector: 'app-flow-renderer',
    templateUrl: './flow-renderer.component.html',
    styleUrl: './flow-renderer.component.scss',
    imports: [forwardRef(() => FlowRendererComponent)]
})
export class FlowRendererComponent implements OnChanges, OnDestroy {
  @Input() node!: FlowNode;
  @Input() context: Record<string, unknown> = {};
  @Input() presenter: PresenterType = 'CONTENT';

  @ViewChild('host', { read: ViewContainerRef, static: true })
  private readonly host!: ViewContainerRef;

  private readonly componentMap: Record<string, FlowWidgetRegistration>;
  private subscriptions: Subscription[] = [];
  private renderedPresenter?: APresenter;
  hasAccess = true;
  hasValidPresenter = true;
  rendersOwnChildren = false;

  constructor(
    private readonly engine: FlowEngineService,
    private readonly permissions: PermissionService,
    @Optional() @Inject(FLOW_WIDGET) widgets: FlowWidgetRegistration[] | null
  ) {
    // Multi-Provider registrieren alle Widgets lose gekoppelt; die Runtime löst nur über componentId auf.
    this.componentMap = Object.fromEntries((widgets ?? []).map((widget) => [widget.componentId, widget]));
  }

  /**
   * Rendert den Knoten neu, sobald sich der Zielknoten oder dessen Kontext ändert.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['node'] && !changes['context'] && !changes['presenter']) {
      return;
    }
    this.renderNode();
  }

  /**
   * Erstellt die Angular-Komponente des Knotens dynamisch und verbindet deren Outputs mit Flow-Transitionen.
   */
  private renderNode(): void {
    this.cleanupSubscriptions();
    this.hideRenderedPresenter();
    this.host.clear();
    this.rendersOwnChildren = false;
    this.hasValidPresenter = true;
    this.hasAccess = this.permissions.hasAll(this.node.requiredPermissions ?? []);
    if (!this.hasAccess) {
      return;
    }
    const registration = this.componentMap[this.node.componentId];
    if (!registration) {
      return;
    }
    this.hasValidPresenter = registration.descriptor.presenter === this.presenter;
    if (!this.hasValidPresenter) {
      return;
    }
    const ref = this.host.createComponent(registration.component);
    if (ref.instance instanceof APresenter) {
      this.renderedPresenter = ref.instance;
      this.renderedPresenter.visible = true;
    }
    // Input-Bindings werden erst nach der Instanziierung gesetzt, damit Standalone-Komponenten unverändert bleiben können.
    for (const [name, value] of Object.entries(this.engine.inputsFor(this.node.id))) {
      ref.setInput(name, value);
    }

    const instance = ref.instance as Record<string, unknown>;
    if (this.isEmbeddedContainer(instance)) {
      instance.flowContainerId = this.node.id;
      instance.flowChildren = this.node.children ?? [];
      instance.flowContext = this.context;
      this.rendersOwnChildren = true;
    }
    for (const transition of this.node.transitions ?? []) {
      const emitter = instance[transition.onOutput];
      if (emitter instanceof EventEmitter) {
        // Jeder Output wird gezielt auf die deklarierte Transition gemappt; fehlende Emitter werden still ignoriert.
        this.subscriptions.push(
          emitter.subscribe((value) => this.engine.transitionFrom(this.node.id, transition.onOutput, value))
        );
      }
    }
  }

  /**
   * Erkennt Container, die Kindknoten über ihre eigene Darstellung organisieren.
   */
  private isEmbeddedContainer(instance: Record<string, unknown>): instance is Record<string, unknown> & EmbeddedFlowContainer {
    return 'flowChildren' in instance && 'flowContext' in instance;
  }

  /**
   * Räumt alle Output-Abonnements auf, sobald die Host-Komponente zerstört wird.
   */
  ngOnDestroy(): void {
    this.cleanupSubscriptions();
    this.hideRenderedPresenter();
  }

  /**
   * Verhindert doppelte Output-Abonnements beim erneuten Rendern desselben Host-Slots.
   */
  private cleanupSubscriptions(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.subscriptions = [];
  }

  private hideRenderedPresenter(): void {
    if (this.renderedPresenter) {
      this.renderedPresenter.visible = false;
      this.renderedPresenter = undefined;
    }
  }
}
