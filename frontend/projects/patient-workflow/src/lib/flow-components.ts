import { defineFlowComponent, IxtDisplayType } from 'flow-platform';
import { DemographicsPanelComponent } from './widgets/demographics-panel/demographics-panel.component';
import { FindingsPanelComponent } from './widgets/findings-panel/findings-panel.component';
import { OrderComponent } from './widgets/order/order.component';
import { OrdersPanelComponent } from './widgets/orders-panel/orders-panel.component';
import { PatientListSidebarComponent } from './widgets/patient-list/patient-list.component';
import { PatientListContentComponent } from './widgets/patient-list-content/patient-list-content.component';
import { PatientViewComponent } from './widgets/patient-view/patient-view.component';
import { StackLayoutComponent } from './widgets/stack-layout/stack-layout.component';
import { TabPanelComponent } from './widgets/tab-panel/tab-panel.component';
import { TransfusionsPanelComponent } from './widgets/transfusions-panel/transfusions-panel.component';
import { WardListSidebarComponent } from './widgets/ward-list/ward-list.component';
import { WardListContentComponent } from './widgets/ward-list-content/ward-list-content.component';

/**
 * Deklariert alle im Patient-Workflow verfügbaren Flow-Komponenten für Runtime und Manifest-Generator.
 */
export const FLOW_COMPONENTS = [
  defineFlowComponent(WardListContentComponent, {
    id: 'ward-list-content',
    title: 'Stationsliste',
    presenter: 'CONTENT',
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
  defineFlowComponent(WardListSidebarComponent, {
    id: 'ward-list-sidebar',
    title: 'Stationsliste (Sidebar)',
    presenter: 'SIDEBAR',
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
  defineFlowComponent(PatientListContentComponent, {
    id: 'patient-list-content',
    title: 'Patientenliste',
    displayType: IxtDisplayType.DISPTYPE_WEC_PAT_LIST,
    presenter: 'CONTENT',
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
          patientId: 'PATIENT_ID',
          caseId: 'CASE_ID'
        }
      }
    ]
  }),
  defineFlowComponent(PatientListSidebarComponent, {
    id: 'patient-list-sidebar',
    title: 'Patientenliste (Sidebar)',
    presenter: 'SIDEBAR',
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
          patientId: 'PATIENT_ID',
          caseId: 'CASE_ID'
        }
      }
    ]
  }),
  defineFlowComponent(PatientViewComponent, {
    id: 'patient-view',
    title: 'Patientenansicht',
    displayType: IxtDisplayType.DISPTYPE_WEC_INDEX,
    presenter: 'CONTENT',
    container: true,
    inputs: [
      {
        name: 'patientId',
        semanticType: 'PATIENT_ID',
        required: true,
        allowedValues: []
      },
      {
        name: 'caseId',
        semanticType: 'CASE_ID',
        required: true,
        allowedValues: []
      }
    ],
    outputs: []
  }),
  defineFlowComponent(StackLayoutComponent, {
    id: 'stack-layout',
    title: 'Stack-Layout',
    presenter: 'CONTENT',
    container: true,
    inputs: [],
    outputs: []
  }),
  defineFlowComponent(TabPanelComponent, {
    id: 'tab-panel',
    title: 'Tab-Panel',
    presenter: 'CONTENT',
    container: true,
    inputs: [],
    outputs: []
  }),
  defineFlowComponent(DemographicsPanelComponent, {
    id: 'demographics-panel',
    title: 'Stammdaten',
    displayType: IxtDisplayType.DISPTYPE_WEC_CAVE,
    presenter: 'CONTENT',
    container: false,
    inputs: [
      {
        name: 'patientId',
        semanticType: 'PATIENT_ID',
        required: true,
        allowedValues: []
      },
      {
        name: 'caseId',
        semanticType: 'CASE_ID',
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
    presenter: 'CONTENT',
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
    presenter: 'CONTENT',
    container: false,
    inputs: [
      {
        name: 'patientId',
        semanticType: 'PATIENT_ID',
        required: true,
        allowedValues: []
      },
      {
        name: 'caseId',
        semanticType: 'CASE_ID',
        required: true,
        allowedValues: []
      }
    ],
    outputs: [
      {
        name: 'orderSelected',
        payload: {
          RecordId: 'RECORD_ID'
        }
      }
    ]
  }),
  defineFlowComponent(OrderComponent, {
    id: 'order-view',
    title: 'Auftrag',
    presenter: 'CONTENT',
    container: false,
    inputs: [
      {
        name: 'patientId',
        semanticType: 'PATIENT_ID',
        required: true,
        allowedValues: []
      },
      {
        name: 'caseId',
        semanticType: 'CASE_ID',
        required: true,
        allowedValues: []
      },
      {
        name: 'RecordId',
        semanticType: 'RECORD_ID',
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
    presenter: 'CONTENT',
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
