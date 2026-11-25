import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import { container } from 'tsyringe';
import type {
  CaseDbApiPermission,
  CaseDbRegion,
  CaseDbRegionRelation,
  CaseDbRegionSet,
} from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbPermissionType,
  CaseDbRegionRelationType,
} from '@gen-epix/api-casedb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { RegionRelationsAdminPage } from './RegionRelationsAdminPage';

type RegionRelationFixture = { readonly id: string } & CaseDbRegionRelation;

const RELATIONS_PATH = '/v1/region_relations';
const ROUTE_PATH = '/management/region-relations';
const URL = '/management/region-relations';

const REGION_SET_ID = '00000000-0000-4000-8000-000000000001';
const NORTH_ID = '11111111-1111-4111-8111-111111111111';
const SOUTH_ID = '22222222-2222-4222-8222-222222222222';
const UNKNOWN_FROM_ID = '33333333-3333-4333-8333-333333333333';
const UNKNOWN_TO_ID = '44444444-4444-4444-8444-444444444444';

const RELATION_PERMISSIONS: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.RegionRelationCrudCommand, permission_type: CaseDbPermissionType.CREATE },
  { command_name: CaseDbCommandName.RegionRelationCrudCommand, permission_type: CaseDbPermissionType.UPDATE },
  { command_name: CaseDbCommandName.RegionRelationCrudCommand, permission_type: CaseDbPermissionType.DELETE },
];

const regionSetFixture: CaseDbRegionSet = {
  code: 'DIST',
  id: REGION_SET_ID,
  name: 'Districts',
  region_code_as_label: false,
  resolution: 1,
};

const createRegionFixture = (id: string, name: string): { readonly id: string } & CaseDbRegion => ({
  center_lat: 0,
  center_lon: 0,
  centroid_lat: 0,
  centroid_lon: 0,
  code: name.toUpperCase(),
  id,
  name,
  region_set_id: REGION_SET_ID,
});

const northFixture = createRegionFixture(NORTH_ID, 'North');
const southFixture = createRegionFixture(SOUTH_ID, 'South');

const relationAlphaFixture: RegionRelationFixture = {
  from_region_id: NORTH_ID,
  id: 'relation-alpha',
  relation: CaseDbRegionRelationType.IS_ADJACENT_TO,
  to_region_id: SOUTH_ID,
};

const relationBetaFixture: RegionRelationFixture = {
  from_region_id: UNKNOWN_FROM_ID,
  id: 'relation-beta',
  relation: CaseDbRegionRelationType.CONTAINS,
  to_region_id: UNKNOWN_TO_ID,
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (
  initialItems: RegionRelationFixture[] = [relationAlphaFixture, relationBetaFixture],
  regions: CaseDbRegion[] = [northFixture, southFixture],
  permissions = RELATION_PERMISSIONS,
) => {
  const mock = mockCrudApi(RELATIONS_PATH, initialItems);
  mockApiRequest('GET', '/v1/regions', () => Response.json(regions));
  mockApiRequest('GET', '/v1/region_sets', () => Response.json([regionSetFixture]));
  const screen = await renderRoutedPage(
    <RegionRelationsAdminPage />, {
      path: ROUTE_PATH,
      permissions: permissions as CommonDbApiPermission[],
      url: URL,
    },
  );
  return { mock, screen };
};

const openRowActions = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

describe('RegionRelationsAdminPage', () => {
  it('lists the region relations with resolved region and relation names', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Districts -> North' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Districts -> South' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'IS_ADJACENT_TO' })).toBeInTheDocument();
  });

  it('names a region relation by its region names when both regions are known', async () => {
    const { screen } = await renderPage([relationAlphaFixture]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: North -> South', { exact: true })).toBeVisible();
  });

  it('names a region relation by its region ids when a region is unknown', async () => {
    const { screen } = await renderPage([relationBetaFixture], []);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText(`Edit item: ${UNKNOWN_FROM_ID} -> ${UNKNOWN_TO_ID}`, { exact: true })).toBeVisible();
  });

  it('creates a region relation via the region relations endpoint', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new region relation', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { name: 'From Region' }).click();
    await screen.getByRole('option', { name: 'Districts -> North' }).click();
    await screen.getByRole('combobox', { name: 'To Region' }).click();
    await screen.getByRole('option', { name: 'Districts -> South' }).click();
    await screen.getByRole('combobox', { name: 'Relation' }).click();
    await screen.getByRole('option', { name: CaseDbRegionRelationType.OVERLAPS_WITH }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.pathname).toBe(RELATIONS_PATH);
    expect(postCall?.body).toEqual(expect.objectContaining({
      from_region_id: NORTH_ID,
      relation: CaseDbRegionRelationType.OVERLAPS_WITH,
      to_region_id: SOUTH_ID,
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a region relation via the region relations endpoint', async () => {
    const { mock, screen } = await renderPage([relationAlphaFixture]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: North -> South', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { name: 'Relation' }).click();
    await screen.getByRole('option', { name: CaseDbRegionRelationType.CONTAINS }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${RELATIONS_PATH}/relation-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ id: 'relation-alpha', relation: CaseDbRegionRelationType.CONTAINS }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a region relation via the region relations endpoint', async () => {
    const { mock, screen } = await renderPage([relationAlphaFixture]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${RELATIONS_PATH}/relation-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create, edit and delete actions without permissions', async () => {
    const { screen } = await renderPage([relationAlphaFixture], [northFixture, southFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Districts -> North' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });
});
