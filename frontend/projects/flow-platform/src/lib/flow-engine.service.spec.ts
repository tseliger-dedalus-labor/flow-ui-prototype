import { of } from 'rxjs';
import { FlowApiService } from './flow-api.service';
import { FlowEngineService } from './flow-engine.service';
import { FlowDefinition, FlowExecutionView } from './models';

describe('FlowEngineService', () => {
  const flow: FlowDefinition = {
    id: 'flow',
    name: 'Flow',
    tool: 'WebclientTool',
    entryNodeId: 'start',
    nodes: [
      {
        id: 'start',
        componentId: 'ward-list',
        inputBindings: {},
        children: [],
        transitions: [{ onOutput: 'selected', targetNodeId: 'detail', contextMapping: {} }]
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

  function view(currentNodeId: string, version: number, canGoBack = false): FlowExecutionView {
    return {
      executionId: 'run-1',
      flowId: flow.id,
      version,
      definition: flow,
      currentNodeId,
      context: currentNodeId === 'detail' ? { patientId: 'p-1' } : {},
      resolvedInputsByNode: currentNodeId === 'detail'
        ? { detail: { patientId: 'p-1' } }
        : {},
      canGoBack
    };
  }

  it('uses the server response as the authoritative transition state', () => {
    const api = jasmine.createSpyObj<FlowApiService>('api', ['startExecution', 'transition', 'back', 'getExecution']);
    api.startExecution.and.returnValue(of(view('start', 0)));
    api.transition.and.returnValue(of(view('detail', 1, true)));
    const service = new FlowEngineService(api);

    service.start('flow').subscribe();
    service.transition('selected', { patientId: 'client-value' });

    let nodeId: string | undefined;
    let context: Record<string, unknown> = {};
    service.currentNode$.subscribe((node) => nodeId = node?.id);
    service.context$.subscribe((value) => context = value);
    expect(api.transition).toHaveBeenCalledWith('run-1', 0, 'start', 'selected', { patientId: 'client-value' });
    expect(nodeId).toBe('detail');
    expect(context).toEqual({ patientId: 'p-1' });
    expect(service.inputsFor('detail')).toEqual({ patientId: 'p-1' });
    expect(service.canGoBack()).toBeTrue();
  });

  it('restores an execution by opaque identifier and keeps only identity in routed state', () => {
    const api = jasmine.createSpyObj<FlowApiService>('api', ['startExecution', 'transition', 'back', 'getExecution']);
    api.getExecution.and.returnValue(of(view('detail', 3, true)));
    const service = new FlowEngineService(api);

    service.restore('run-1').subscribe();

    expect(service.snapshot()).toEqual({ flowId: 'flow', executionId: 'run-1' });
    expect(FlowEngineService.isState(service.snapshot())).toBeTrue();
    expect(FlowEngineService.isState({ flowId: 'flow', context: {} })).toBeFalse();
  });

  it('delegates back navigation with optimistic versioning', () => {
    const api = jasmine.createSpyObj<FlowApiService>('api', ['startExecution', 'transition', 'back', 'getExecution']);
    api.getExecution.and.returnValue(of(view('detail', 3, true)));
    api.back.and.returnValue(of(view('start', 4)));
    const service = new FlowEngineService(api);
    service.restore('run-1').subscribe();

    service.goBack();

    expect(api.back).toHaveBeenCalledOnceWith('run-1', 3);
    expect(service.canGoBack()).toBeFalse();
  });
});
