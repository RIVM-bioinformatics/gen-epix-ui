import type {
  CompleteUser,
  Permission,
} from '../../../api';
import type { MyNonIndexRouteObject } from '../../../models/reactRouter';
import { PageEventBusManager } from '../PageEventBusManager';

export class AuthorizationManager {
  private __user: CompleteUser;
  private static __instance: AuthorizationManager;

  private constructor() {
    //
  }

  public set user(user: CompleteUser) {
    PageEventBusManager.instance.emit('changeUser', user);
    this.__user = user;
  }

  public get user(): CompleteUser {
    return this.__user;
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

  public doesUserHavePermission(permissions: Permission[]): boolean {
    if (!permissions?.length) {
      return true;
    }
    if (!this.user?.permissions?.length) {
      return false;
    }
    return permissions.every(permission => {
      return !!(this.user.permissions).find(({ command_name, permission_type }) => {
        return command_name === permission.command_name && permission_type === permission.permission_type;
      });
    });
  }
}
