import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FlowEngineService } from '../../flow-engine.service';
import { FlowNode, FlowSidebar } from '../../models';
import { FlowLayoutComponent } from './flow-layout.component';

/**
 * Schützt die Layout-Entscheidung zwischen Hauptknoten und Sidebar.
 * Die Suite stellt sicher, dass die Runtime keine doppelten Knoten rendert und die Sidebar-
 * Position samt Breite als Architekturvertrag erhalten bleibt.
 */
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
  const patientSidebar: FlowNode = {
    id: 'patient-sidebar',
    componentId: 'patient-list-sidebar',
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
    // Sidebar-Position, Breite und Label müssen für die Navigations-UX stabil bleiben.
    expect(layout.classes['flow-layout-right']).toBeTrue();
    expect((layout.nativeElement as HTMLElement).style.getPropertyValue('--flow-sidebar-width')).toBe('320px');
    expect(aside.attributes['aria-label']).toBe('Stationen');
    expect(fixture.debugElement.queryAll(By.css('app-flow-renderer')).length).toBe(2);
  });

  it('renders all sidebar panels and expands the panel associated with the active node', () => {
    component.node = patients;
    component.sidebarMode = 'COLLAPSE';
    component.sidebarPanels = [
      { node: wards, sidebar },
      {
        node: patientSidebar,
        sidebar: { nodeId: 'patient-sidebar', position: 'RIGHT', width: 320, ariaLabel: 'Patienten' }
      }
    ];
    component.ngOnChanges();
    fixture.detectChanges();

    const toggles = fixture.debugElement.queryAll(By.css('.sidebar-panel-toggle'));
    expect(toggles.map((toggle) => toggle.nativeElement.textContent.trim())).toEqual(['Stationen', 'Patienten']);
    expect(toggles[0].attributes['aria-expanded']).toBe('true');

    toggles[1].triggerEventHandler('click');
    fixture.detectChanges();

    expect(component.expandedSidebarNodeId).toBe('patient-sidebar');
    expect(fixture.debugElement.query(By.css('#sidebar-panel-patient-sidebar'))).not.toBeNull();
  });
});
