import { IxtDisplayType } from 'flow-platform';
import { appointmentsComponent, appointmentsComponentManifest } from './component-manifest';
import { FLOW_COMPONENTS } from './flow-components';

describe('appointments component manifest', () => {
  it('publishes the appointments panel metadata', () => {
    expect(appointmentsComponentManifest.schemaVersion).toBe(1);
    expect(appointmentsComponentManifest.module).toBe('appointments');
    expect(appointmentsComponentManifest.components)
      .toEqual(FLOW_COMPONENTS.map((definition) => definition.descriptor));
    expect(appointmentsComponent('appointments-panel').inputs[0].semanticType).toBe('WARD_ID');
    expect(appointmentsComponent('appointments-panel').displayType)
      .toBe(IxtDisplayType.DISPTYPE_APP_WARD_OVERVIEW);
  });

  it('rejects registrations without metadata', () => {
    expect(() => appointmentsComponent('unknown')).toThrowError(/fehlt im Metadaten-Manifest/);
  });
});
