import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, throwError } from 'rxjs';
import { FlowApiService, FlowEngineService } from 'flow-platform';
import { RuntimePageComponent } from './runtime-page.component';

/** Mockt den API-Zugriff auf den effektiven Flow und erzwingt den Fehlerpfad der Seite. */
class ApiServiceMock {
  getEffectiveFlow() {
    return throwError(() => new Error('boom'));
  }
}

/** Einfacher Engine-Doppelzustand, damit die Seite ohne echte Navigation instanziierbar bleibt. */
class FlowEngineServiceMock {
  currentNode$ = new BehaviorSubject(null);
  sidebarNode$ = new BehaviorSubject(null);
  sidebar$ = new BehaviorSubject(null);
  context$ = new BehaviorSubject<Record<string, unknown>>({});
  initialize() {}
  goBack() {}
  canGoBack() { return false; }
}

/**
 * Schützt die Runtime-Seite als Integrationspunkt für geladene Flows.
 * Die Suite stellt sicher, dass Ladefehler sauber in einen Benutzerfehler übersetzt werden,
 * ohne die Laufzeitmaschine der Plattform zu beeinflussen.
 */
describe('RuntimePageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RuntimePageComponent],
      providers: [
        { provide: FlowApiService, useClass: ApiServiceMock },
        { provide: FlowEngineService, useClass: FlowEngineServiceMock }
      ]
    }).compileComponents();
  });

  it('sets an error message when effective flow loading fails', () => {
    const fixture = TestBed.createComponent(RuntimePageComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.error).toBe('Flow konnte nicht geladen werden.');
  });
});
