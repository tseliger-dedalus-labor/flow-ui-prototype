import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest, Observable } from 'rxjs';
import { FlowApiService, FlowEngineService, FlowNode, FlowRendererComponent } from 'flow-platform';

@Component({
    selector: 'app-runtime-page',
    imports: [CommonModule, FlowRendererComponent],
    templateUrl: './runtime-page.component.html',
    styleUrl: './runtime-page.component.scss'
})
export class RuntimePageComponent implements OnInit {
  error = '';
  vm$: Observable<{ node: FlowNode | null; context: Record<string, unknown> }>;

  constructor(public readonly engine: FlowEngineService, private readonly api: FlowApiService) {
    this.vm$ = combineLatest({ node: this.engine.currentNode$, context: this.engine.context$ });
  }

  ngOnInit(): void {
    this.api.getEffectiveFlow().subscribe({
      next: (definition) => this.engine.initialize(definition),
      error: () => this.error = 'Flow konnte nicht geladen werden.'
    });
  }

  back(): void {
    this.engine.goBack();
  }
}
