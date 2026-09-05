import { Component, Input, OnChanges } from '@angular/core';
import { FlowSidebarPanel } from '../../flow-engine.service';
import { FlowNode, FlowSidebar, SidebarMode } from '../../models';
import { FlowRendererComponent } from '../flow-renderer/flow-renderer.component';

/**
 * Ordnet Hauptinhalt und optionale Sidebar eines Flows in einem gemeinsamen Layout an.
 */
@Component({
  selector: 'app-flow-layout',
  imports: [FlowRendererComponent],
  templateUrl: './flow-layout.component.html',
  styleUrl: './flow-layout.component.scss'
})
export class FlowLayoutComponent implements OnChanges {
  @Input() node!: FlowNode;
  @Input() sidebarNode: FlowNode | null = null;
  @Input() sidebar: FlowSidebar | null = null;
  @Input() sidebarPanels: FlowSidebarPanel[] = [];
  @Input() sidebarMode: SidebarMode = 'SINGLE';
  @Input() context: Record<string, unknown> = {};
  expandedSidebarNodeId: string | null = null;

  ngOnChanges(): void {
    if (this.sidebarMode !== 'COLLAPSE') {
      return;
    }
    if (this.sidebarNode && this.sidebarNode.id !== this.node.id) {
      this.expandedSidebarNodeId = this.sidebarNode.id;
      return;
    }
    if (!this.sidebarPanels.some((panel) => panel.node.id === this.expandedSidebarNodeId)) {
      this.expandedSidebarNodeId = this.sidebarPanels[0]?.node.id ?? null;
    }
  }

  /**
   * Zeigt die Sidebar nur dann an, wenn ein separater Knoten konfiguriert ist.
   */
  get showSidebar(): boolean {
    if (this.sidebarMode === 'COLLAPSE') {
      return this.sidebarPanels.some((panel) => panel.node.id !== this.node.id);
    }
    return this.sidebar !== null
      && this.sidebarNode !== null
      && this.sidebarNode.id !== this.node.id;
  }

  /**
   * Wandelt die numerische Sidebar-Breite in eine CSS-kompatible Variable um.
   */
  get sidebarWidth(): string {
    return `${this.sidebarConfig?.width ?? 280}px`;
  }

  get sidebarPosition(): FlowSidebar['position'] {
    return this.sidebarConfig?.position ?? 'LEFT';
  }

  toggleSidebar(nodeId: string): void {
    this.expandedSidebarNodeId = this.expandedSidebarNodeId === nodeId ? null : nodeId;
  }

  private get sidebarConfig(): FlowSidebar | null {
    return this.sidebar ?? this.sidebarPanels[0]?.sidebar ?? null;
  }
}
