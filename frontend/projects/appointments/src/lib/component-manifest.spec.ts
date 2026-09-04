import { IxtDisplayType } from 'flow-platform';
import { appointmentsComponent, appointmentsComponentManifest } from './component-manifest';
import { FLOW_COMPONENTS } from './flow-components';

/**
 * Schützt das Appointments-Manifest als Architekturvertrag zwischen Registry und UI.
 * Die Suite prüft, dass Metadaten, Komponentenliste und Display-Typ-Mapping unverändert
 * bleiben, damit die Runtime die Stationstermine korrekt rendern kann.
 */
describe('appointments component manifest', () => {
  it('publishes the appointments panel metadata', () => {
    expect(appointmentsComponentManifest.schemaVersion).toBe(1);
    expect(appointmentsComponentManifest.module).toBe('appointments');
    // Die Manifest-Liste muss 1:1 den registrierten Deskriptoren entsprechen.
    expect(appointmentsComponentManifest.components)
      .toEqual(FLOW_COMPONENTS.map((definition) => definition.descriptor));
    expect(appointmentsComponent('appointments-panel').inputs[0].semanticType).toBe('WARD_ID');
    // Der Display-Typ ist der stabile UI-Vertrag für die Zuordnung im Flow-Editor.
    expect(appointmentsComponent('appointments-panel').displayType)
      .toBe(IxtDisplayType.DISPTYPE_APP_WARD_OVERVIEW);
  });

  it('rejects registrations without metadata', () => {
    expect(() => appointmentsComponent('unknown')).toThrowError(/fehlt im Metadaten-Manifest/);
  });
});
