import type { CaseDbApiPermission } from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';
import { FeatureFlagsService } from '@gen-epix/ui-client-common/classes/services/FeatureFlagsService';
import type {
  MyIndexRouteObject,
  MyNonIndexRouteObject,
} from '@gen-epix/ui-client-common/models/react-router.models';
import { RouterErrorPage } from '@gen-epix/ui-client-common/pages/RouterErrorPage';
import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';

import { CasesDetailPage } from '../pages/CasesDetailPage';
import { CasesPage } from '../pages/CasesPage';
import { EventsDetailPage } from '../pages/EventsDetailPage';
import { EventsPage } from '../pages/EventsPage';
import { TrendsPage } from '../pages/TrendsPage';
import { UploadPage } from '../pages/UploadPage';

import { createAdminRoutes } from './adminRoutes';
import { createRoutes } from './routes';

type TestRoute = MyIndexRouteObject<CaseDbApiPermission> | MyNonIndexRouteObject<CaseDbApiPermission>;

const findRoute = (routes: TestRoute[], path: string): TestRoute => {
  const route = routes.find((candidate) => candidate.path === path);
  if (!route) {
    throw new Error(`Route ${path} not found`);
  }
  return route;
};

const getChildren = (route: TestRoute): TestRoute[] => ('children' in route ? route.children ?? [] : []);

const getRootRoute = (routes: TestRoute[]): TestRoute => findRoute(routes, '/');

const getManagementRoute = (routes: TestRoute[]): TestRoute => findRoute(getChildren(getRootRoute(routes)), '/management');

const setFeatureFlags = (featureFlags: { [key: string]: boolean }): void => {
  container.resolve(FeatureFlagsService).featureFlags = featureFlags;
};

