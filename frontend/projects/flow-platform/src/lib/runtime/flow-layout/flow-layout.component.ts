import { Component, Input } from '@angular/core';
import { FlowNode, FlowSidebar } from '../../models';
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
export class FlowLayoutComponent {
  @Input() node!: FlowNode;
  @Input() sidebarNode: FlowNode | null = null;
  @Input() sidebar: FlowSidebar | null = null;
  @Input() context: Record<string, unknown> = {};

  /**
   * Zeigt die Sidebar nur dann an, wenn ein separater Knoten konfiguriert ist.
   */
  get showSidebar(): boolean {
    return this.sidebar !== null
      && this.sidebarNode !== null
      && this.sidebarNode.id !== this.node.id;
  }

  /**
   * Wandelt die numerische Sidebar-Breite in eine CSS-kompatible Variable um.
   */
  get sidebarWidth(): string {
    return `${this.sidebar?.width ?? 280}px`;
  }
}
