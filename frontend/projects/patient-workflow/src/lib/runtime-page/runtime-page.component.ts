import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FlowApiService, FlowEngineService, FlowLayoutComponent, ToolRuntimePage } from 'flow-platform';

/**
 * Einstiegskomponente für die produktive Flow-Runtime des Benutzerbereichs.
 */
@Component({
    selector: 'app-runtime-page',
    imports: [CommonModule, FormsModule, FlowLayoutComponent],
    templateUrl: './runtime-page.component.html',
    styleUrl: './runtime-page.component.scss'
})
export class RuntimePageComponent extends ToolRuntimePage implements OnInit {
  constructor(engine: FlowEngineService, api: FlowApiService) {
    super(
      engine,
      api,
      'WebclientTool',
      'Verfügbare Webclient-Flows konnten nicht geladen werden.',
      'Webclient-Flow konnte nicht geladen werden.'
    );
  }
}
