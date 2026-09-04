import { Routes } from '@angular/router';
import { FlowEngineService } from 'flow-platform';
import { providePatientWorkflowWidgets } from './patient-workflow.providers';
import { RuntimePageComponent } from './runtime-page/runtime-page.component';

export const USER_UI_ROUTES: Routes = [
  {
    path: '',
    component: RuntimePageComponent,
    providers: [FlowEngineService, ...providePatientWorkflowWidgets()]
  }
];
