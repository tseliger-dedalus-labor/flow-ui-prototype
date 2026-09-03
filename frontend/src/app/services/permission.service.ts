import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private readonly grantedPermissions = new Set(['APPOINTMENTS_READ']);

  hasAll(requiredPermissions: string[]): boolean {
    return requiredPermissions.every((permission) => this.grantedPermissions.has(permission));
  }
}
