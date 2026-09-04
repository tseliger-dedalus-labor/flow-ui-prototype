import { defineFlowComponent } from 'flow-platform';
import { AppointmentsPanelComponent } from './widgets/appointments-panel/appointments-panel.component';

export const FLOW_COMPONENTS = [
  defineFlowComponent(AppointmentsPanelComponent, {
    id: 'appointments-panel',
    title: 'Terminplanung',
    container: false,
    inputs: [
      {
        name: 'wardId',
        semanticType: 'WARD_ID',
        required: true,
        allowedValues: []
      }
    ],
    outputs: []
  })
];
