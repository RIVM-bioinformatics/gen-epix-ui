import {
  type User,
  type ApiPermission,
  Role,
} from '../../../api';
import type { MyNonIndexRouteObject } from '../../../models/reactRouter';
import { PageEventBusManager } from '../PageEventBusManager';

export class AuthorizationManager {
  private __user: User;
  private __apiPermissions: ApiPermission[] = [];
  private static __instance: AuthorizationManager;

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
    AuthorizationManager.__instance = AuthorizationManager.__instance || new AuthorizationManager();
    return AuthorizationManager.__instance;
  }

  public doesUserHavePermissionForRoute(route: MyNonIndexRouteObject, orAnyOfItsSubRoutes?: boolean): boolean {
    if (route.handle.requirePermissionForChildRoute) {
      return route.children?.filter(r => !r.index)?.some((childRoute) => this.doesUserHavePermissionForRoute(childRoute as MyNonIndexRouteObject, orAnyOfItsSubRoutes));
    }
    const indexRoute = route.children?.find((childRoute) => childRoute.index);
    if (!route.handle.requiredPermissions?.length && !indexRoute) {
      return true;
    }
    const hasPermissionForRoute = this.doesUserHavePermission(indexRoute ? indexRoute.handle.requiredPermissions : route.handle.requiredPermissions);
    if (hasPermissionForRoute) {
      return true;
    }
    if (!hasPermissionForRoute && (!orAnyOfItsSubRoutes || !route.children?.length)) {
      return false;
    }
    return route.children?.some((childRoute) => this.doesUserHavePermissionForRoute(childRoute as MyNonIndexRouteObject, orAnyOfItsSubRoutes));
  }

  public hasRole(role: Role): boolean {
    return this.user.roles.includes(role);
  }

  public isRoot(): boolean {
    return this.user.roles.includes(Role.ROOT);
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
