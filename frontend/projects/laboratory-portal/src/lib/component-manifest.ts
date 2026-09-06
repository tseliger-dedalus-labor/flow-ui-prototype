import { ComponentDescriptor, ComponentManifest } from 'flow-platform';
import manifest from '../laboratory-portal.components.json';

export const laboratoryPortalComponentManifest = manifest as ComponentManifest;

export function laboratoryPortalComponent(id: string): ComponentDescriptor {
  const descriptor = laboratoryPortalComponentManifest.components.find((component) => component.id === id);
  if (!descriptor) {
    throw new Error(`Komponente '${id}' fehlt im Metadaten-Manifest von laboratory-portal.`);
  }
  return descriptor;
}
