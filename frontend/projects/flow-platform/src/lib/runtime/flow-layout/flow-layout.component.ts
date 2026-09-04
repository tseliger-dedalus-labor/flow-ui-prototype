import { Component, Input } from '@angular/core';
import { FlowNode, FlowSidebar } from '../../models';
import { FlowRendererComponent } from '../flow-renderer/flow-renderer.component';

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

  get showSidebar(): boolean {
    return this.sidebar !== null
      && this.sidebarNode !== null
      && this.sidebarNode.id !== this.node.id;
  }

  get sidebarWidth(): string {
    return `${this.sidebar?.width ?? 280}px`;
  }
}
