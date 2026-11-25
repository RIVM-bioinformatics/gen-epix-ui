import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type {
  CaseDbApiPermission,
  CaseDbRegionSet,
  CaseDbRegionSetShape,
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

import { RegionSetShapesAdminPage } from './RegionSetShapesAdminPage';

type RegionSetFixture = { readonly id: string } & CaseDbRegionSet;
type RegionSetShapeFixture = { readonly id: string } & CaseDbRegionSetShape;

const REGION_SET_ID = 'region-set-alpha';
const OTHER_REGION_SET_ID = 'region-set-beta';
const REGION_SETS_PATH = '/v1/region_sets';
const REGION_SET_SHAPES_PATH = '/v1/region_set_shapes';
const ROUTE_PATH = '/management/region-sets/:regionSetId/shapes';
const ROUTE_URL = `/management/region-sets/${REGION_SET_ID}/shapes`;

const SHAPE_PERMISSIONS: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.RegionSetShapeCrudCommand, permission_type: CaseDbPermissionType.CREATE },
  { command_name: CaseDbCommandName.RegionSetShapeCrudCommand, permission_type: CaseDbPermissionType.UPDATE },
  { command_name: CaseDbCommandName.RegionSetShapeCrudCommand, permission_type: CaseDbPermissionType.DELETE },
];

const regionSetAlphaFixture: RegionSetFixture = {
  code: 'ALPHA',
  id: REGION_SET_ID,
  name: 'Alpha',
  region_code_as_label: false,
  resolution: 1,
};

const regionSetBetaFixture: RegionSetFixture = {
  code: 'BETA',
  id: OTHER_REGION_SET_ID,
  name: 'Beta',
  region_code_as_label: false,
  resolution: 2,
};

const shapeOneFixture: RegionSetShapeFixture = {
  geo_json: '{"type":"FeatureCollection"}',
  id: 'shape-1',
  region_set_id: REGION_SET_ID,
  scale: 1,
};

const shapeTwoFixture: RegionSetShapeFixture = {
  geo_json: '',
  id: 'shape-2',
  region_set_id: REGION_SET_ID,
  scale: 2,
};

const shapeBetaFixture: RegionSetShapeFixture = {
  geo_json: '{"type":"Polygon"}',
  id: 'shape-beta',
  region_set_id: OTHER_REGION_SET_ID,
  scale: 3,
};

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (
  initialItems: RegionSetShapeFixture[] = [shapeOneFixture, shapeTwoFixture, shapeBetaFixture],
  permissions: CaseDbApiPermission[] = SHAPE_PERMISSIONS,
) => {
  const mock = mockCrudApi(REGION_SET_SHAPES_PATH, initialItems);
  mockCrudApi(REGION_SETS_PATH, [regionSetAlphaFixture, regionSetBetaFixture]);
  const screen = await renderRoutedPage(
    <RegionSetShapesAdminPage />, {
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

describe('RegionSetShapesAdminPage', () => {
  it('lists only the shapes of the region set in the route', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByTitle('1', { exact: true })).toBeInTheDocument();
    await expect.element(screen.getByTitle('2', { exact: true })).toBeInTheDocument();
    await expect.poll(() => screen.getByTitle('3', { exact: true }).query()).toBeNull();
  });

  it('creates a shape in the route region set via the region set shapes endpoint', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new region set shape', { exact: true })).toBeVisible();
    await screen.getByRole('spinbutton', { name: 'Scale' }).fill('4');
    await screen.getByRole('textbox', { name: 'GEO JSON' }).fill('{"type":"Polygon"}');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.pathname).toBe(REGION_SET_SHAPES_PATH);
    expect(postCall?.body).toEqual({
      geo_json: '{"type":"Polygon"}',
      region_set_id: REGION_SET_ID,
      scale: 4,
    });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('does not create a shape when the scale is cleared', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new region set shape', { exact: true })).toBeVisible();
    const scaleInput = screen.getByRole('spinbutton', { name: 'Scale' });
    await scaleInput.fill('');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(scaleInput).toHaveAttribute('aria-invalid', 'true');
    expect(mock.calls.filter(({ method }) => method === 'POST')).toHaveLength(0);
  });

  it('edits a shape keeping it in the route region set via the region set shapes endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Alpha - 1', { exact: true })).toBeVisible();
    await screen.getByRole('spinbutton', { name: 'Scale' }).fill('5');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${REGION_SET_SHAPES_PATH}/shape-1`);
    expect(putCall?.body).toEqual(expect.objectContaining({
      id: 'shape-1',
      region_set_id: REGION_SET_ID,
      scale: 5,
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a shape via the region set shapes endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${REGION_SET_SHAPES_PATH}/shape-1`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });
});
