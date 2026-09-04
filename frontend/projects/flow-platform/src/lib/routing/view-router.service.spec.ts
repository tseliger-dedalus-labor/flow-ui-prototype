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

  it('does not restore state from another module route', () => {
    const router = new RouterMock();
    const service = new ViewRouterService(router as unknown as Router);
    service.write('tool-runtime', { flowId: 'flow-normal' });

    router.url = router.url.replace('/runtime', '/appointments');
    const restored = new ViewRouterService(router as unknown as Router);

    expect(restored.read('tool-runtime')).toBeUndefined();
  });
});
