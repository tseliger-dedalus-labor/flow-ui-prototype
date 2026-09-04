import { Provider } from '@angular/core';
import { provideFlowWidget } from 'flow-platform';
import { DemographicsPanelComponent } from './widgets/demographics-panel/demographics-panel.component';
import { FindingsPanelComponent } from './widgets/findings-panel/findings-panel.component';
import { OrdersPanelComponent } from './widgets/orders-panel/orders-panel.component';
import { PatientListComponent } from './widgets/patient-list/patient-list.component';
import { PatientViewComponent } from './widgets/patient-view/patient-view.component';
import { StackLayoutComponent } from './widgets/stack-layout/stack-layout.component';
import { TransfusionsPanelComponent } from './widgets/transfusions-panel/transfusions-panel.component';
import { WardListComponent } from './widgets/ward-list/ward-list.component';
import { patientWorkflowComponent } from './component-manifest';

export function providePatientWorkflowWidgets(): Provider[] {
  return [
    provideFlowWidget(patientWorkflowComponent('ward-list'), WardListComponent),
    provideFlowWidget(patientWorkflowComponent('patient-list'), PatientListComponent),
    provideFlowWidget(patientWorkflowComponent('patient-view'), PatientViewComponent),
    provideFlowWidget(patientWorkflowComponent('stack-layout'), StackLayoutComponent),
    provideFlowWidget(patientWorkflowComponent('demographics-panel'), DemographicsPanelComponent),
    provideFlowWidget(patientWorkflowComponent('findings-panel'), FindingsPanelComponent),
    provideFlowWidget(patientWorkflowComponent('orders-panel'), OrdersPanelComponent),
    provideFlowWidget(patientWorkflowComponent('transfusions-panel'), TransfusionsPanelComponent)
  ];
}
