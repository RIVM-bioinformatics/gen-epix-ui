import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type {
  CaseDbApiPermission,
  CaseDbRegion,
} from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { RegionsAdminPage } from './RegionsAdminPage';

type RegionFixture = { readonly id: string } & CaseDbRegion;

const REGION_SET_ID = 'region-set-alpha';
const OTHER_REGION_SET_ID = 'region-set-beta';
const REGIONS_PATH = '/v1/regions';
const ROUTE_PATH = '/management/region-sets/:regionSetId/regions';
const ROUTE_URL = `/management/region-sets/${REGION_SET_ID}/regions`;

const REGION_PERMISSIONS: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.RegionCrudCommand, permission_type: CaseDbPermissionType.CREATE },
  { command_name: CaseDbCommandName.RegionCrudCommand, permission_type: CaseDbPermissionType.UPDATE },
  { command_name: CaseDbCommandName.RegionCrudCommand, permission_type: CaseDbPermissionType.DELETE },
];

const regionAlphaFixture: RegionFixture = {
  center_lat: 1,
  center_lon: 2,
  centroid_lat: 3,
  centroid_lon: 4,
  code: 'A1',
  id: 'region-a1',
  name: 'Region alpha one',
  region_set_id: REGION_SET_ID,
};

const regionAlphaTwoFixture: RegionFixture = {
  center_lat: 5,
  center_lon: 6,
  centroid_lat: 7,
  centroid_lon: 8,
  code: 'A2',
  id: 'region-a2',
  name: 'Region alpha two',
  region_set_id: REGION_SET_ID,
};

const regionBetaFixture: RegionFixture = {
  center_lat: 9,
  center_lon: 10,
  centroid_lat: 11,
  centroid_lon: 12,
  code: 'B1',
  id: 'region-b1',
  name: 'Region beta one',
  region_set_id: OTHER_REGION_SET_ID,
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (
  initialItems: RegionFixture[] = [regionAlphaFixture, regionAlphaTwoFixture, regionBetaFixture],
  permissions: CaseDbApiPermission[] = REGION_PERMISSIONS,
) => {
  const mock = mockCrudApi(REGIONS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <RegionsAdminPage />, {
      path: ROUTE_PATH,
      permissions: permissions as CommonDbApiPermission[],
      url: ROUTE_URL,
    },
  );
  return { mock, screen };
};

const openRowActions = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

describe('RegionsAdminPage', () => {
  it('lists only the regions of the region set in the route', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Region alpha one' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Region alpha two' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('cell', { exact: true, name: 'Region beta one' }).query()).toBeNull();
  });

  it('creates a region in the route region set via the regions endpoint', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new region', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Region gamma');
    await screen.getByRole('textbox', { name: 'Code' }).fill('G1');
    await screen.getByRole('spinbutton', { name: 'Centroid latitude' }).fill('13');
    await screen.getByRole('spinbutton', { name: 'Centroid longitude' }).fill('14');
    await screen.getByRole('spinbutton', { name: 'Center latitude' }).fill('15');
    await screen.getByRole('spinbutton', { name: 'Center longitude' }).fill('16');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.pathname).toBe(REGIONS_PATH);
    expect(postCall?.body).toEqual({
      center_lat: 15,
      center_lon: 16,
      centroid_lat: 13,
      centroid_lon: 14,
      code: 'G1',
      name: 'Region gamma',
      region_set_id: REGION_SET_ID,
    });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a region keeping it in the route region set via the regions endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Region alpha one', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Region alpha renamed');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${REGIONS_PATH}/region-a1`);
    expect(putCall?.body).toEqual(expect.objectContaining({
      id: 'region-a1',
      name: 'Region alpha renamed',
      region_set_id: REGION_SET_ID,
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a region via the regions endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${REGIONS_PATH}/region-a1`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });
});
