import type {
  CommonDbApiPermission,
  CommonDbUser,
} from '@gen-epix/api-commondb';

import type { MyNonIndexRouteObject } from '../../../models/reactRouter';
import { HmrUtil } from '../../../utils/HmrUtil';
import { PageEventBusManager } from '../PageEventBusManager';

export class AuthorizationManager {
  public static get instance(): AuthorizationManager {
    AuthorizationManager.__instance = HmrUtil.getHmrSingleton('authorizationManager', AuthorizationManager.__instance, () => new AuthorizationManager());
    return AuthorizationManager.__instance;
  }

  private static __instance: AuthorizationManager;

  public set apiPermissions(permissions: CommonDbApiPermission[]) {
    this.__apiPermissions = permissions;
  }

  public get apiPermissions(): CommonDbApiPermission[] {
    return this.__apiPermissions;
  }

  public set user(user: CommonDbUser) {
    PageEventBusManager.instance.emit('changeUser', user);
    this.__user = user;
  }

  public get user(): CommonDbUser {
    return this.__user;
  }

  private __apiPermissions: CommonDbApiPermission[] = [];

  private __user: CommonDbUser;


  private constructor() {
    //
  }

  public doesUserHavePermission<TApiPermission = CommonDbApiPermission>(permissions: NoInfer<TApiPermission>[]): boolean {
    if (!permissions?.length) {
      return true;
    }
    if (!this.apiPermissions?.length) {
      return false;
    }
    return permissions.every(permission => {
      return !!(this.apiPermissions).find(({ command_name, permission_type }) => {
        return command_name === (permission as CommonDbApiPermission).command_name && permission_type === (permission as CommonDbApiPermission).permission_type;
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
