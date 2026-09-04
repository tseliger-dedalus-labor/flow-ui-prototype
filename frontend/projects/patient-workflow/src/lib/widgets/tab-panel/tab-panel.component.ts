import { Component, ElementRef, Inject, OnDestroy, Optional, QueryList, ViewChildren, forwardRef } from '@angular/core';
import {
  EmbeddedFlowContainer,
  FLOW_WIDGET,
  FlowNode,
  FlowRendererComponent,
  FlowTabRequest,
  FlowTabService,
  FlowWidgetRegistration,
  ViewRouterService
} from 'flow-platform';
import { Subscription } from 'rxjs';
import { AContentPresenter } from 'ui-framework';

interface TabEntry {
  key: string;
  title: string;
  node: FlowNode;
  closable: boolean;
}

interface RoutedTabPanelState {
  activeKey: string;
  dynamicTabs: FlowTabRequest[];
}

const FLOW_TABS_SCOPE_PREFIX = 'flow-tabs:';

/**
 * Stellt jeden zugewiesenen Flow-Kindknoten in einem eigenen Tab dar.
 */
@Component({
  selector: 'app-tab-panel',
  standalone: true,
  imports: [forwardRef(() => FlowRendererComponent)],
  providers: [FlowTabService],
  templateUrl: './tab-panel.component.html',
  styleUrl: './tab-panel.component.scss'
})
export class TabPanelComponent extends AContentPresenter implements EmbeddedFlowContainer, OnDestroy {
  @ViewChildren('tabButton')
  private readonly tabButtons!: QueryList<ElementRef<HTMLButtonElement>>;

  private assignedChildren: FlowNode[] = [];
  private readonly dynamicTabs: TabEntry[] = [];
  private containerId = '';
  private restoredActiveKey = '';
  private restoredContainerId = '';
  flowContext: Record<string, unknown> = {};
  activeKey = '';

  private readonly titles: Record<string, string>;
  private readonly tabSubscription: Subscription;

  constructor(
    @Optional() @Inject(FLOW_WIDGET) widgets: FlowWidgetRegistration[] | null,
    tabs: FlowTabService,
    private readonly viewRouter: ViewRouterService
  ) {
    super('WebclientTool');
    this.titles = Object.fromEntries(
      (widgets ?? []).map((widget) => [widget.componentId, widget.descriptor.title])
    );
    this.tabSubscription = tabs.requests$.subscribe((request) => this.openTab(request));
  }

  get flowChildren(): FlowNode[] {
    return this.assignedChildren;
  }

  set flowChildren(children: FlowNode[]) {
    this.assignedChildren = children;
    this.restoreState();
    this.ensureActiveTab();
  }

  get flowContainerId(): string {
    return this.containerId;
  }

  set flowContainerId(value: string) {
    this.containerId = value;
    this.restoreState();
    this.ensureActiveTab();
  }

  get tabs(): TabEntry[] {
    return [
      ...this.assignedChildren.map((child) => ({
        key: `flow:${child.id}`,
        title: this.tabTitle(child),
        node: child,
        closable: false
      })),
      ...this.dynamicTabs
    ];
  }

  /**
   * Aktiviert den gewählten Tab.
   */
  selectTab(key: string): void {
    if (this.tabs.some((tab) => tab.key === key)) {
      this.activeKey = key;
      this.persistState();
    }
  }

  /**
   * Schließt einen dynamisch geöffneten Tab.
   */
  closeTab(tab: TabEntry, event: Event): void {
    event.stopPropagation();
    if (!tab.closable) {
      return;
    }
    const tabsBeforeClose = this.tabs;
    const closedIndex = tabsBeforeClose.findIndex((candidate) => candidate.key === tab.key);
    const dynamicIndex = this.dynamicTabs.findIndex((candidate) => candidate.key === tab.key);
    if (dynamicIndex < 0) {
      return;
    }
    this.dynamicTabs.splice(dynamicIndex, 1);
    if (this.activeKey === tab.key) {
      const remainingTabs = this.tabs;
      this.activeKey = remainingTabs[Math.min(closedIndex, remainingTabs.length - 1)]?.key ?? '';
    }
    this.persistState();
  }

