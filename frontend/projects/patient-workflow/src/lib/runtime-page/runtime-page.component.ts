import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest, Observable } from 'rxjs';
import { FlowApiService, FlowEngineService, FlowLayoutComponent, FlowNode, FlowSidebar } from 'flow-platform';

/**
 * Einstiegskomponente für die produktive Flow-Runtime des Benutzerbereichs.
 */
@Component({
    selector: 'app-runtime-page',
    imports: [CommonModule, FlowLayoutComponent],
    templateUrl: './runtime-page.component.html',
    styleUrl: './runtime-page.component.scss'
})
export class RuntimePageComponent implements OnInit {
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

  /**
   * Lädt den aktuell wirksamen Flow vom Backend.
   */
  ngOnInit(): void {
    this.api.getEffectiveFlow().subscribe({
      next: (definition) => this.engine.initialize(definition),
      error: () => this.error = 'Flow konnte nicht geladen werden.'
    });
  }

  /**
   * Delegiert den Rücksprung an die Flow-Engine.
   */
  back(): void {
    this.engine.goBack();
  }
}
