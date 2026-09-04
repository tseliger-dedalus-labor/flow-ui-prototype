import { defineFlowComponent, IxtDisplayType } from 'flow-platform';
import { DemographicsPanelComponent } from './widgets/demographics-panel/demographics-panel.component';
import { FindingsPanelComponent } from './widgets/findings-panel/findings-panel.component';
import { OrdersPanelComponent } from './widgets/orders-panel/orders-panel.component';
import { PatientListComponent } from './widgets/patient-list/patient-list.component';
import { PatientViewComponent } from './widgets/patient-view/patient-view.component';
import { StackLayoutComponent } from './widgets/stack-layout/stack-layout.component';
import { TransfusionsPanelComponent } from './widgets/transfusions-panel/transfusions-panel.component';
import { WardListComponent } from './widgets/ward-list/ward-list.component';

/**
 * Deklariert alle im Patient-Workflow verfügbaren Flow-Komponenten für Runtime und Manifest-Generator.
 */
export const FLOW_COMPONENTS = [
  defineFlowComponent(WardListComponent, {
    id: 'ward-list',
    title: 'Stationsliste',
    container: false,
    inputs: [],
    outputs: [
      {
        name: 'wardSelected',
        payload: {
          wardId: 'WARD_ID'
        }
      }
    ]
  }),
  defineFlowComponent(PatientListComponent, {
    id: 'patient-list',
    title: 'Patientenliste',
    displayType: IxtDisplayType.DISPTYPE_WEC_PAT_LIST,
    container: false,
    inputs: [
      {
        name: 'wardId',
        semanticType: 'WARD_ID',
        required: true,
        allowedValues: []
      },
      {
        name: 'mode',
        semanticType: 'MODE',
        required: true,
        allowedValues: [
          'normal',
          'findings',
          'orders',
          'transfusions'
        ]
      }
    ],
    outputs: [
      {
        name: 'patientSelected',
        payload: {
          patientId: 'PATIENT_ID'
        }
      }
    ]
  }),
  defineFlowComponent(PatientViewComponent, {
    id: 'patient-view',
    title: 'Patientenansicht',
    displayType: IxtDisplayType.DISPTYPE_WEC_INDEX,
    container: true,
    inputs: [
      {
        name: 'patientId',
        semanticType: 'PATIENT_ID',
        required: true,
        allowedValues: []
      }
    ],
    outputs: []
  }),
  defineFlowComponent(StackLayoutComponent, {
    id: 'stack-layout',
    title: 'Stack-Layout',
    container: true,
    inputs: [],
    outputs: []
  }),
  defineFlowComponent(DemographicsPanelComponent, {
    id: 'demographics-panel',
    title: 'Stammdaten',
    displayType: IxtDisplayType.DISPTYPE_WEC_CAVE,
    container: false,
    inputs: [
      {
        name: 'patientId',
        semanticType: 'PATIENT_ID',
        required: true,
        allowedValues: []
      }
    ],
    outputs: []
  }),
  defineFlowComponent(FindingsPanelComponent, {
    id: 'findings-panel',
    title: 'Befunde',
    displayType: IxtDisplayType.DISPTYPE_REPORT,
    container: false,
    inputs: [
      {
        name: 'patientId',
        semanticType: 'PATIENT_ID',
        required: true,
        allowedValues: []
      }
    ],
    outputs: []
  }),
  defineFlowComponent(OrdersPanelComponent, {
    id: 'orders-panel',
    title: 'Aufträge',
    displayType: IxtDisplayType.DISPTYPE_FORM,
    container: false,
    inputs: [
      {
        name: 'patientId',
        semanticType: 'PATIENT_ID',
        required: true,
        allowedValues: []
      }
    ],
    outputs: []
  }),
  defineFlowComponent(TransfusionsPanelComponent, {
    id: 'transfusions-panel',
    title: 'Transfusionen',
    displayType: IxtDisplayType.DISPTYPE_WEC_INDEX_TRAFU,
    container: false,
    inputs: [
      {
        name: 'patientId',
        semanticType: 'PATIENT_ID',
        required: true,
        allowedValues: []
      }
    ],
    outputs: []
  })
];
