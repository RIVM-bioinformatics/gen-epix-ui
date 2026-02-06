import {
  type User,
  type ApiPermission,
} from '../../../api';
import type { MyNonIndexRouteObject } from '../../../models/reactRouter';
import { PageEventBusManager } from '../PageEventBusManager';
import { WindowManager } from '../WindowManager';

export class AuthorizationManager {
  private __user: User;
  private __apiPermissions: ApiPermission[] = [];

  private constructor() {
    //
  }

  public set user(user: User) {
    PageEventBusManager.instance.emit('changeUser', user);
    this.__user = user;
  }

  public get user(): User {
    return this.__user;
  }

  public set apiPermissions(permissions: ApiPermission[]) {
    this.__apiPermissions = permissions;
  }

  public get apiPermissions(): ApiPermission[] {
    return this.__apiPermissions;
  }

  public static get instance(): AuthorizationManager {
    WindowManager.instance.window.managers.authorization = WindowManager.instance.window.managers.authorization || new AuthorizationManager();
    return WindowManager.instance.window.managers.authorization;
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

  public doesUserHavePermission(permissions: ApiPermission[]): boolean {
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
}
