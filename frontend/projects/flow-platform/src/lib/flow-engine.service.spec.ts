import { FlowEngineService } from './flow-engine.service';
import { FlowDefinition } from './models';

/**
 * Schützt die Laufzeitmaschine der Flow-Plattform.
 * Die Suite verifiziert Kontextweitergabe, Zurück-Navigation und Sidebar-Verhalten als
 * Kernvertrag für Rendering, Validierung und Editor-Vorschau.
 */
describe('FlowEngineService', () => {
  let service: FlowEngineService;

  beforeEach(() => {
    service = new FlowEngineService();
  });

  it('applies $event and $context mappings on transition', () => {
    const flow: FlowDefinition = {
      id: 'f',
      name: 'flow',
      entryNodeId: 'start',
      nodes: [
        {
          id: 'start',
          componentId: 'ward-list',
          inputBindings: {},
          children: [],
          transitions: [{ onOutput: 'wardSelected', targetNodeId: 'next', contextMapping: { wardId: '$event.wardId' } }]
        },
        {
          id: 'next',
          componentId: 'patient-list',
          inputBindings: {},
          children: [],
          transitions: [{ onOutput: 'patientSelected', targetNodeId: 'end', contextMapping: { copiedWard: '$context.wardId', patientId: '$event.patientId' } }]
        },
        {
          id: 'end',
          componentId: 'patient-view',
          inputBindings: {},
          children: [],
          transitions: []
        }
      ]
    };

    service.initialize(flow);
    service.transition('wardSelected', { wardId: 'ward-a' });
    // Der Kontext des vorherigen Schritts muss für nachfolgende Transitionen erhalten bleiben.
    service.transition('patientSelected', { patientId: 'p-1' });

    let context!: Record<string, unknown>;
    service.context$.subscribe((value) => context = value);
    expect(context['wardId']).toBe('ward-a');
    expect(context['copiedWard']).toBe('ward-a');
    expect(context['patientId']).toBe('p-1');
  });

  it('restores node and context on goBack', () => {
    const flow: FlowDefinition = {
      id: 'f',
      name: 'flow',
      entryNodeId: 'start',
      nodes: [
        {
          id: 'start',
          componentId: 'ward-list',
          inputBindings: {},
          children: [],
          transitions: [{ onOutput: 'wardSelected', targetNodeId: 'next', contextMapping: { wardId: '$event.wardId' } }]
        },
        { id: 'next', componentId: 'patient-list', inputBindings: {}, children: [], transitions: [] }
      ]
    };

    service.initialize(flow);
    service.transition('wardSelected', { wardId: 'ward-a' });
    service.goBack();

    const nodeIds: Array<string | null> = [];
    let context!: Record<string, unknown>;
    service.currentNode$.subscribe((node) => nodeIds.push(node?.id ?? null));
    service.context$.subscribe((value) => context = value);

    expect(nodeIds[nodeIds.length - 1]).toBe('start');
    expect(context['wardId']).toBeUndefined();
  });

  it('supports transitions emitted by a persistent sidebar node', () => {
    const flow: FlowDefinition = {
      id: 'f',
      name: 'flow',
      entryNodeId: 'wards',
      sidebar: {
        nodeId: 'wards',
        position: 'LEFT',
        width: 280
      },
      nodes: [
        {
          id: 'wards',
          componentId: 'ward-list',
          inputBindings: {},
          children: [],
          transitions: [{ onOutput: 'wardSelected', targetNodeId: 'patients', contextMapping: { wardId: '$event.wardId' } }]
        },
        {
          id: 'patients',
          componentId: 'patient-list',
          inputBindings: {},
          children: [],
          transitions: []
        }
      ]
    };

    service.initialize(flow);
    service.transitionFrom('wards', 'wardSelected', { wardId: 'ward-a' });
    // Die Sidebar darf beim Nachladen des Hauptknotens denselben persistenten Kontext behalten.
    service.transitionFrom('wards', 'wardSelected', { wardId: 'ward-b' });

    let nodeId: string | undefined;
    let sidebarNodeId: string | undefined;
    let context!: Record<string, unknown>;
    service.currentNode$.subscribe((node) => nodeId = node?.id);
    service.sidebarNode$.subscribe((node) => sidebarNodeId = node?.id);
    service.context$.subscribe((value) => context = value);

    expect(nodeId).toBe('patients');
    expect(sidebarNodeId).toBe('wards');
    expect(context['wardId']).toBe('ward-b');
  });
});
