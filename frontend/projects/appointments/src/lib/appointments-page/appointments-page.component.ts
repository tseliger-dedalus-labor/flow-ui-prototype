import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { FlowApiService, FlowEngineService, FlowNode, FlowRendererComponent } from 'flow-platform';

@Component({
  selector: 'app-appointments-page',
  imports: [CommonModule, FlowRendererComponent],
  templateUrl: './appointments-page.component.html',
  styleUrl: './appointments-page.component.scss'
})
export class AppointmentsPageComponent implements OnInit {
  error = '';
  vm$: Observable<{ node: FlowNode | null; context: Record<string, unknown> }>;

  constructor(public readonly engine: FlowEngineService, private readonly api: FlowApiService) {
    this.vm$ = combineLatest({ node: this.engine.currentNode$, context: this.engine.context$ });
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
