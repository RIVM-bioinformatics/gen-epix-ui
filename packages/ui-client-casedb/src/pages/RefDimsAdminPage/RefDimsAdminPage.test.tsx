import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import { container } from 'tsyringe';
import type {
  CaseDbApiPermission,
  CaseDbRefDim,
} from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbDimType,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { RefDimsAdminPage } from './RefDimsAdminPage';

const REF_DIMS_PATH = '/v1/ref_dims';
const ROUTE_PATH = '/management/reference-dimensions';
const URL = '/management/reference-dimensions';

const REF_DIM_PERMISSIONS: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.RefDimCrudCommand, permission_type: CaseDbPermissionType.CREATE },
  { command_name: CaseDbCommandName.RefDimCrudCommand, permission_type: CaseDbPermissionType.UPDATE },
  { command_name: CaseDbCommandName.RefDimCrudCommand, permission_type: CaseDbPermissionType.DELETE },
];

const REF_COL_READ_PERMISSION: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.RefColCrudCommand, permission_type: CaseDbPermissionType.READ },
];

const refDimAlphaFixture = {
  code: 'ALPHA',
  col_code_prefix: 'ALP',
  description: 'Alpha dimension',
  dim_type: CaseDbDimType.TEXT,
  id: 'ref-dim-alpha',
  label: 'Alpha label',
  rank: 1,
} as CaseDbRefDim;

const refDimBetaFixture = {
  code: 'BETA',
  col_code_prefix: 'BET',
  description: 'Beta dimension',
  dim_type: CaseDbDimType.NUMBER,
  id: 'ref-dim-beta',
  label: 'Beta label',
  rank: 2,
} as CaseDbRefDim;

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (
  initialItems: CaseDbRefDim[] = [refDimAlphaFixture, refDimBetaFixture],
  permissions: CaseDbApiPermission[] = [...REF_DIM_PERMISSIONS, ...REF_COL_READ_PERMISSION],
) => {
  const mock = mockCrudApi(REF_DIMS_PATH, initialItems as ({ id: string } & CaseDbRefDim)[]);
  const screen = await renderRoutedPage(
    <RefDimsAdminPage />, {
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

describe('RefDimsAdminPage', () => {
  it('lists the reference dimensions with their dimension type', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'ALPHA' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Beta label' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'NUMBER' })).toBeInTheDocument();
  });

  it('offers a manage reference columns sub page for each dimension when the user can read reference columns', async () => {
    const { screen } = await renderPage([refDimAlphaFixture]);

    await openRowActions(screen);
    await expect.element(screen.getByRole('menuitem', { name: 'Manage reference columns' })).toBeInTheDocument();
    await screen.getByRole('menuitem', { name: 'Manage reference columns' }).click();
  });

  it('hides the manage reference columns sub page without read permission on reference columns', async () => {
    const { screen } = await renderPage([refDimAlphaFixture], REF_DIM_PERMISSIONS);

    await openRowActions(screen);
    await expect.element(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('menuitem', { name: 'Manage reference columns' }).query()).toBeNull();
  });

  it('creates a reference dimension via the ref dims endpoint', async () => {
    const { mock, screen } = await renderPage([]);

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new reference dimension', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { name: 'Dimension type' }).click();
    await screen.getByRole('option', { name: 'GEO' }).click();
    await screen.getByRole('textbox', { name: 'Label' }).fill('Gamma label');
    await screen.getByRole('textbox', { name: 'Description' }).fill('Gamma description');
    await screen.getByRole('textbox', { name: 'Code' }).fill('GAMMA');
    await screen.getByRole('textbox', { name: 'Column code prefix' }).fill('GAM');
    await screen.getByRole('spinbutton', { name: 'Rank' }).fill('3');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.pathname).toBe(REF_DIMS_PATH);
    expect(postCall?.body).toEqual(expect.objectContaining({
      code: 'GAMMA',
      col_code_prefix: 'GAM',
      description: 'Gamma description',
      dim_type: CaseDbDimType.GEO,
      label: 'Gamma label',
      rank: 3,
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a reference dimension via the ref dims endpoint with the dimension type locked', async () => {
    const { mock, screen } = await renderPage([refDimAlphaFixture]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Alpha label', { exact: true })).toBeVisible();
    await expect.element(screen.getByRole('combobox', { name: 'Dimension type' })).toBeDisabled();
    await screen.getByRole('textbox', { name: 'Label' }).fill('Alpha renamed');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${REF_DIMS_PATH}/ref-dim-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ id: 'ref-dim-alpha', label: 'Alpha renamed' }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a reference dimension via the ref dims endpoint', async () => {
    const { mock, screen } = await renderPage([refDimAlphaFixture]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${REF_DIMS_PATH}/ref-dim-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([refDimAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'ALPHA' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });
});