  /**
   * Unterstützt die übliche Tastaturnavigation für Tabs.
   */
  handleKeydown(event: KeyboardEvent, index: number): void {
    const tabs = this.tabs;
    let nextIndex: number | undefined;
    if (event.key === 'ArrowRight') {
      nextIndex = (index + 1) % tabs.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = tabs.length - 1;
    }
    if (nextIndex === undefined) {
      return;
    }
    event.preventDefault();
    this.selectTab(tabs[nextIndex].key);
    this.tabButtons.get(nextIndex)?.nativeElement.focus();
  }

  /**
   * Liefert den Registry-Titel der Kindkomponente als Tab-Beschriftung.
   */
  tabTitle(child: FlowNode): string {
    return this.titles[child.componentId] ?? child.componentId;
  }

  /**
   * Beendet das Abonnement des tablokalen Kommunikationsdienstes.
   */
  ngOnDestroy(): void {
    this.tabSubscription.unsubscribe();
  }

  private openTab(request: FlowTabRequest): void {
    const existing = this.dynamicTabs.find((tab) => tab.key === request.key);
    if (existing) {
      this.activeKey = existing.key;
      this.persistState();
      return;
    }
    const tab: TabEntry = {
      key: request.key,
      title: request.title,
      node: request.node,
      closable: true
    };
    this.dynamicTabs.push(tab);
    this.activeKey = tab.key;
    this.persistState();
  }

  private restoreState(): void {
    if (!this.containerId || this.restoredContainerId === this.containerId) {
      return;
    }
    this.restoredContainerId = this.containerId;
    const value = this.viewRouter.read(`${FLOW_TABS_SCOPE_PREFIX}${this.containerId}`);
    if (!isRoutedTabPanelState(value)) {
      return;
    }
    this.dynamicTabs.splice(0, this.dynamicTabs.length, ...value.dynamicTabs.map((tab) => ({
      ...tab,
      closable: true
    })));
    this.restoredActiveKey = value.activeKey;
  }

  private ensureActiveTab(): void {
    if (this.restoredActiveKey && this.tabs.some((tab) => tab.key === this.restoredActiveKey)) {
      this.activeKey = this.restoredActiveKey;
      this.restoredActiveKey = '';
      return;
    }
    if (!this.tabs.some((tab) => tab.key === this.activeKey)) {
      this.activeKey = this.tabs[0]?.key ?? '';
    }
  }

  private persistState(): void {
    if (!this.containerId) {
      return;
    }
    this.viewRouter.write(`${FLOW_TABS_SCOPE_PREFIX}${this.containerId}`, {
      activeKey: this.activeKey,
      dynamicTabs: this.dynamicTabs.map(({ key, title, node }) => ({ key, title, node }))
    } satisfies RoutedTabPanelState);
  }
}

function isRoutedTabPanelState(value: unknown): value is RoutedTabPanelState {
  return isRecord(value)
    && typeof value['activeKey'] === 'string'
    && Array.isArray(value['dynamicTabs'])
    && value['dynamicTabs'].every((tab) => isFlowTabRequest(tab));
}

function isFlowTabRequest(value: unknown): value is FlowTabRequest {
  return isRecord(value)
    && typeof value['key'] === 'string'
    && typeof value['title'] === 'string'
    && isFlowNode(value['node']);
}

function isFlowNode(value: unknown): value is FlowNode {
  return isRecord(value)
    && typeof value['id'] === 'string'
    && typeof value['componentId'] === 'string'
    && isRecord(value['inputBindings'])
    && Array.isArray(value['children'])
    && value['children'].every((child) => isFlowNode(child))
    && Array.isArray(value['transitions']);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
