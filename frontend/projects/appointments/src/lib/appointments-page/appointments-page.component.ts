import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { FlowApiService, FlowEngineService, FlowLayoutComponent, FlowNode, FlowSidebar } from 'flow-platform';

@Component({
  selector: 'app-appointments-page',
  imports: [CommonModule, FlowLayoutComponent],
  templateUrl: './appointments-page.component.html',
  styleUrl: './appointments-page.component.scss'
})
export class AppointmentsPageComponent implements OnInit {
  error = '';
  vm$: Observable<{
    node: FlowNode | null;
    sidebarNode: FlowNode | null;
    sidebar: FlowSidebar | null;
    context: Record<string, unknown>;
  }>;

  constructor(public readonly engine: FlowEngineService, private readonly api: FlowApiService) {
    this.vm$ = combineLatest({
      node: this.engine.currentNode$,
      sidebarNode: this.engine.sidebarNode$,
      sidebar: this.engine.sidebar$,
      context: this.engine.context$
    });
  }

  ngOnInit(): void {
    this.api.getFlow('flow-appointments').subscribe({
      next: (definition) => this.engine.initialize(definition),
      error: () => this.error = 'Terminplanung konnte nicht geladen werden.'
    });
  }

  back(): void {
    this.engine.goBack();
  }
}
