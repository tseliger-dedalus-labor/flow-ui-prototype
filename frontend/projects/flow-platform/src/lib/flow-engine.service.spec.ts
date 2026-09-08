import { FlowEngineService } from './flow-engine.service';
import { IxtDisplayType } from './ixt-display-type';
import { FlowDefinition, FlowNode } from './models';
import { PrtType } from './prt-type';

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
      tool: 'WebclientTool',
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
          transitions: [{
            onOutput: 'patientSelected',
            targetNodeId: 'end',
            contextMapping: {
              copiedWard: '$context.wardId',
              patientId: '$event.patientId',
              caseId: '$event.caseId'
            }
          }]
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
    service.transition('patientSelected', { patientId: 'p-1', caseId: 'F-1' });

    let context!: Record<string, unknown>;
    service.context$.subscribe((value) => context = value);
    expect(context['wardId']).toBe('ward-a');
    expect(context['copiedWard']).toBe('ward-a');
    expect(context['patientId']).toBe('p-1');
    expect(context['caseId']).toBe('F-1');
  });

  it('restores node and context on goBack', () => {
    const flow: FlowDefinition = {
      id: 'f',
      name: 'flow',
      tool: 'WebclientTool',
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
      tool: 'WebclientTool',
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

  it('switches the sidebar with the active main node and restores it on back', () => {
    const flow: FlowDefinition = {
      id: 'f',
      name: 'flow',
      tool: 'WebclientTool',
      entryNodeId: 'wards',
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
          sidebar: { nodeId: 'wards', position: 'LEFT', width: 280 },
          transitions: [{ onOutput: 'patientSelected', targetNodeId: 'detail', contextMapping: { patientId: '$event.patientId' } }]
        },
        {
          id: 'detail',
          componentId: 'patient-view',
          inputBindings: {},
          children: [],
          sidebar: { nodeId: 'patients', position: 'LEFT', width: 320 },
          transitions: []
        }
      ]
    };

    service.initialize(flow);
    service.transition('wardSelected', { wardId: 'ward-a' });

    let sidebarNodeId: string | undefined;
    service.sidebarNode$.subscribe((node) => sidebarNodeId = node?.id);
    expect(sidebarNodeId).toBe('wards');

    service.transition('patientSelected', { patientId: 'p-1' });
    expect(sidebarNodeId).toBe('patients');

    service.goBack();
    expect(sidebarNodeId).toBe('wards');
  });

  it('exposes every configured sidebar panel in collapse mode', () => {
    const flow: FlowDefinition = {
      id: 'f',
      name: 'flow',
      tool: 'WebclientTool',
      entryNodeId: 'patients',
      sidebarMode: 'COLLAPSE',
      nodes: [
        {
          id: 'patients',
          componentId: 'patient-list',
          inputBindings: {},
          children: [],
          sidebar: { nodeId: 'wards-sidebar', position: 'LEFT', width: 280, ariaLabel: 'Stationen' },
          transitions: []
        },
        {
          id: 'detail',
          componentId: 'patient-view',
          inputBindings: {},
          children: [],
          sidebar: { nodeId: 'patients-sidebar', position: 'LEFT', width: 280, ariaLabel: 'Patienten' },
          transitions: []
        },
        { id: 'wards-sidebar', componentId: 'ward-list', inputBindings: {}, children: [], transitions: [] },
        { id: 'patients-sidebar', componentId: 'patient-list-sidebar', inputBindings: {}, children: [], transitions: [] }
      ]
    };

    let panelIds: string[] = [];
    let mode = '';
    service.sidebarPanels$.subscribe((panels) => panelIds = panels.map((panel) => panel.node.id));
    service.sidebarMode$.subscribe((value) => mode = value);

    service.initialize(flow);

    expect(mode).toBe('COLLAPSE');
    expect(panelIds).toEqual(['wards-sidebar', 'patients-sidebar']);
  });

  it('keeps the sidebar completely absent when neither flow nor node configures one', () => {
    const flow: FlowDefinition = {
      id: 'f',
      name: 'flow',
      tool: 'WebclientTool',
      entryNodeId: 'only',
      nodes: [
        {
          id: 'only',
          componentId: 'patient-view',
          inputBindings: {},
          children: [],
          transitions: []
        }
      ]
    };

    service.initialize(flow);

    let sidebarNode: FlowNode | null | undefined;
    let sidebar: FlowDefinition['sidebar'] | null | undefined;
    service.sidebarNode$.subscribe((value) => sidebarNode = value);
    service.sidebar$.subscribe((value) => sidebar = value);

    expect(sidebarNode).toBeNull();
    expect(sidebar).toBeNull();
  });

  it('restores the active node, context and back history from a routed state', () => {
    const flow: FlowDefinition = {
      id: 'f',
      name: 'flow',
      tool: 'WebclientTool',
      entryNodeId: 'start',
      nodes: [
        {
          id: 'start',
          componentId: 'ward-list',
          inputBindings: {},
          children: [],
          transitions: []
        },
        {
          id: 'detail',
          componentId: 'patient-view',
          inputBindings: {},
          children: [],
          transitions: []
        }
      ]
    };

    service.initialize(flow, {
      currentNodeId: 'detail',
      context: { patientId: 'p-1', caseId: 'F-1' },
      history: [{ nodeId: 'start', context: { wardId: 'ward-a' } }]
    });

    expect(service.snapshot()).toEqual({
      currentNodeId: 'detail',
      context: { patientId: 'p-1', caseId: 'F-1' },
      history: [{ nodeId: 'start', context: { wardId: 'ward-a' } }]
    });
    expect(service.canGoBack()).toBeTrue();

    service.goBack();

    expect(service.snapshot()).toEqual({
      currentNodeId: 'start',
      context: { wardId: 'ward-a' },
      history: []
    });
  });

  it('routes a record to the node registered for its mapped display type', () => {
      const flow: FlowDefinition = {
        id: 'records',
        name: 'Records',
        tool: 'ReportcenterTool',
        entryNodeId: 'records',
        nodes: [
          {
            id: 'records',
            componentId: 'reportcenter',
            inputBindings: {},
            children: [],
            transitions: [{
              onOutput: 'recordSelected',
              targetNodeId: 'order',
              contextMapping: { RecordId: '$event.RecordID' },
              prtTypeDisplayTypes: {
                [PrtType.PRTTYPE_ORDER]: IxtDisplayType.DISPTYPE_FORM,
                [PrtType.PRTTYPE_REPORT]: IxtDisplayType.DISPTYPE_REPORT
              }
            }]
          },
          { id: 'order', componentId: 'orders-panel', inputBindings: {}, children: [], transitions: [] },
          { id: 'finding', componentId: 'findings-panel', inputBindings: {}, children: [], transitions: [] }
        ]
      };
      service.registerDisplayTypes([
        { componentId: 'orders-panel', displayType: IxtDisplayType.DISPTYPE_FORM },
        { componentId: 'findings-panel', displayType: IxtDisplayType.DISPTYPE_REPORT }
      ]);
      service.initialize(flow);

      service.transition('recordSelected', {
        RecordID: 'FND-1',
        prtType: PrtType.PRTTYPE_REPORT
      });

      expect(service.snapshot()?.currentNodeId).toBe('finding');
      expect(service.snapshot()?.context['RecordId']).toBe('FND-1');
  });
});
