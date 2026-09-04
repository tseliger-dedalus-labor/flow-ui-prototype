import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FlowApiService, FlowEngineService, FlowLayoutComponent, ToolRuntimePage, ViewRouterService } from 'flow-platform';

/**
 * Einstiegskomponente für die Terminplanungs-Runtime.
 */
@Component({
  selector: 'app-appointments-page',
  imports: [CommonModule, FormsModule, FlowLayoutComponent],
  templateUrl: './appointments-page.component.html',
  styleUrl: './appointments-page.component.scss'
})
export class AppointmentsPageComponent extends ToolRuntimePage implements OnInit {
  constructor(engine: FlowEngineService, api: FlowApiService, viewRouter: ViewRouterService) {
    super(
      engine,
      api,
      viewRouter,
      'AppointmentTool',
      'Verfügbare Termin-Flows konnten nicht geladen werden.',
      'Termin-Flow konnte nicht geladen werden.'
    );
  }
}
