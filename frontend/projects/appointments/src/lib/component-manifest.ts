import { ComponentDescriptor, ComponentManifest } from 'flow-platform';
import manifest from '../appointments.components.json';

export const appointmentsComponentManifest = manifest as ComponentManifest;

export function appointmentsComponent(id: string): ComponentDescriptor {
  const descriptor = appointmentsComponentManifest.components.find((component) => component.id === id);
  if (!descriptor) {
    throw new Error(`Komponente '${id}' fehlt im Metadaten-Manifest von appointments.`);
  }
  return descriptor;
}
