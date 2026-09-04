import { Routes } from '@angular/router';
import { FlowEngineService } from 'flow-platform';
import { providePatientWorkflowWidgets } from './patient-workflow.providers';
import { RuntimePageComponent } from './runtime-page/runtime-page.component';

/**
 * Stellt die produktive Benutzeroberfläche als Lazy-Route mit eigener Engine-Instanz bereit.
 */
export const USER_UI_ROUTES: Routes = [
  {
    path: '',
    component: RuntimePageComponent,
    // Jede Route bekommt ihre eigene Engine, damit Runtime-Zustände nicht zwischen Modulen geteilt werden.
    providers: [FlowEngineService, ...providePatientWorkflowWidgets()]
  }
];
