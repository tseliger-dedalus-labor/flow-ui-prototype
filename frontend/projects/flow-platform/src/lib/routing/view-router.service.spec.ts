import { DefaultUrlSerializer, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { ViewRouterService } from './view-router.service';

class RouterMock {
  readonly events = new Subject<never>();
  readonly serializer = new DefaultUrlSerializer();
  url = '/runtime';

  parseUrl(url: string) {
    return this.serializer.parse(url);
  }

  navigateByUrl(tree: ReturnType<DefaultUrlSerializer['parse']>): Promise<boolean> {
    this.url = this.serializer.serialize(tree);
    return Promise.resolve(true);
  }
}

describe('ViewRouterService', () => {
  it('combines independent module states in one restorable URL', () => {
    const router = new RouterMock();
    const service = new ViewRouterService(router as unknown as Router);

    service.write('tool-runtime', { flowId: 'flow-normal' });
    service.write('flow-tabs:patient-tabs', { activeKey: 'order:F-1:R-1' });

    const restored = new ViewRouterService(router as unknown as Router);
    expect(restored.read('tool-runtime')).toEqual({ flowId: 'flow-normal' });
    expect(restored.read('flow-tabs:patient-tabs')).toEqual({ activeKey: 'order:F-1:R-1' });
  });

  it('uses a shorter Base64URL representation than URI-encoded JSON', () => {
    const router = new RouterMock();
    const service = new ViewRouterService(router as unknown as Router);
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

    const service = new ViewRouterService(router as unknown as Router);

    expect(service.read('tool-runtime')).toEqual({ flowId: 'flow-normal' });
  });

  it('does not restore state from another module route', () => {
    const router = new RouterMock();
    const service = new ViewRouterService(router as unknown as Router);
    service.write('tool-runtime', { flowId: 'flow-normal' });

    router.url = router.url.replace('/runtime', '/appointments');
    const restored = new ViewRouterService(router as unknown as Router);

    expect(restored.read('tool-runtime')).toBeUndefined();
  });
});
