import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  CaseDbApiPermission,
  CaseDbCaseType,
  CaseDbDim,
  CaseDbRefDim,
} from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { DimsAdminPage } from './DimsAdminPage';

type CaseTypeFixture = { readonly id: string } & CaseDbCaseType;
type DimFixture = { readonly id: string } & CaseDbDim;
type RefDimFixture = { readonly id: string } & CaseDbRefDim;

const CASE_TYPES_PATH = '/v1/case_types';
const DIMS_PATH = '/v1/dims';
const REF_DIMS_PATH = '/v1/ref_dims';
const ROUTE_PATH_ALL = '/management/dimensions';
const ROUTE_PATH_CASE_TYPE = '/management/case-types/:caseTypeId/dimensions';

const CASE_TYPE_MEASLES_ID = '5c1d6f2e-7a3b-4c8d-9e0f-1a2b3c4d5e6f';
const CASE_TYPE_TUBERCULOSIS_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
const CASE_TYPE_UNKNOWN_ID = '0d1e2f3a-4b5c-4d6e-8f70-819293a4b5c6';
const REF_DIM_DATE_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';
const REF_DIM_HOST_ID = '7c9e6679-7425-40de-944b-e07fc1f90ae7';
const DIM_ONSET_MEASLES_ID = '9b2e3c4d-1a2b-4c3d-8e4f-5a6b7c8d9e0f';
const DIM_HOST_MEASLES_ID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
const DIM_ONSET_TUBERCULOSIS_ID = 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e';

const ALL_DIM_PERMISSIONS: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.DimCrudCommand, permission_type: CaseDbPermissionType.CREATE },
  { command_name: CaseDbCommandName.DimCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.DimCrudCommand, permission_type: CaseDbPermissionType.UPDATE },
  { command_name: CaseDbCommandName.DimCrudCommand, permission_type: CaseDbPermissionType.DELETE },
];

const REF_COLUMN_READ_PERMISSION: CaseDbApiPermission = {
  command_name: CaseDbCommandName.RefColCrudCommand,
  permission_type: CaseDbPermissionType.READ,
};

const caseTypeMeaslesFixture: CaseTypeFixture = {
  description: null,
  disease_id: null,
  etiological_agent_id: null,
  id: CASE_TYPE_MEASLES_ID,
  name: 'Measles case type',
  props: {
    create_max_n_cases: 1,
    delete_max_n_cases: 2,
    read_max_n_cases: 3,
    read_max_tree_size: 4,
    update_max_n_cases: 5,
  },
};

const caseTypeTuberculosisFixture: CaseTypeFixture = {
  description: null,
  disease_id: null,
  etiological_agent_id: null,
  id: CASE_TYPE_TUBERCULOSIS_ID,
  name: 'Tuberculosis case type',
  props: {
    create_max_n_cases: 11,
    delete_max_n_cases: 12,
    read_max_n_cases: 13,
    read_max_tree_size: 14,
    update_max_n_cases: 15,
  },
};

const refDimDateFixture: RefDimFixture = {
  code: 'DATE',
  dim_type: 'TIME',
  id: REF_DIM_DATE_ID,
  label: 'Date',
};

const refDimHostFixture: RefDimFixture = {
  code: 'HOST',
  dim_type: 'IDENTIFIER',
  id: REF_DIM_HOST_ID,
  label: 'Host type',
};

const dimOnsetMeaslesFixture: DimFixture = {
  case_type_id: CASE_TYPE_MEASLES_ID,
  code: 'ONSET',
  description: null,
  id: DIM_ONSET_MEASLES_ID,
  is_case_date_dim: true,
  label: 'Onset date',
  occurrence: 1,
  rank: 1,
  ref_dim_id: REF_DIM_DATE_ID,
};

const dimHostMeaslesFixture: DimFixture = {
  case_type_id: CASE_TYPE_MEASLES_ID,
  code: 'HOST',
  description: null,
  id: DIM_HOST_MEASLES_ID,
  is_case_date_dim: false,
  label: 'Host',
  occurrence: 1,
  rank: 2,
  ref_dim_id: REF_DIM_HOST_ID,
};

const dimOnsetTuberculosisFixture: DimFixture = {
  case_type_id: CASE_TYPE_TUBERCULOSIS_ID,
  code: 'ONSET',
  description: null,
  id: DIM_ONSET_TUBERCULOSIS_ID,
  is_case_date_dim: true,
  label: 'Onset',
  occurrence: 1,
  rank: 1,
  ref_dim_id: REF_DIM_DATE_ID,
};

