import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FlowApiService, FlowEngineService, FlowLayoutComponent, ToolRuntimePage, ViewRouterService } from 'flow-platform';

@Component({
  selector: 'laboratory-reportcenter-page',
  imports: [CommonModule, FormsModule, FlowLayoutComponent],
  templateUrl: './reportcenter-page.component.html',
  styleUrl: './reportcenter-page.component.scss'
})
export class ReportcenterPageComponent extends ToolRuntimePage implements OnInit {
  constructor(engine: FlowEngineService, api: FlowApiService, viewRouter: ViewRouterService) {
    super(
      engine,
      api,
      viewRouter,
      'ReportcenterTool',
      'Verfügbare Reportcenter-Flows konnten nicht geladen werden.',
      'Reportcenter-Flow konnte nicht geladen werden.'
    );
  }
}
