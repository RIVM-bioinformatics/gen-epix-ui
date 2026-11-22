import {
  CaseDbCommandName,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';
import type { CaseDbApiPermission } from '@gen-epix/api-casedb';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  MyIndexRouteObject,
  MyNonIndexRouteObject,
} from '@gen-epix/ui-client-common/models/react-router.models';
import { ADMIN_PAGE_CATEGORY } from '@gen-epix/ui-client-common/models/admin.models';
import { RouterErrorPage } from '@gen-epix/ui-client-common/pages/RouterErrorPage';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { CaseDbUsersAdminPage } from '../pages/CaseDbUsersAdminPage';
import { CaseSetCategoryAdminPage } from '../pages/CaseSetCategoryAdminPage';
import { CaseSetStatusAdminPage } from '../pages/CaseSetStatusAdminPage';
import { CaseTypeSetCategoriesAdminPage } from '../pages/CaseTypeSetCategoriesAdminPage';
import { CaseTypeSetsAdminPage } from '../pages/CaseTypeSetsAdminPage';
import { CaseTypesAdminPage } from '../pages/CaseTypesAdminPage';
import { ColsAdminPage } from '../pages/ColsAdminPage';
import { ColSetsAdminPage } from '../pages/ColSetsAdminPage';
import { ConceptRelationsAdminPage } from '../pages/ConceptRelationsAdminPage';
import { ConceptsAdminPage } from '../pages/ConceptsAdminPage';
import { ConceptSetsAdminPage } from '../pages/ConceptSetsAdminPage';
import { DataCollectionSetsAdminPage } from '../pages/DataCollectionSetsAdminPage';
import { DataCollectionsAdminPage } from '../pages/DataCollectionsAdminPage';
import { DataCollectionVisualizationPage } from '../pages/DataCollectionVisualizationPage';
import { DimsAdminPage } from '../pages/DimsAdminPage';
import { DiseasesAdminPage } from '../pages/DiseasesAdminPage';
import { EtiologicalAgentsAdminPage } from '../pages/EtiologicalAgentsAdminPage';
import { EtiologiesAdminPage } from '../pages/EtiologiesAdminPage';
import { OrganizationAccessCasePoliciesAdminPage } from '../pages/OrganizationAccessCasePoliciesAdminPage';
import { OrganizationShareCasePoliciesAdminPage } from '../pages/OrganizationShareCasePoliciesAdminPage';
import { RefColsAdminPage } from '../pages/RefColsAdminPage';
import { RefDimsAdminPage } from '../pages/RefDimsAdminPage';
import { RegionRelationsAdminPage } from '../pages/RegionRelationsAdminPage';
import { RegionSetsAdminPage } from '../pages/RegionSetsAdminPage';
import { RegionSetShapesAdminPage } from '../pages/RegionSetShapesAdminPage';
import { RegionsAdminPage } from '../pages/RegionsAdminPage';
import { UserAccessCasePoliciesAdminPage } from '../pages/UserAccessCasePoliciesAdminPage';
import { UserEffectiveRightsAdminPage } from '../pages/UserEffectiveRightsAdminPage';
import { UserEffectiveRightsTesterAdminPage } from '../pages/UserEffectiveRightsTesterAdminPage';
import { UserShareCasePoliciesAdminPage } from '../pages/UserShareCasePoliciesAdminPage';

import { createAdminRoutes } from './adminRoutes';

type TestRoute = MyIndexRouteObject<CaseDbApiPermission | CommonDbApiPermission> | MyNonIndexRouteObject<CaseDbApiPermission | CommonDbApiPermission>;

const findRoute = (routes: TestRoute[], path: string): TestRoute => {
  const route = routes.find((candidate) => candidate.path === path);
  if (!route) {
    throw new Error(`Route ${path} not found`);
  }
  return route;
};

const getChildren = (route: TestRoute): TestRoute[] => ('children' in route ? route.children ?? [] : []);

const EFFECTIVE_RIGHTS_PERMISSIONS = [
  { command_name: CaseDbCommandName.ColSetMemberCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.CaseTypeSetCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.ColSetCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.CaseTypeSetMemberCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.CaseTypeSetCategoryCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.DataCollectionCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.OrganizationAccessCasePolicyCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.OrganizationShareCasePolicyCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.UserAccessCasePolicyCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.UserShareCasePolicyCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.ColCrudCommand, permission_type: CaseDbPermissionType.READ },
];