const renderPage = async ({
  caseTypeId,
  initialItems = [dimOnsetMeaslesFixture, dimHostMeaslesFixture, dimOnsetTuberculosisFixture],
  permissions = ALL_DIM_PERMISSIONS,
}: {
  readonly caseTypeId?: string;
  readonly initialItems?: DimFixture[];
  readonly permissions?: CaseDbApiPermission[];
} = {}) => {
  const mock = mockCrudApi(DIMS_PATH, initialItems);
  mockApiRequest('GET', CASE_TYPES_PATH, () => Response.json([caseTypeMeaslesFixture, caseTypeTuberculosisFixture]));
  mockApiRequest('GET', REF_DIMS_PATH, () => Response.json([refDimDateFixture, refDimHostFixture]));
  const screen = await renderRoutedPage(
    <DimsAdminPage />, {
      path: caseTypeId ? ROUTE_PATH_CASE_TYPE : ROUTE_PATH_ALL,
      permissions: permissions as CommonDbApiPermission[],
      url: caseTypeId ? `/management/case-types/${caseTypeId}/dimensions` : ROUTE_PATH_ALL,
    },
  );
  return { mock, screen };
};

const openRowActions = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

describe('DimsAdminPage', () => {
  it('lists all dimensions with their case type and reference dimension when no case type is selected', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Measles case type' }).first()).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Tuberculosis case type' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Onset date' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Host type' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Onset' })).toBeInTheDocument();
  });

  it('scopes the dimensions to the case type in the route and hides the case type column', async () => {
    const { screen } = await renderPage({ caseTypeId: CASE_TYPE_MEASLES_ID });

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Onset date' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Host' })).toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: 'Create item' })).toBeEnabled();
    await expect.poll(() => screen.getByRole('cell', { exact: true, name: 'Onset' }).query()).toBeNull();
    await expect.poll(() => screen.getByRole('cell', { exact: true, name: 'Measles case type' }).query()).toBeNull();
  });

  it('shows no dimensions for an unknown case type', async () => {
    const { screen } = await renderPage({ caseTypeId: CASE_TYPE_UNKNOWN_ID });

    await expect.element(screen.getByRole('button', { name: 'Create item' })).toBeEnabled();
    await expect.poll(() => screen.getByRole('cell', { exact: true, name: 'Onset date' }).query()).toBeNull();
    await expect.poll(() => screen.getByRole('cell', { exact: true, name: 'Host' }).query()).toBeNull();
  });

  it('opens the create dialog with the case type selectable', async () => {
    const { screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new dimensions', { exact: true })).toBeVisible();
    await screen.getByRole('combobox', { name: 'Case type' }).click();
    await screen.getByRole('option', { exact: true, name: 'Measles case type' }).click();
    await expect.element(screen.getByRole('combobox', { name: 'Case type' })).toHaveValue('Measles case type');
  });

  it('prefills the case type from the route when creating a dimension', async () => {
    const { screen } = await renderPage({ caseTypeId: CASE_TYPE_TUBERCULOSIS_ID });

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new dimensions', { exact: true })).toBeVisible();
    await expect.element(screen.getByRole('combobox', { name: 'Case type' })).toHaveValue('Tuberculosis case type');
    await expect.element(screen.getByRole('combobox', { name: 'Reference dimension' })).toHaveValue('');
  });

  it('opens the edit dialog prefilled with the selected dimension', async () => {
    const { screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Onset date', { exact: true })).toBeVisible();
    await expect.element(screen.getByRole('textbox', { name: 'Code' })).toHaveValue('ONSET');
    await expect.element(screen.getByRole('textbox', { name: 'Label' })).toHaveValue('Onset date');
    await expect.element(screen.getByRole('spinbutton', { name: 'Rank' })).toHaveValue(1);
  });


  it('deletes a dimension', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${DIMS_PATH}/${DIM_ONSET_MEASLES_ID}`);
  });

  it('shows the manage columns sub page under the dimensions route when the user may read reference columns', async () => {
    const { screen } = await renderPage({ permissions: [...ALL_DIM_PERMISSIONS, REF_COLUMN_READ_PERMISSION] });

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Manage columns' }).click();

    await expect.poll(() => window.location.pathname).toBe(`/management/dimensions/${DIM_ONSET_MEASLES_ID}/columns`);
  });

  it('shows the manage columns sub page under the case type when scoped to a case type', async () => {
    const { screen } = await renderPage({
      caseTypeId: CASE_TYPE_MEASLES_ID,
      permissions: [...ALL_DIM_PERMISSIONS, REF_COLUMN_READ_PERMISSION],
    });

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Manage columns' }).click();

    await expect.poll(() => window.location.pathname).toBe(`/management/case-types/${CASE_TYPE_MEASLES_ID}/dimensions/${DIM_ONSET_MEASLES_ID}/columns`);
  });

  it('hides the manage columns sub page without reference column read permission', async () => {
    const { screen } = await renderPage();

    await openRowActions(screen);
    await expect.element(screen.getByRole('menuitem', { name: 'Edit' })).toBeVisible();
    await expect.poll(() => screen.getByRole('menuitem', { name: 'Manage columns' }).query()).toBeNull();
  });
});
