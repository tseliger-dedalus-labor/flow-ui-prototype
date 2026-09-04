import { ComponentDescriptor, ComponentManifest } from 'flow-platform';
import manifest from '../patient-workflow.components.json';

export const patientWorkflowComponentManifest = manifest as ComponentManifest;

export function patientWorkflowComponent(id: string): ComponentDescriptor {
  const descriptor = patientWorkflowComponentManifest.components.find((component) => component.id === id);
  if (!descriptor) {
    throw new Error(`Komponente '${id}' fehlt im Metadaten-Manifest von patient-workflow.`);
  }
  return descriptor;
}
