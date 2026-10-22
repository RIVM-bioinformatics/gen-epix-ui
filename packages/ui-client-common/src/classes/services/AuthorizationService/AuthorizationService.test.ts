import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  CommonDbCommandName,
  CommonDbPermissionType,
} from '@gen-epix/api-commondb';
import type {
  CommonDbApiPermission,
  CommonDbUser,
} from '@gen-epix/api-commondb';

import type {
  MyHandle,
  MyIndexRouteObject,
  MyNonIndexRouteObject,
} from '../../../models/react-router.models';
import type { PageEventBusService } from '../PageEventBusService';

import { AuthorizationService } from './AuthorizationService';

const FIRST_PERMISSION: CommonDbApiPermission = {
  command_name: CommonDbCommandName.OrganizationCrudCommand,
  permission_type: CommonDbPermissionType.READ,
};

const SECOND_PERMISSION: CommonDbApiPermission = {
  command_name: CommonDbCommandName.SiteCrudCommand,
  permission_type: CommonDbPermissionType.UPDATE,
};

const createHandle = (
  requiredPermissions: CommonDbApiPermission[] = [],
  requirePermissionForChildRoute = false,
): MyHandle => ({
  requiredPermissions,
  requirePermissionForChildRoute,
  requiresUserProfile: false,
  title: 'Route',
});

const createRoute = (
  handle: MyHandle = createHandle(),
  children?: Array<MyIndexRouteObject | MyNonIndexRouteObject>,
): MyNonIndexRouteObject => ({
  children,
  handle,
  path: '/route',
});

const createIndexRoute = (handle: MyHandle): MyIndexRouteObject => ({
  handle,
  index: true,
});

const createService = () => {
  const emit = vi.fn();
  const pageEventBusService = { emit } as unknown as PageEventBusService;

  return {
    emit,
    service: new AuthorizationService(pageEventBusService),
  };
};

describe('AuthorizationService', () => {
  it('initializes empty permissions and stores updates by reference', () => {
    const { service } = createService();
    const permissions = [FIRST_PERMISSION];

    expect(service.apiPermissions).toEqual([]);

    service.apiPermissions = permissions;

    expect(service.apiPermissions).toBe(permissions);
  });

  it('emits user changes and exposes the current user', () => {
    const { emit, service } = createService();
    const user: CommonDbUser = {
      organization_id: 'organization-id',
      roles: ['reader'],
    };

    service.user = user;

    expect(emit).toHaveBeenCalledExactlyOnceWith('changeUser', user);
    expect(service.user).toBe(user);
  });

  it('allows routes with no required permissions', () => {
    const { service } = createService();

    expect(service.doesUserHavePermission([])).toBe(true);
    expect(service.doesUserHavePermissionForRoute(createRoute())).toBe(true);
  });

  it('denies required permissions when no API permissions are available', () => {
    const { service } = createService();

    expect(service.doesUserHavePermission([FIRST_PERMISSION])).toBe(false);
    expect(service.doesUserHavePermissionForRoute(createRoute(createHandle([FIRST_PERMISSION])))).toBe(false);
  });

  it('requires every permission to match both command and permission type', () => {
    const { service } = createService();
    service.apiPermissions = [FIRST_PERMISSION];

    expect(service.doesUserHavePermission([FIRST_PERMISSION])).toBe(true);
    expect(service.doesUserHavePermission([{
      ...FIRST_PERMISSION,
      command_name: CommonDbCommandName.SiteCrudCommand,
    }])).toBe(false);
    expect(service.doesUserHavePermission([{
      ...FIRST_PERMISSION,
      permission_type: CommonDbPermissionType.UPDATE,
    }])).toBe(false);
    expect(service.doesUserHavePermission([FIRST_PERMISSION, SECOND_PERMISSION])).toBe(false);
  });

  it('checks index-route permissions instead of parent permissions when an index route exists', () => {
    const { service } = createService();
    service.apiPermissions = [FIRST_PERMISSION];

    const route = createRoute(createHandle([SECOND_PERMISSION]), [
      createIndexRoute(createHandle([FIRST_PERMISSION])),
    ]);
    const deniedIndexRoute = createRoute(createHandle(), [
      createIndexRoute(createHandle([SECOND_PERMISSION])),
    ]);

    expect(service.doesUserHavePermissionForRoute(route)).toBe(true);
    expect(service.doesUserHavePermissionForRoute(deniedIndexRoute)).toBe(false);
  });

  it('checks non-index children and ignores index children when child permissions are required', () => {
    const { service } = createService();
    service.apiPermissions = [FIRST_PERMISSION];

    const route = createRoute(createHandle([], true), [
      createIndexRoute(createHandle([SECOND_PERMISSION])),
      createRoute(createHandle([FIRST_PERMISSION])),
      createRoute(createHandle([SECOND_PERMISSION])),
    ]);
    const deniedRoute = createRoute(createHandle([], true), [
      createRoute(createHandle([SECOND_PERMISSION])),
    ]);

    expect(service.doesUserHavePermissionForRoute(route)).toBe(true);
    expect(service.doesUserHavePermissionForRoute(deniedRoute)).toBe(false);
  });

  it('denies a route that requires child permissions when there are no children', () => {
    const { service } = createService();

    expect(service.doesUserHavePermissionForRoute(createRoute(createHandle([], true)))).toBe(false);
  });
});
