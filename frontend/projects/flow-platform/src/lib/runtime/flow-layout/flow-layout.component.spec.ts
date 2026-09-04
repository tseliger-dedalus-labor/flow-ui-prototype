import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FlowEngineService } from '../../flow-engine.service';
import { FlowNode, FlowSidebar } from '../../models';
import { FlowLayoutComponent } from './flow-layout.component';

describe('FlowLayoutComponent', () => {
  let fixture: ComponentFixture<FlowLayoutComponent>;
  let component: FlowLayoutComponent;
  const wards: FlowNode = {
    id: 'wards',
    componentId: 'ward-list',
    inputBindings: {},
    children: [],
    transitions: []
  };
  const patients: FlowNode = {
    id: 'patients',
    componentId: 'patient-list',
    inputBindings: {},
    children: [],
    transitions: []
  };
  const sidebar: FlowSidebar = {
    nodeId: 'wards',
    position: 'RIGHT',
    width: 320,
    ariaLabel: 'Stationen'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FlowLayoutComponent],
      providers: [FlowEngineService]
    }).compileComponents();

    fixture = TestBed.createComponent(FlowLayoutComponent);
    component = fixture.componentInstance;
    component.sidebarNode = wards;
    component.sidebar = sidebar;
  });

  it('renders the configured node as main content without duplicating it in the sidebar', () => {
    component.node = wards;
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.flow-layout'))).toBeNull();
    expect(fixture.debugElement.queryAll(By.css('app-flow-renderer')).length).toBe(1);
  });

  it('renders a configured sidebar next to a different main node', () => {
    component.node = patients;
    fixture.detectChanges();

    const layout = fixture.debugElement.query(By.css('.flow-layout'));
    const aside = fixture.debugElement.query(By.css('aside'));
    expect(layout.classes['flow-layout-right']).toBeTrue();
    expect((layout.nativeElement as HTMLElement).style.getPropertyValue('--flow-sidebar-width')).toBe('320px');
    expect(aside.attributes['aria-label']).toBe('Stationen');
    expect(fixture.debugElement.queryAll(By.css('app-flow-renderer')).length).toBe(2);
  });
});
