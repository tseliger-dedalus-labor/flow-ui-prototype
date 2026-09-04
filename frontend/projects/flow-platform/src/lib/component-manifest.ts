import { ComponentDescriptor } from './models';

export interface ComponentManifest {
  schemaVersion: number;
  module: string;
  moduleVersion: string;
  components: ComponentDescriptor[];
}
