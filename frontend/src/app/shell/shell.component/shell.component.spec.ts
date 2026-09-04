import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ShellComponent } from './shell.component';

/**
 * Schützt die Navigationshülle der Anwendung.
 * Die Suite stellt sicher, dass die Architektur ihre Feature-Einstiege in der Toolbar
 * sichtbar und korrekt verlinkt bereitstellt.
 */
describe('ShellComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [provideRouter([])]
    }).compileComponents();
  });

  it('offers both feature modules in its toolbar', () => {
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();

    const links = Array.from(fixture.nativeElement.querySelectorAll('nav a')) as HTMLAnchorElement[];
    expect(links.map((link) => link.textContent?.trim())).toEqual(['Benutzer-UI', 'Stationstermine', 'Editor']);
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/runtime', '/appointments', '/editor']);
  });
});
