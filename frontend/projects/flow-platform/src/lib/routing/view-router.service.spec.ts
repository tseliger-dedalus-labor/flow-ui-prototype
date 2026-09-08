import { DefaultUrlSerializer, NavigationEnd, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { FlowApiService } from '../flow-api.service';
import { ViewRouterService } from './view-router.service';

class RouterMock {
  readonly events = new Subject<NavigationEnd>();
  readonly serializer = new DefaultUrlSerializer();
  url = '/runtime';

  parseUrl(url: string) {
    return this.serializer.parse(url);
  }

  navigateByUrl(tree: ReturnType<DefaultUrlSerializer['parse']>): Promise<boolean> {
    this.url = this.serializer.serialize(tree);
    this.events.next(new NavigationEnd(1, this.url, this.url));
    return Promise.resolve(true);
  }
}

describe('ViewRouterService', () => {
  it('combines independent module states in one restorable URL', () => {
    const router = new RouterMock();
    const service = new ViewRouterService(router as unknown as Router, null);

    service.write('tool-runtime', { flowId: 'flow-normal' });
    service.write('flow-tabs:patient-tabs', { activeKey: 'order:F-1:R-1' });

    const restored = new ViewRouterService(router as unknown as Router, null);
    expect(restored.read('tool-runtime')).toEqual({ flowId: 'flow-normal' });
    expect(restored.read('flow-tabs:patient-tabs')).toEqual({ activeKey: 'order:F-1:R-1' });
  });

  it('uses a shorter Base64URL representation than URI-encoded JSON', () => {
    const router = new RouterMock();
    const service = new ViewRouterService(router as unknown as Router, null);
    const scopes = {
      'tool-runtime': {
        flowId: 'flow-normal',
        engine: {
          currentNodeId: 'patient-details',
          context: { patientId: 'patient-123', caseId: 'case-456' },
          history: [{ nodeId: 'patient-list', context: { wardId: 'ward-1' } }]
        }
      }
    };

    service.write('tool-runtime', scopes['tool-runtime']);

    const legacyUrl = `/runtime?view=${encodeURIComponent(JSON.stringify({
      version: 1,
      path: '/runtime',
      scopes
    }))}`;
    expect(router.url.length).toBeLessThan(legacyUrl.length);
    expect(router.url).not.toContain('%22');
  });

  it('continues to read previously generated JSON links', () => {
    const router = new RouterMock();
    const legacyState = {
      version: 1,
      path: '/runtime',
      scopes: { 'tool-runtime': { flowId: 'flow-normal' } }
    };
    router.url = `/runtime?view=${encodeURIComponent(JSON.stringify(legacyState))}`;

    const service = new ViewRouterService(router as unknown as Router, null);

    expect(service.read('tool-runtime')).toEqual({ flowId: 'flow-normal' });
  });

  it('does not restore state from another module route', () => {
    const router = new RouterMock();
    const service = new ViewRouterService(router as unknown as Router, null);
    service.write('tool-runtime', { flowId: 'flow-normal' });

    router.url = router.url.replace('/runtime', '/appointments');
    const restored = new ViewRouterService(router as unknown as Router, null);

    expect(restored.read('tool-runtime')).toBeUndefined();
  });

  it('stores runtime and component state in one signed portable token', async () => {
    const router = new RouterMock();
    const payload = {
      schemaVersion: 1,
      flowId: 'flow-normal',
      path: '/runtime'
    };
    const encoded = btoa(JSON.stringify(payload)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
    const api = jasmine.createSpyObj<FlowApiService>('api', ['createFlowLink']);
    api.createFlowLink.and.returnValue(of({ token: `${encoded}.encrypted.signature` }));
    const service = new ViewRouterService(router as unknown as Router, api);

    await service.write('tool-runtime', {
      flowId: 'flow-normal',
      executionId: 'run-1',
      resumeToken: 'base.signature'
    });
    await service.write('component', { selectedId: 'record-1' });

    expect(api.createFlowLink).toHaveBeenCalledWith(
      'run-1',
      '/runtime',
      { component: { selectedId: 'record-1' } }
    );
    expect(api.createFlowLink).toHaveBeenCalledTimes(2);
    const restored = new ViewRouterService(router as unknown as Router, null);
    restored.applyVerifiedScopes({ component: { selectedId: 'record-1' } });
    expect(restored.read('tool-runtime')).toEqual({
      flowId: 'flow-normal',
      resumeToken: `${encoded}.encrypted.signature`
    });
    expect(restored.read('component')).toEqual({ selectedId: 'record-1' });
  });

  it('uses a regular route state when portable links are unavailable', async () => {
    const router = new RouterMock();
    const api = jasmine.createSpyObj<FlowApiService>('api', ['createFlowLink']);
    const service = new ViewRouterService(router as unknown as Router, api);

    await service.write('tool-runtime', {
      flowId: 'flow-normal',
      executionId: 'run-1',
      resumeToken: ''
    });
    await service.write('component', { selectedId: 'record-1' });

    expect(api.createFlowLink).not.toHaveBeenCalled();
    const restored = new ViewRouterService(router as unknown as Router, null);
    expect(restored.read('tool-runtime')).toEqual({
      flowId: 'flow-normal',
      executionId: 'run-1',
      resumeToken: ''
    });
    expect(restored.read('component')).toEqual({ selectedId: 'record-1' });
  });

  it('does not apply a delayed signed state after navigating to another route', async () => {
    const router = new RouterMock();
    const response = new Subject<{ token: string }>();
    const api = jasmine.createSpyObj<FlowApiService>('api', ['createFlowLink']);
    api.createFlowLink.and.returnValue(response);
    const service = new ViewRouterService(router as unknown as Router, api);
    const pending = service.write('tool-runtime', {
      flowId: 'flow-normal',
      executionId: 'run-1',
      resumeToken: 'base.signature'
    });

    router.url = '/reportcenter';
    router.events.next(new NavigationEnd(2, router.url, router.url));
    response.next({ token: 'stale.encrypted.signature' });
    response.complete();
    await pending;

    expect(router.url).toBe('/reportcenter');
  });
});