describe('createAdminRoutes', () => {
  it('creates the common admin routes followed by the CaseDB admin routes', () => {
    const routes = createAdminRoutes();

    expect(routes.map((route) => route.path)).toEqual([
      '/management/organizations',
      '/management/users',
      '/management/user-invitations',
      '/management/organization-admin-policies',
      '/management/identifier-issuers',
      '/management/outages',
      '/management/data-collections',
      '/management/data-collection-sets',
      '/management/col-sets',
      '/management/organization-access-case-policies',
      '/management/organization-share-case-policies',
      '/management/user-access-case-policies',
      '/management/user-share-case-policies',
      '/management/reference-dimensions',
      '/management/concept-sets',
      '/management/concept-relations',
      '/management/diseases',
      '/management/etiological-agents',
      '/management/etiologies',
      '/management/case-set-statuses',
      '/management/case-set-categories',
      '/management/case-types',
      '/management/case-type-sets',
      '/management/case-type-set-categories',
      '/management/region-sets',
      '/management/region-relations',
      '/management/reference-columns',
      '/management/dimensions',
      '/management/columns',
      '/management/data-collection-visualization-page',
    ]);
  });

  it('mounts the effective rights and effective rights tester routes under the users route', () => {
    const users = findRoute(createAdminRoutes(), '/management/users');
    const [usersIndex, effectiveRights, effectiveRightsTester] = getChildren(users);

    expect(usersIndex?.path).toBe('/management/users');
    expect(usersIndex?.Component).toBe(CaseDbUsersAdminPage);
    expect(effectiveRights?.path).toBe('/management/users/:userId/effective-rights');
    expect(effectiveRightsTester?.path).toBe('/management/users/:userId/effective-rights-tester');
    expect(getChildren(users)).toHaveLength(3);
  });

  it('configures the effective rights routes with their page, permissions and user profile requirement', () => {
    const [, effectiveRights, effectiveRightsTester] = getChildren(findRoute(createAdminRoutes(), '/management/users'));

    expect(effectiveRights?.Component).toBe(UserEffectiveRightsAdminPage);
    expect(effectiveRights?.errorElement).toEqual(
      <RouterErrorPage />,
    );
    expect(effectiveRights?.handle?.requiredPermissions).toEqual(EFFECTIVE_RIGHTS_PERMISSIONS);
    expect(effectiveRights?.handle?.requiresUserProfile).toBe(true);
    expect(effectiveRightsTester?.Component).toBe(UserEffectiveRightsTesterAdminPage);
    expect(effectiveRightsTester?.errorElement).toEqual(
      <RouterErrorPage />,
    );
    expect(effectiveRightsTester?.handle?.requiredPermissions).toEqual(EFFECTIVE_RIGHTS_PERMISSIONS);
    expect(effectiveRightsTester?.handle?.requiresUserProfile).toBe(true);
  });

  it.each([
    ['/management/organization-access-case-policies', OrganizationAccessCasePoliciesAdminPage],
    ['/management/organization-share-case-policies', OrganizationShareCasePoliciesAdminPage],
    ['/management/user-access-case-policies', UserAccessCasePoliciesAdminPage],
    ['/management/user-share-case-policies', UserShareCasePoliciesAdminPage],
    ['/management/data-collections', DataCollectionsAdminPage],
    ['/management/data-collection-sets', DataCollectionSetsAdminPage],
    ['/management/col-sets', ColSetsAdminPage],
  ])('maps %s to its page in the access rights category', (path, expectedComponent) => {
    const route = findRoute(createAdminRoutes(), path);

    expect(route.Component).toBe(expectedComponent);
    expect(route.handle?.category).toBe(ADMIN_PAGE_CATEGORY.ACCESS_RIGHTS);
    expect(route.handle?.requiresUserProfile).toBe(true);
    expect(route.errorElement).toEqual(
      <RouterErrorPage />,
    );
  });

  it.each([
    ['/management/diseases', DiseasesAdminPage],
    ['/management/etiological-agents', EtiologicalAgentsAdminPage],
    ['/management/etiologies', EtiologiesAdminPage],
    ['/management/case-set-statuses', CaseSetStatusAdminPage],
    ['/management/case-set-categories', CaseSetCategoryAdminPage],
    ['/management/case-type-sets', CaseTypeSetsAdminPage],
    ['/management/case-type-set-categories', CaseTypeSetCategoriesAdminPage],
    ['/management/concept-relations', ConceptRelationsAdminPage],
    ['/management/region-relations', RegionRelationsAdminPage],
  ])('maps %s to its page in the reference data category', (path, expectedComponent) => {
    const route = findRoute(createAdminRoutes(), path);

    expect(route.Component).toBe(expectedComponent);
    expect(route.handle?.category).toBe(ADMIN_PAGE_CATEGORY.REFERENCE_DATA);
  });

  it.each([
    ['/management/reference-columns', RefColsAdminPage],
    ['/management/columns', ColsAdminPage],
    ['/management/data-collection-visualization-page', DataCollectionVisualizationPage],
  ])('maps %s to its page in the helpers category', (path, expectedComponent) => {
    const route = findRoute(createAdminRoutes(), path);

    expect(route.Component).toBe(expectedComponent);
    expect(route.handle?.category).toBe(ADMIN_PAGE_CATEGORY.HELPERS);
  });

  it('exposes the data visualization page without required permissions', () => {
    const route = findRoute(createAdminRoutes(), '/management/data-collection-visualization-page');

    expect(route.handle?.requiredPermissions).toEqual([]);
  });

  it('nests the reference dimension and reference column routes under the reference dimensions route', () => {
    const parent = findRoute(createAdminRoutes(), '/management/reference-dimensions');
    const children = getChildren(parent);

    expect(parent.handle?.requirePermissionForChildRoute).toBe(true);
    expect(children.map((route) => route.path)).toEqual([
      '/management/reference-dimensions',
      '/management/reference-dimensions/:refDimId/reference-columns',
    ]);
    expect(children[0]?.Component).toBe(RefDimsAdminPage);
    expect(children[1]?.Component).toBe(RefColsAdminPage);
    expect(children[1]?.handle?.category).toBe(ADMIN_PAGE_CATEGORY.REFERENCE_DATA);
  });

  it('nests the concept set and concept routes under the concept sets route', () => {
    const parent = findRoute(createAdminRoutes(), '/management/concept-sets');
    const children = getChildren(parent);

    expect(parent.handle?.requirePermissionForChildRoute).toBe(true);
    expect(children.map((route) => route.path)).toEqual([
      '/management/concept-sets',
      '/management/concept-sets/:conceptSetId/concepts',
    ]);
    expect(children[0]?.Component).toBe(ConceptSetsAdminPage);
    expect(children[1]?.Component).toBe(ConceptsAdminPage);
  });

  it('nests the case type, dimension and column routes under the case types route', () => {
    const parent = findRoute(createAdminRoutes(), '/management/case-types');
    const caseTypeChildren = getChildren(parent);
    const dimensionsParent = caseTypeChildren[1];

    expect(parent.handle?.requirePermissionForChildRoute).toBe(true);
    expect(caseTypeChildren.map((route) => route.path)).toEqual([
      '/management/case-types',
      '/management/case-types/:caseTypeId/dimensions',
    ]);
    expect(caseTypeChildren[0]?.Component).toBe(CaseTypesAdminPage);
    expect(dimensionsParent && getChildren(dimensionsParent).map((route) => route.path)).toEqual([
      '/management/case-types/:caseTypeId/dimensions',
      '/management/case-types/:caseTypeId/dimensions/:dimId/columns',
    ]);
    expect(dimensionsParent && getChildren(dimensionsParent)[0]?.Component).toBe(DimsAdminPage);
    expect(dimensionsParent && getChildren(dimensionsParent)[1]?.Component).toBe(ColsAdminPage);
  });

  it('nests the region set, region and shape routes under the region sets route', () => {
    const parent = findRoute(createAdminRoutes(), '/management/region-sets');
    const children = getChildren(parent);

    expect(parent.handle?.requirePermissionForChildRoute).toBe(true);
    expect(children.map((route) => route.path)).toEqual([
      '/management/region-sets',
      '/management/region-sets/:regionSetId/regions',
      '/management/region-sets/:regionSetId/shapes',
    ]);
    expect(children[0]?.Component).toBe(RegionSetsAdminPage);
    expect(children[1]?.Component).toBe(RegionsAdminPage);
    expect(children[2]?.Component).toBe(RegionSetShapesAdminPage);
  });

  it('nests the dimension and column routes under the dimensions route', () => {
    const parent = findRoute(createAdminRoutes(), '/management/dimensions');
    const children = getChildren(parent);

    expect(parent.handle?.requirePermissionForChildRoute).toBe(true);
    expect(children.map((route) => route.path)).toEqual([
      '/management/dimensions',
      '/management/dimensions/:dimId/columns',
    ]);
    expect(children[0]?.Component).toBe(DimsAdminPage);
    expect(children[1]?.Component).toBe(ColsAdminPage);
  });
});
