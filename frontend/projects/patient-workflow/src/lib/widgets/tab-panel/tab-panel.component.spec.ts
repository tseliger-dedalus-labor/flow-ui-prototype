import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FLOW_WIDGET, FlowEngineService, FlowNode, FlowTabService, ViewRouterService } from 'flow-platform';
import { TabPanelComponent } from './tab-panel.component';

@Component({
  selector: 'app-test-orders',
  template: '<button class="open-order" type="button" (click)="openOrder()">Aufträge-Inhalt</button>'
})
class TestOrdersComponent {
  constructor(private readonly tabs: FlowTabService) {}

  openOrder(): void {
    this.tabs.open(dynamicOrder('R-child'));
  }
}

@Component({ selector: 'app-test-transfusions', template: 'Transfusionen-Inhalt' })
class TestTransfusionsComponent {}

@Component({ selector: 'app-test-order', template: 'Auftrag-Inhalt' })
class TestOrderComponent {}

class ViewRouterServiceMock {
  state: unknown;
  readonly writes: Array<{ scope: string; state: unknown }> = [];

  read() { return this.state; }
  write(scope: string, state: unknown) { this.writes.push({ scope, state }); }
}

/**
 * Schützt die tabweise Darstellung zugewiesener Flow-Komponenten.
 */
describe('TabPanelComponent', () => {
  let fixture: ComponentFixture<TabPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TabPanelComponent],
      providers: [
        FlowEngineService,
        { provide: ViewRouterService, useClass: ViewRouterServiceMock },
        {
          provide: FLOW_WIDGET,
          useValue: {
            componentId: 'orders-panel',
            descriptor: { title: 'Aufträge' },
            component: TestOrdersComponent
          },
          multi: true
        },
        {
          provide: FLOW_WIDGET,
          useValue: {
            componentId: 'transfusions-panel',
            descriptor: { title: 'Transfusionen' },
            component: TestTransfusionsComponent
          },
          multi: true
        },
        {
          provide: FLOW_WIDGET,
          useValue: {
            componentId: 'order-view',
            descriptor: { title: 'Auftrag' },
            component: TestOrderComponent
          },
          multi: true
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TabPanelComponent);
    fixture.componentInstance.flowChildren = [
      child('orders', 'orders-panel'),
      child('transfusions', 'transfusions-panel')
    ];
    fixture.detectChanges();
  });

  it('creates one tab per assigned component and renders only the active component', () => {
    const tabs = fixture.debugElement.queryAll(By.css('[role="tab"]'));
    expect(tabs.map((tab) => tab.nativeElement.textContent.trim()))
      .toEqual(['Aufträge', 'Transfusionen']);
    expect(fixture.nativeElement.textContent).toContain('Aufträge-Inhalt');
    expect(fixture.nativeElement.textContent).not.toContain('Transfusionen-Inhalt');

    tabs[1].nativeElement.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Aufträge-Inhalt');
    expect(fixture.nativeElement.textContent).toContain('Transfusionen-Inhalt');
  });

  it('opens multiple closable order tabs in the same tab panel', () => {
    const tabs = fixture.debugElement.injector.get(FlowTabService);
    tabs.open(dynamicOrder('R-1'));
    tabs.open(dynamicOrder('R-2'));
    fixture.detectChanges();

    const tabButtons = fixture.debugElement.queryAll(By.css('[role="tab"]'));
    expect(tabButtons.map((tab) => tab.nativeElement.textContent.trim()))
      .toEqual(['Aufträge', 'Transfusionen', 'Auftrag R-1', 'Auftrag R-2']);
    expect(fixture.nativeElement.textContent).toContain('Auftrag-Inhalt');

    fixture.debugElement.queryAll(By.css('.close-tab'))[1].nativeElement.click();
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.css('[role="tab"]')).length).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('Auftrag-Inhalt');
  });

  it('opens a child request beside the static tabs of the same tab panel', () => {
    fixture.debugElement.query(By.css('.open-order')).nativeElement.click();
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.css('[role="tab"]'))
      .map((tab) => tab.nativeElement.textContent.trim()))
      .toEqual(['Aufträge', 'Transfusionen', 'Auftrag R-child']);
    expect(fixture.nativeElement.textContent).toContain('Auftrag-Inhalt');
  });

  it('restores dynamic tabs and the active tab from the linked view state', () => {
    const viewRouter = TestBed.inject(ViewRouterService) as unknown as ViewRouterServiceMock;
    viewRouter.state = {
      activeKey: 'order:F-1:R-linked',
      dynamicTabs: [dynamicOrder('R-linked')]
    };
    fixture.componentInstance.flowContainerId = 'patient-tabs';
    fixture.detectChanges();

    expect(fixture.debugElement.queryAll(By.css('[role="tab"]'))
      .map((tab) => tab.nativeElement.textContent.trim()))
      .toEqual(['Aufträge', 'Transfusionen', 'Auftrag R-linked']);
    expect(fixture.componentInstance.activeKey).toBe('order:F-1:R-linked');
    expect(fixture.nativeElement.textContent).toContain('Auftrag-Inhalt');
  });
});

function child(id: string, componentId: string): FlowNode {
  return {
    id,
    componentId,
    inputBindings: {},
    children: [],
    transitions: []
  };
}

function dynamicOrder(RecordId: string) {
  return {
    key: `order:F-1:${RecordId}`,
    title: `Auftrag ${RecordId}`,
    node: child(`order-${RecordId}`, 'order-view')
  };
}
