import { IxtDisplayType } from 'flow-platform';
import { laboratoryPortalComponent, laboratoryPortalComponentManifest } from './component-manifest';
import { FLOW_COMPONENTS } from './flow-components';

describe('laboratory portal component manifest', () => {
  it('publishes the Reportcenter presenter metadata', () => {
    expect(laboratoryPortalComponentManifest.schemaVersion).toBe(2);
    expect(laboratoryPortalComponentManifest.module).toBe('laboratory-portal');
    expect(laboratoryPortalComponentManifest.components)
      .toEqual(FLOW_COMPONENTS.map((definition) => definition.descriptor));
    const reportcenter = laboratoryPortalComponent('reportcenter');
    expect(reportcenter.displayType).toBe(IxtDisplayType.DISPTYPE_REPORTCENTER_VIEW);
    expect(reportcenter.inputs).toEqual([]);
    expect(reportcenter.outputs).toEqual([
      {
        name: 'recordSelected',
        payload: { RecordID: 'RECORD_ID', CaseID: 'CASE_ID', PatientID: 'PATIENT_ID' }
      }
    ]);
  });
});
