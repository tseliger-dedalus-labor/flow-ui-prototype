import { patientWorkflowComponent, patientWorkflowComponentManifest } from './component-manifest';

describe('patient workflow component manifest', () => {
  it('publishes every registered component with versioned metadata', () => {
    expect(patientWorkflowComponentManifest.schemaVersion).toBe(1);
    expect(patientWorkflowComponentManifest.module).toBe('patient-workflow');
    expect(patientWorkflowComponentManifest.moduleVersion).toBe('1.0.0');
    expect(patientWorkflowComponentManifest.components.length).toBe(8);
    expect(patientWorkflowComponent('patient-list').inputs.map((input) => input.name))
      .toEqual(['wardId', 'mode']);
  });

  it('rejects registrations without metadata', () => {
    expect(() => patientWorkflowComponent('unknown')).toThrowError(/fehlt im Metadaten-Manifest/);
  });
});
