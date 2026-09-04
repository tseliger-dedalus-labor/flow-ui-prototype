import { defineFlowComponent, IxtDisplayType } from 'flow-platform';
import { AppointmentsPanelComponent } from './widgets/appointments-panel/appointments-panel.component';

/**
 * Deklariert alle Flow-Komponenten des Terminplanungs-Moduls für Manifest-Generierung und Runtime.
 */
export const FLOW_COMPONENTS = [
  defineFlowComponent(AppointmentsPanelComponent, {
    id: 'appointments-panel',
    title: 'Terminplanung',
    displayType: IxtDisplayType.DISPTYPE_APP_WARD_OVERVIEW,
    presenter: 'CONTENT',
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
