import { FlowEngineService } from './flow-engine.service';
import { FlowDefinition } from '../models';

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
});
