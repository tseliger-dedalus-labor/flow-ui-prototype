import { Injectable } from '@angular/core';

/**
 * Einfache Mock-Berechtigungsprüfung für Runtime-Komponenten.
 */
@Injectable({ providedIn: 'root' })
export class PermissionService {
  // Die Demo hält Berechtigungen lokal, damit Widgets ohne Backend-Session gerendert werden können.
  private readonly grantedPermissions = new Set(['APPOINTMENTS_READ', 'APPOINTMENTS_WRITE']);

  /**
   * Prüft, ob alle angeforderten Berechtigungen aktuell vorliegen.
   */
  hasAll(requiredPermissions: string[]): boolean {
    return requiredPermissions.every((permission) => this.grantedPermissions.has(permission));
  }
}
