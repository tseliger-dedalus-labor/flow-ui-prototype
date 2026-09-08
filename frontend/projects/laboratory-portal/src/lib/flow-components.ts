import { defineFlowComponent, IxtDisplayType } from 'flow-platform';
import { ReportcenterComponent } from './widgets/reportcenter/reportcenter.component';

export const FLOW_COMPONENTS = [
  defineFlowComponent(ReportcenterComponent, {
    id: 'reportcenter',
    title: 'Reportcenter',
    displayType: IxtDisplayType.DISPTYPE_REPORTCENTER_VIEW,
    presenter: 'CONTENT',
    container: false,
    inputs: [],
    outputs: [
      {
        name: 'recordSelected',
        payload: {
         RecordID: 'RECORD_ID',
        }
      }
    ]
  })
];