describe('createRoutes', () => {
  it('creates the root route with the CaseDB root children and the management route', () => {
    setFeatureFlags({ disable_upload: false });
    const routes = createRoutes();

    expect(routes.map((route) => route.path)).toEqual(['/post-logout', '/']);
    expect(getChildren(getRootRoute(routes)).map((route) => route.path)).toEqual([
      '/accept-invitation/:token',
      '/post-login',
      '/cases',
      '/events',
      '/trends',
      '/upload',
      '/management',
    ]);
  });

  it('includes the CaseDB admin routes under the management route', () => {
    setFeatureFlags({ disable_upload: false });
    const management = getManagementRoute(createRoutes());

    expect(getChildren(management).map((route) => route.path)).toEqual([
      '/management',
      ...createAdminRoutes().map((route) => route.path),
    ]);
  });

  it('uses the provided admin routes instead of the default ones', () => {
    setFeatureFlags({ disable_upload: false });
    const management = getManagementRoute(createRoutes([{ path: '/management/custom' }]));

    expect(getChildren(management).map((route) => route.path)).toEqual([
      '/management',
      '/management/custom',
    ]);
  });

  it('configures the cases route with its index page and the case detail child', () => {
    setFeatureFlags({ disable_upload: false });
    const cases = findRoute(getChildren(getRootRoute(createRoutes())), '/cases');
    const [casesIndex, casesDetail] = getChildren(cases);

    expect(cases.handle?.requiresUserProfile).toBe(true);
    expect(cases.handle?.title).toBe('Cases');
    expect(cases.errorElement).toEqual(
      <RouterErrorPage />,
    );
    expect(getChildren(cases)).toHaveLength(2);

    expect(casesIndex?.index).toBe(true);
    expect(casesIndex?.Component).toBe(CasesPage);
    expect(casesIndex?.handle?.requiredPermissions).toEqual(expect.arrayContaining([
      { command_name: CaseDbCommandName.CaseTypeSetCategoryCrudCommand, permission_type: CaseDbPermissionType.READ },
      { command_name: CaseDbCommandName.RetrieveCaseTypeStatsCommand, permission_type: CaseDbPermissionType.EXECUTE },
    ]));

    expect(casesDetail?.path).toBe('/cases/:slug/:caseTypeId');
    expect(casesDetail?.Component).toBe(CasesDetailPage);
    expect(casesDetail?.handle?.title).toBe('Case type');
    expect(casesDetail?.handle?.requiredPermissions).toEqual(expect.arrayContaining([
      { command_name: CaseDbCommandName.CaseTypeCrudCommand, permission_type: CaseDbPermissionType.READ },
      { command_name: CaseDbCommandName.RetrieveCasesByQueryCommand, permission_type: CaseDbPermissionType.EXECUTE },
    ]));
  });

  it('configures the events route with its index page and the event detail child', () => {
    setFeatureFlags({ disable_upload: false });
    const events = findRoute(getChildren(getRootRoute(createRoutes())), '/events');
    const [eventsIndex, eventsDetail] = getChildren(events);

    expect(events.handle?.requiresUserProfile).toBe(true);
    expect(events.handle?.title).toBe('Events');
    expect(events.errorElement).toEqual(
      <RouterErrorPage />,
    );
    expect(getChildren(events)).toHaveLength(2);

    expect(eventsIndex?.index).toBe(true);
    expect(eventsIndex?.Component).toBe(EventsPage);
    expect(eventsIndex?.handle?.requiredPermissions).toEqual(expect.arrayContaining([
      { command_name: CaseDbCommandName.CaseSetCrudCommand, permission_type: CaseDbPermissionType.READ },
      { command_name: CaseDbCommandName.RetrieveCaseSetStatsCommand, permission_type: CaseDbPermissionType.EXECUTE },
    ]));

    expect(eventsDetail?.path).toBe('/events/:slug/:caseSetId');
    expect(eventsDetail?.Component).toBe(EventsDetailPage);
    expect(eventsDetail?.handle?.title).toBe('Event');
    expect(eventsDetail?.handle?.requiredPermissions).toEqual(expect.arrayContaining([
      { command_name: CaseDbCommandName.CaseSetCrudCommand, permission_type: CaseDbPermissionType.READ },
      { command_name: CaseDbCommandName.RetrieveCasesByIdCommand, permission_type: CaseDbPermissionType.EXECUTE },
    ]));
  });

  it('configures the trends route as disabled', () => {
    setFeatureFlags({ disable_upload: false });
    const trends = findRoute(getChildren(getRootRoute(createRoutes())), '/trends');

    expect(trends.Component).toBe(TrendsPage);
    expect(trends.errorElement).toEqual(
      <RouterErrorPage />,
    );
    expect(trends.handle?.disabled).toBe(true);
    expect(trends.handle?.requiredPermissions).toEqual([]);
    expect(trends.handle?.title).toBe('Trends');
  });

  it.each([
    [true],
    [false],
  ])('sets the upload route disabled state from the disable_upload feature flag (%s)', (disableUpload) => {
    setFeatureFlags({ disable_upload: disableUpload });
    const upload = findRoute(getChildren(getRootRoute(createRoutes())), '/upload');

    expect(upload.Component).toBe(UploadPage);
    expect(upload.errorElement).toEqual(
      <RouterErrorPage />,
    );
    expect(upload.handle?.disabled).toBe(disableUpload);
    expect(upload.handle?.title).toBe('Upload');
    expect(upload.handle?.requiredPermissions).toEqual(expect.arrayContaining([
      { command_name: CaseDbCommandName.UploadCasesCommand, permission_type: CaseDbPermissionType.EXECUTE },
      { command_name: CaseDbCommandName.ColCrudCommand, permission_type: CaseDbPermissionType.READ },
    ]));
  });

  it('leaves the upload route disabled state undefined when the feature flag is not set', () => {
    setFeatureFlags({});
    const upload = findRoute(getChildren(getRootRoute(createRoutes())), '/upload');

    expect(upload.handle?.disabled).toBeUndefined();
  });
});
