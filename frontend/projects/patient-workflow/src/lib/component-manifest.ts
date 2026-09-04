import { ComponentDescriptor, ComponentManifest } from 'flow-platform';
import manifest from '../patient-workflow.components.json';

/**
 * Enthält das generierte Komponenten-Manifest des Patient-Workflow-Pakets.
 */
export const patientWorkflowComponentManifest = manifest as ComponentManifest;

/**
 * Liefert den Descriptor einer Patient-Workflow-Komponente oder meldet Manifest-Abweichungen frühzeitig.
 */
export function patientWorkflowComponent(id: string): ComponentDescriptor {
  const descriptor = patientWorkflowComponentManifest.components.find((component) => component.id === id);
  if (!descriptor) {
    throw new Error(`Komponente '${id}' fehlt im Metadaten-Manifest von patient-workflow.`);
  }
  return descriptor;
}
