import { Routes } from '@angular/router';
import { FlowEngineService } from 'flow-platform';
import { providePatientWorkflowWidgets } from 'patient-workflow';
import { provideLaboratoryPortalWidgets } from './laboratory-portal.providers';
import { ReportcenterPageComponent } from './reportcenter-page/reportcenter-page.component';

export const REPORTCENTER_ROUTES: Routes = [
  {
    path: '',
    component: ReportcenterPageComponent,
    providers: [
      FlowEngineService,
      ...providePatientWorkflowWidgets(),
      ...provideLaboratoryPortalWidgets()
    ]
  }
];
