import { Injectable, OnDestroy, Optional } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, filter } from 'rxjs';

const VIEW_STATE_QUERY_PARAM = 'view';
const VIEW_STATE_VERSION = 1;

interface RoutedViewState {
  version: number;
  scopes: Record<string, unknown>;
}

interface CompactRoutedViewState {
  v: number;
  p: string;
  s: Record<string, unknown>;
}

interface LegacyRoutedViewState extends RoutedViewState {
  path: string;
}

/**
 * Speichert modulübergreifende UI-Zustände versioniert und kompakt Base64URL-kodiert in der aktuellen URL.
 * Zustände sind an den aktuellen Routenpfad gebunden; ältere JSON-Links bleiben lesbar.
 */
@Injectable({ providedIn: 'root' })
export class ViewRouterService implements OnDestroy {
  private path = '';
  private scopes: Record<string, unknown> = {};
  private readonly routerSubscription?: Subscription;

  constructor(@Optional() private readonly router: Router | null) {
    if (!this.router) {
      return;
    }
    this.hydrate(this.router.url);
    this.routerSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.hydrate(event.urlAfterRedirects));
  }

  /**
   * Liest einen Zustandsbereich der aktuellen Route.
   */
  read(scope: string): unknown {
    this.synchronizeRoute();
    return this.scopes[scope];
  }

  /**
   * Aktualisiert einen Zustandsbereich, ohne für jeden UI-Schritt einen Browser-History-Eintrag anzulegen.
   */
  write(scope: string, state: unknown): void {
    if (!this.router) {
      return;
    }
    this.synchronizeRoute();
    this.scopes = { ...this.scopes, [scope]: state };
    this.updateUrl();
  }

  /**
   * Entfernt alle Zustandsbereiche mit dem angegebenen Präfix.
   */
  clearByPrefix(prefix: string): void {
    if (!this.router) {
      return;
    }
    this.synchronizeRoute();
    const remaining = Object.fromEntries(
      Object.entries(this.scopes).filter(([scope]) => !scope.startsWith(prefix))
    );
    if (Object.keys(remaining).length === Object.keys(this.scopes).length) {
      return;
    }
    this.scopes = remaining;
    this.updateUrl();
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  private synchronizeRoute(): void {
    if (this.router && this.routePath(this.router.url) !== this.path) {
      this.hydrate(this.router.url);
    }
  }

  private hydrate(url: string): void {
    if (!this.router) {
      return;
    }
    this.path = this.routePath(url);
    this.scopes = {};
    const serialized = this.router.parseUrl(url).queryParams[VIEW_STATE_QUERY_PARAM];
    if (typeof serialized !== 'string') {
      return;
    }
    try {
      const parsed = this.decode(serialized);
      if (this.isCompactRoutedViewState(parsed) && parsed.p === this.path) {
        this.scopes = parsed.s;
      } else if (this.isLegacyRoutedViewState(parsed) && parsed.path === this.path) {
        this.scopes = parsed.scopes;
      } else {
        console.warn('Der gespeicherte Ansichtslink ist ungültig oder gehört zu einer anderen Route.');
      }
    } catch (error) {
      console.warn('Der gespeicherte Ansichtslink konnte nicht gelesen werden.', error);
    }
  }

  private updateUrl(): void {
    if (!this.router) {
      return;
    }
    const tree = this.router.parseUrl(this.router.url);
    const state: CompactRoutedViewState = {
      v: VIEW_STATE_VERSION,
      p: this.path,
      s: this.scopes
    };
    tree.queryParams = {
      ...tree.queryParams,
      [VIEW_STATE_QUERY_PARAM]: this.encode(state)
    };
    void this.router.navigateByUrl(tree, { replaceUrl: true }).catch((error) => {
      console.error('Der Ansichtslink konnte nicht aktualisiert werden.', error);
    });
  }

  private routePath(url: string): string {
    return url.split(/[?#]/, 1)[0] || '/';
  }

  private encode(state: CompactRoutedViewState): string {
    const bytes = new TextEncoder().encode(JSON.stringify(state));
    let binary = '';
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary)
      .replaceAll('+', '-')
      .replaceAll('/', '_')
      .replace(/=+$/, '');
  }

  private decode(value: string): unknown {
    if (value.startsWith('{')) {
      return JSON.parse(value);
    }
    const base64 = value
      .replaceAll('-', '+')
      .replaceAll('_', '/')
      .padEnd(Math.ceil(value.length / 4) * 4, '=');
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }

  private isCompactRoutedViewState(value: unknown): value is CompactRoutedViewState {
    if (!isRecord(value)) {
      return false;
    }
    return value['v'] === VIEW_STATE_VERSION
      && typeof value['p'] === 'string'
      && isRecord(value['s']);
  }

  private isLegacyRoutedViewState(value: unknown): value is LegacyRoutedViewState {
    if (!isRecord(value)) {
      return false;
    }
    return value['version'] === VIEW_STATE_VERSION
      && typeof value['path'] === 'string'
      && isRecord(value['scopes']);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
