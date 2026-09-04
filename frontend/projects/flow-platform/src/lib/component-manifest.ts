import { ComponentDescriptor } from './models';

/**
 * Beschreibt das generierte Komponenten-Manifest eines Feature-Pakets.
 */
export interface ComponentManifest {
  /** Versionsnummer des Manifestformats. */
  schemaVersion: number;
  /** NPM-Paketname des liefernden Feature-Pakets. */
  module: string;
  /** Paketversion, mit der das Manifest erzeugt wurde. */
  moduleVersion: string;
  /** Statisch ausgewertete Flow-Komponenten des Pakets. */
  components: ComponentDescriptor[];
}
