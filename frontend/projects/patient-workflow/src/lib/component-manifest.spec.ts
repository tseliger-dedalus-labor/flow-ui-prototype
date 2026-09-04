import { IxtDisplayType } from 'flow-platform';
import { patientWorkflowComponent, patientWorkflowComponentManifest } from './component-manifest';
import { FLOW_COMPONENTS } from './flow-components';

describe('patient workflow component manifest', () => {
  it('publishes every registered component with versioned metadata', () => {
    expect(patientWorkflowComponentManifest.schemaVersion).toBe(1);
    expect(patientWorkflowComponentManifest.module).toBe('patient-workflow');
    expect(patientWorkflowComponentManifest.moduleVersion).toBe('1.0.0');
    expect(patientWorkflowComponentManifest.components.length).toBe(8);
    expect(patientWorkflowComponentManifest.components)
      .toEqual(FLOW_COMPONENTS.map((definition) => definition.descriptor));
    expect(patientWorkflowComponent('patient-list').inputs.map((input) => input.name))
      .toEqual(['wardId', 'mode']);
    expect(patientWorkflowComponent('patient-list').displayType)
      .toBe(IxtDisplayType.DISPTYPE_WEC_PAT_LIST);
    expect(patientWorkflowComponent('patient-view').displayType)
      .toBe(IxtDisplayType.DISPTYPE_WEC_INDEX);
  });

  it('rejects registrations without metadata', () => {
    expect(() => patientWorkflowComponent('unknown')).toThrowError(/fehlt im Metadaten-Manifest/);
  });
});
