import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest, Observable } from 'rxjs';
import { ApiService } from '../services/api.service';
import { FlowEngineService } from '../services/flow-engine.service';
import { FlowRendererComponent } from '../components/runtime/flow-renderer.component';
import { FlowNode } from '../models';

@Component({
    selector: 'app-runtime-page',
    imports: [CommonModule, FlowRendererComponent],
    template: `
    <section>
      <h2>Runtime</h2>
      <button type="button" (click)="back()" [disabled]="!engine.canGoBack()">Zurück</button>
      @if (error) {
        <p class="error">{{ error }}</p>
      }
      @if (vm$ | async; as vm) {
        @if (vm.node) {
          <app-flow-renderer [node]="vm.node" [context]="vm.context" />
        }
      }
    </section>
    `,
    styles: ['.error { color: #a32727; }']
})
export class RuntimePageComponent implements OnInit {
  error = '';
  vm$: Observable<{ node: FlowNode | null; context: Record<string, unknown> }>;

  constructor(public readonly engine: FlowEngineService, private readonly api: ApiService) {
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
