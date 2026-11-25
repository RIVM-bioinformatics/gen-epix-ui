import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import { container } from 'tsyringe';
import type {
  CaseDbApiPermission,
  CaseDbRegionSet,
} from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { RegionSetsAdminPage } from './RegionSetsAdminPage';

type RegionSetFixture = { readonly id: string } & CaseDbRegionSet;

const REGION_SETS_PATH = '/v1/region_sets';
const ROUTE_PATH = '/management/region-sets';

const REGION_SET_PERMISSIONS: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.RegionSetCrudCommand, permission_type: CaseDbPermissionType.CREATE },
  { command_name: CaseDbCommandName.RegionSetCrudCommand, permission_type: CaseDbPermissionType.UPDATE },
  { command_name: CaseDbCommandName.RegionSetCrudCommand, permission_type: CaseDbPermissionType.DELETE },
];

const REGIONS_READ_PERMISSION: CaseDbApiPermission = { command_name: CaseDbCommandName.RegionCrudCommand, permission_type: CaseDbPermissionType.READ };
const SHAPES_READ_PERMISSION: CaseDbApiPermission = { command_name: CaseDbCommandName.RegionSetShapeCrudCommand, permission_type: CaseDbPermissionType.READ };

const regionSetAlphaFixture: RegionSetFixture = {
  code: 'ALPHA',
  id: 'region-set-alpha',
  name: 'Alpha',
  region_code_as_label: false,
  resolution: 1,
};

const regionSetBetaFixture: RegionSetFixture = {
  code: 'BETA',
  id: 'region-set-beta',
  name: 'Beta',
  region_code_as_label: true,
  resolution: 2,
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (
  initialItems: RegionSetFixture[] = [regionSetAlphaFixture, regionSetBetaFixture],
  permissions: CaseDbApiPermission[] = REGION_SET_PERMISSIONS,
) => {
  const mock = mockCrudApi(REGION_SETS_PATH, initialItems);
  const screen = await renderRoutedPage(
    <RegionSetsAdminPage />, {
      path: ROUTE_PATH,
      permissions: permissions as CommonDbApiPermission[],
      url: ROUTE_PATH,
    },
  );
  return { mock, screen };
};

const openRowActions = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

describe('RegionSetsAdminPage', () => {
  it('lists the region sets from the region sets endpoint', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Beta' })).toBeInTheDocument();
  });

  it('creates a region set via the region sets endpoint', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new region set', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Gamma');
    await screen.getByRole('textbox', { name: 'Code' }).fill('GAMMA');
    await screen.getByRole('spinbutton', { name: 'Resolution' }).fill('5');
    await screen.getByRole('combobox', { name: 'Region code as label' }).click();
    await screen.getByRole('option', { exact: true, name: 'Yes' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.pathname).toBe(REGION_SETS_PATH);
    expect(postCall?.body).toEqual(expect.objectContaining({ code: 'GAMMA', name: 'Gamma', region_code_as_label: true, resolution: 5 }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a region set via the region sets endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Alpha', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Alpha renamed');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${REGION_SETS_PATH}/region-set-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ id: 'region-set-alpha', name: 'Alpha renamed' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a region set via the region sets endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${REGION_SETS_PATH}/region-set-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('shows both the manage regions and manage shapes sub pages when permitted', async () => {
    const { screen } = await renderPage([regionSetAlphaFixture], [...REGION_SET_PERMISSIONS, REGIONS_READ_PERMISSION, SHAPES_READ_PERMISSION]);

    await openRowActions(screen);
    await expect.element(screen.getByRole('menuitem', { name: 'Manage regions' })).toBeInTheDocument();
    await expect.element(screen.getByRole('menuitem', { name: 'Manage shapes' })).toBeInTheDocument();
  });

  it('navigates to the regions sub page of a region set', async () => {
    const { screen } = await renderPage([regionSetAlphaFixture], [...REGION_SET_PERMISSIONS, REGIONS_READ_PERMISSION]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Manage regions' }).click();
    await expect.poll(() => window.location.pathname).toBe('/management/region-sets/region-set-alpha/regions');
  });

  it('navigates to the shapes sub page of a region set', async () => {
    const { screen } = await renderPage([regionSetAlphaFixture], [...REGION_SET_PERMISSIONS, SHAPES_READ_PERMISSION]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Manage shapes' }).click();
    await expect.poll(() => window.location.pathname).toBe('/management/region-sets/region-set-alpha/shapes');
  });

  it('hides the sub pages without region and shape permissions', async () => {
    const { screen } = await renderPage([regionSetAlphaFixture], REGION_SET_PERMISSIONS);

    await openRowActions(screen);
    await expect.element(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('menuitem', { name: 'Manage regions' }).query()).toBeNull();
    await expect.poll(() => screen.getByRole('menuitem', { name: 'Manage shapes' }).query()).toBeNull();
  });

  it('hides the create, edit and delete actions without permissions', async () => {
    const { screen } = await renderPage([regionSetAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });
});
