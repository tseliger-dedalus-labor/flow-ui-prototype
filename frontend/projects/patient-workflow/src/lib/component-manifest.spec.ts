import { IxtDisplayType } from 'flow-platform';
import { patientWorkflowComponent, patientWorkflowComponentManifest } from './component-manifest';
import { FLOW_COMPONENTS } from './flow-components';

/**
 * Schützt das Manifest des Patienten-Workflows als zentrale Registry-Anbindung.
 * Die Suite stellt sicher, dass alle Komponenten, Metadaten und Display-Typen konsistent
 * an den Flow-Editor und die Runtime übergeben werden.
 */
describe('patient workflow component manifest', () => {
  it('publishes every registered component with versioned metadata', () => {
    expect(patientWorkflowComponentManifest.schemaVersion).toBe(2);
    expect(patientWorkflowComponentManifest.module).toBe('patient-workflow');
    expect(patientWorkflowComponentManifest.moduleVersion).toBe('1.0.0');
    expect(patientWorkflowComponentManifest.components.length).toBe(11);
    // Die Manifest-Liste ist die verbindliche Quelle für die registrierten Komponenten.
    expect(patientWorkflowComponentManifest.components)
      .toEqual(FLOW_COMPONENTS.map((definition) => definition.descriptor));
    expect(patientWorkflowComponent('patient-list-content').inputs.map((input) => input.name))
      .toEqual(['wardId', 'mode']);
    expect(patientWorkflowComponent('patient-list-content').outputs[0].payload)
      .toEqual({ patientId: 'PATIENT_ID', caseId: 'CASE_ID' });
    expect(patientWorkflowComponent('patient-view').inputs.map((input) => input.name))
      .toEqual(['patientId', 'caseId']);
    expect(patientWorkflowComponent('patient-view').outputs).toEqual([{
      name: 'recordSelected',
      payload: { RecordId: 'RECORD_ID', prtType: 'PRT_TYPE' }
    }]);
    // Die Display-Typ-Zuordnung muss mit den UI-Kacheln des Patienten-Workflows übereinstimmen.
    expect(patientWorkflowComponent('patient-list-content').displayType)
      .toBe(IxtDisplayType.DISPTYPE_WEC_PAT_LIST);
    expect(patientWorkflowComponent('patient-list-content').presenter).toBe('CONTENT');
    expect(patientWorkflowComponent('patient-list-sidebar').presenter).toBe('SIDEBAR');
    expect(patientWorkflowComponent('ward-list-content').presenter).toBe('CONTENT');
    expect(patientWorkflowComponent('ward-list-sidebar').presenter).toBe('SIDEBAR');
    expect(patientWorkflowComponent('patient-view').displayType)
      .toBe(IxtDisplayType.DISPTYPE_WEC_INDEX);
    expect(patientWorkflowComponent('tab-panel').container).toBeTrue();
    expect(patientWorkflowComponent('orders-panel').inputs.map((input) => input.name))
      .toEqual(['patientId', 'caseId', 'RecordId']);
    expect(patientWorkflowComponent('findings-panel').inputs.map((input) => input.name))
      .toEqual(['patientId', 'caseId', 'RecordId']);
    expect(patientWorkflowComponent('transfusions-panel').inputs.map((input) => input.name))
      .toEqual(['patientId', 'RecordId']);
  });

  it('rejects registrations without metadata', () => {
    expect(() => patientWorkflowComponent('unknown')).toThrowError(/fehlt im Metadaten-Manifest/);
  });
});
