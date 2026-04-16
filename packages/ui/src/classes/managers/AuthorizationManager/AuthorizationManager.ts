import type {
  CaseDbApiPermission,
  CaseDbUser,
} from '@gen-epix/api-casedb';

import type { MyNonIndexRouteObject } from '../../../models/reactRouter';
import { PageEventBusManager } from '../PageEventBusManager';
import { WindowManager } from '../WindowManager';

export class AuthorizationManager {
  public static get instance(): AuthorizationManager {
    // Instances are stored on the window to prevent multiple instances of the same manager. HMR may load multiple instances of the same manager, but we only want one instance to be active at a time.

    WindowManager.instance.window.managers.authorization = WindowManager.instance.window.managers.authorization || new AuthorizationManager();
    return WindowManager.instance.window.managers.authorization;
  }
  public set apiPermissions(permissions: CaseDbApiPermission[]) {
    this.__apiPermissions = permissions;
  }

  public get apiPermissions(): CaseDbApiPermission[] {
    return this.__apiPermissions;
  }

  public set user(user: CaseDbUser) {
    PageEventBusManager.instance.emit('changeUser', user);
    this.__user = user;
  }

  public get user(): CaseDbUser {
    return this.__user;
  }

  private __apiPermissions: CaseDbApiPermission[] = [];

  private __user: CaseDbUser;


  private constructor() {
    //
  }

  public doesUserHavePermission(permissions: CaseDbApiPermission[]): boolean {
    if (!permissions?.length) {
      return true;
    }
    if (!this.apiPermissions?.length) {
      return false;
    }
    return permissions.every(permission => {
      return !!(this.apiPermissions).find(({ command_name, permission_type }) => {
        return command_name === permission.command_name && permission_type === permission.permission_type;
      });
    });
  }

  public doesUserHavePermissionForRoute(route: MyNonIndexRouteObject): boolean {
    if (route.handle.requirePermissionForChildRoute) {
      return route.children?.filter(r => !r.index)?.some((childRoute) => this.doesUserHavePermissionForRoute(childRoute as MyNonIndexRouteObject));
    }
    const indexRoute = route.children?.find((childRoute) => childRoute.index);
    if (!route.handle.requiredPermissions?.length && !indexRoute) {
      return true;
    }
    const hasPermissionForRoute = this.doesUserHavePermission(indexRoute ? indexRoute.handle.requiredPermissions : route.handle.requiredPermissions);
    if (hasPermissionForRoute) {
      return true;
    }
    return false;
  }
}
