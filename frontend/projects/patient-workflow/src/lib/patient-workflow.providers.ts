import { Provider } from '@angular/core';
import { provideFlowWidget } from 'flow-platform';
import { DemographicsPanelComponent } from './widgets/demographics-panel.component';
import { FindingsPanelComponent } from './widgets/findings-panel.component';
import { OrdersPanelComponent } from './widgets/orders-panel.component';
import { PatientListComponent } from './widgets/patient-list.component';
import { PatientViewComponent } from './widgets/patient-view.component';
import { StackLayoutComponent } from './widgets/stack-layout.component';
import { TransfusionsPanelComponent } from './widgets/transfusions-panel.component';
import { WardListComponent } from './widgets/ward-list.component';

export function providePatientWorkflowWidgets(): Provider[] {
  return [
    provideFlowWidget('ward-list', WardListComponent),
    provideFlowWidget('patient-list', PatientListComponent),
    provideFlowWidget('patient-view', PatientViewComponent),
    provideFlowWidget('stack-layout', StackLayoutComponent),
    provideFlowWidget('demographics-panel', DemographicsPanelComponent),
    provideFlowWidget('findings-panel', FindingsPanelComponent),
    provideFlowWidget('orders-panel', OrdersPanelComponent),
    provideFlowWidget('transfusions-panel', TransfusionsPanelComponent)
  ];
}
