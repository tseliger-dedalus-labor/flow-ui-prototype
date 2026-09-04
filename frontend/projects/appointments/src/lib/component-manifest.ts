import { ComponentDescriptor, ComponentManifest } from 'flow-platform';
import manifest from '../appointments.components.json';

/**
 * Enthält das generierte Komponenten-Manifest des Appointments-Pakets.
 */
export const appointmentsComponentManifest = manifest as ComponentManifest;

/**
 * Liefert den Descriptor einer Appointment-Komponente oder wirft bei Manifest-Drift einen Fehler.
 */
export function appointmentsComponent(id: string): ComponentDescriptor {
  const descriptor = appointmentsComponentManifest.components.find((component) => component.id === id);
  if (!descriptor) {
    throw new Error(`Komponente '${id}' fehlt im Metadaten-Manifest von appointments.`);
  }
  return descriptor;
}
