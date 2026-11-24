import {
  describe,
  expect,
  it,
} from 'vitest';
import { userEvent } from 'vitest/browser';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import type {
  CaseDbApiPermission,
  CaseDbCol,
  CaseDbDim,
  CaseDbRefCol,
  CaseDbRefDim,
} from '@gen-epix/api-casedb';
import {
  CaseDbColType,
  CaseDbCommandName,
  CaseDbDimType,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { ColsAdminPage } from './ColsAdminPage';

type ColFixture = { readonly id: string } & CaseDbCol;

type RenderOptions = {
  readonly cols?: ColFixture[];
  readonly path?: string;
  readonly permissions?: CaseDbApiPermission[];
  readonly url?: string;
  readonly validationRules?: object;
};

const COLS_PATH = '/v1/cols';
const CASE_TYPES_PATH = '/v1/case_types';
const DIMS_PATH = '/v1/dims';
const REF_DIMS_PATH = '/v1/ref_dims';
const REF_COLS_PATH = '/v1/ref_cols';
const VALIDATION_RULES_PATH = '/v1/ref_cols/validation_rules';
const ROUTE_PATH_ALL = '/management/columns';
const ROUTE_PATH_DIM = '/management/dimensions/:dimId/columns';
const ROUTE_PATH_CASE_TYPE_DIM = '/management/case-types/:caseTypeId/dimensions/:dimId/columns';
const ROUTE_PATH_CASE_TYPE = '/management/case-types/:caseTypeId/columns';

const CASE_TYPE_ONE_ID = '10000000-0000-4000-8000-000000000001';
const CASE_TYPE_TWO_ID = '10000000-0000-4000-8000-000000000002';
const CASE_TYPE_THREE_ID = '10000000-0000-4000-8000-000000000003';
const DIM_ONE_ID = '20000000-0000-4000-8000-000000000001';
const DIM_TWO_ID = '20000000-0000-4000-8000-000000000002';
const DIM_THREE_ID = '20000000-0000-4000-8000-000000000003';
const DIM_BROKEN_ID = '20000000-0000-4000-8000-000000000004';
const UNKNOWN_DIM_ID = '20000000-0000-4000-8000-000000000009';
const REF_DIM_TEXT_ID = '30000000-0000-4000-8000-000000000001';
const REF_DIM_NUMBER_ID = '30000000-0000-4000-8000-000000000002';
const REF_DIM_GEO_ID = '30000000-0000-4000-8000-000000000003';
const REF_DIM_MISSING_ID = '30000000-0000-4000-8000-000000000009';
const REF_COL_TEXT_ID = '40000000-0000-4000-8000-000000000001';
const REF_COL_GS_ID = '40000000-0000-4000-8000-000000000002';
const REF_COL_GD_ID = '40000000-0000-4000-8000-000000000003';
const REF_COL_NUMBER_ID = '40000000-0000-4000-8000-000000000004';
const COL_ONE_ID = '50000000-0000-4000-8000-000000000001';
const COL_TWO_ID = '50000000-0000-4000-8000-000000000002';
const COL_THREE_ID = '50000000-0000-4000-8000-000000000003';
const COL_FOUR_ID = '50000000-0000-4000-8000-000000000004';

const COL_PERMISSIONS: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.ColCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.ColCrudCommand, permission_type: CaseDbPermissionType.CREATE },
  { command_name: CaseDbCommandName.ColCrudCommand, permission_type: CaseDbPermissionType.UPDATE },
  { command_name: CaseDbCommandName.ColCrudCommand, permission_type: CaseDbPermissionType.DELETE },
  { command_name: CaseDbCommandName.DimCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.RefDimCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.RefColCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.TreeAlgorithmCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.CaseTypeCrudCommand, permission_type: CaseDbPermissionType.READ },
];

const CASE_TYPES = [
  { code: 'case-type-one-code', id: CASE_TYPE_ONE_ID, name: 'Case type one' },
  { code: 'case-type-two-code', id: CASE_TYPE_TWO_ID, name: 'Case type two' },
  { code: 'case-type-three-code', id: CASE_TYPE_THREE_ID, name: 'Case type three' },
];

const DIMS = [
  { case_type_id: CASE_TYPE_ONE_ID, code: 'dim-one-code', id: DIM_ONE_ID, label: 'Dim one', rank: 1, ref_dim_id: REF_DIM_TEXT_ID },
  { case_type_id: CASE_TYPE_ONE_ID, code: 'dim-three-code', id: DIM_THREE_ID, label: 'Dim three', rank: 3, ref_dim_id: REF_DIM_NUMBER_ID },
  { case_type_id: CASE_TYPE_ONE_ID, code: 'dim-broken-code', id: DIM_BROKEN_ID, label: 'Dim broken', rank: 4, ref_dim_id: REF_DIM_MISSING_ID },
  { case_type_id: CASE_TYPE_TWO_ID, code: 'dim-two-code', id: DIM_TWO_ID, label: 'Dim two', rank: 2, ref_dim_id: REF_DIM_GEO_ID },
] as CaseDbDim[];

const REF_DIMS = [
  { code: 'ref-dim-text', dim_type: CaseDbDimType.TEXT, id: REF_DIM_TEXT_ID, label: 'Ref dim text' },
  { code: 'ref-dim-number', dim_type: CaseDbDimType.NUMBER, id: REF_DIM_NUMBER_ID, label: 'Ref dim number' },
  { code: 'ref-dim-geo', dim_type: CaseDbDimType.GEO, id: REF_DIM_GEO_ID, label: 'Ref dim geo' },
] as CaseDbRefDim[];

const REF_COLS = [
  { code: 'ref-col-text', col_type: CaseDbColType.TEXT, id: REF_COL_TEXT_ID, label: 'Ref col text', rank: 1, ref_dim_id: REF_DIM_TEXT_ID },
  { code: 'ref-col-gs', col_type: CaseDbColType.GENETIC_SEQUENCE, id: REF_COL_GS_ID, label: 'Ref col gs', rank: 2, ref_dim_id: REF_DIM_TEXT_ID },
  { code: 'ref-col-gd', col_type: CaseDbColType.GENETIC_DISTANCE, id: REF_COL_GD_ID, label: 'Ref col gd', rank: 3, ref_dim_id: REF_DIM_TEXT_ID },
  { code: 'ref-col-number', col_type: CaseDbColType.DECIMAL_0, id: REF_COL_NUMBER_ID, label: 'Ref col number', rank: 4, ref_dim_id: REF_DIM_NUMBER_ID },
] as CaseDbRefCol[];

const VALIDATION_RULES = {
  valid_col_types_by_dim_type: {
    NUMBER: [CaseDbColType.DECIMAL_0],
    TEXT: [CaseDbColType.TEXT, CaseDbColType.GENETIC_SEQUENCE, CaseDbColType.GENETIC_DISTANCE],
  },
};

const COLS: ColFixture[] = [
  {
    case_type_id: CASE_TYPE_ONE_ID,
    code: 'col-one',
    dim_id: DIM_ONE_ID,
    id: COL_ONE_ID,
    label: 'Label A',
    rank: 1,
    ref_col_id: REF_COL_TEXT_ID,
  },
  {
    case_type_id: CASE_TYPE_ONE_ID,
    code: 'col-two',
    dim_id: DIM_ONE_ID,
    id: COL_TWO_ID,
    label: 'Label B',
    rank: 2,
    ref_col_id: REF_COL_GS_ID,
  },
  {
    case_type_id: CASE_TYPE_TWO_ID,
    code: 'col-three',
    dim_id: DIM_TWO_ID,
    id: COL_THREE_ID,
    label: 'Label C',
    rank: 3,
    ref_col_id: REF_COL_GS_ID,
  },
];

const EXTRA_GS_COL: ColFixture = {
  case_type_id: CASE_TYPE_TWO_ID,
  code: 'col-four',
  dim_id: DIM_TWO_ID,
  id: COL_FOUR_ID,
  label: 'Label D',
  rank: 4,
  ref_col_id: REF_COL_GS_ID,
};

const renderPage = async ({
  cols = COLS,
  path = ROUTE_PATH_ALL,
  permissions = COL_PERMISSIONS,
  url = ROUTE_PATH_ALL,
  validationRules = VALIDATION_RULES,
}: RenderOptions = {}) => {
  const mock = mockCrudApi(COLS_PATH, cols);
  mockApiRequest('GET', CASE_TYPES_PATH, () => Response.json(CASE_TYPES));
  mockApiRequest('GET', DIMS_PATH, () => Response.json(DIMS));
  mockApiRequest('GET', REF_DIMS_PATH, () => Response.json(REF_DIMS));
  mockApiRequest('GET', REF_COLS_PATH, () => Response.json(REF_COLS));
  mockApiRequest('GET', VALIDATION_RULES_PATH, () => Response.json(validationRules));
  const screen = await renderRoutedPage(
    <ColsAdminPage />, {
      path,
      permissions: permissions as CommonDbApiPermission[],
      url,
    },
  );
  return { mock, screen };
};

const openCreateDialog = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Create item' }).click();
  await expect.element(screen.getByText('Create new column', { exact: true })).toBeVisible();
};

const selectAutocompleteOption = async (screen: Awaited<ReturnType<typeof renderPage>>['screen'], fieldName: string, optionLabel: string) => {
  await screen.getByRole('combobox', { exact: true, name: fieldName }).click();
  await screen.getByRole('option', { exact: true, name: optionLabel }).click();
};

const getColumnHeader = (screen: Awaited<ReturnType<typeof renderPage>>['screen'], label: string) => {
  return screen.getByRole('columnheader', { name: new RegExp(`^${label}\\b`) });
};

const waitForFormChangeDebounce = async () => {
  // Wait past the form change debounce so onFormChange has run before asserting.
  await new Promise((resolve) => {
    setTimeout(resolve, 700);
  });
};

const openFirstRowActions = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

describe('ColsAdminPage', () => {
  it('lists all columns with case type and dimension columns on the global route', async () => {
    const { screen } = await renderPage();

    await expect.element(getColumnHeader(screen, 'Case type')).toBeInTheDocument();
    await expect.element(getColumnHeader(screen, 'Dimension')).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'col-one' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'col-three' })).toBeInTheDocument();
  });

  it('hides the dimension column and only lists the columns of the dimension', async () => {
    const { screen } = await renderPage({
      path: ROUTE_PATH_DIM,
      url: `/management/dimensions/${DIM_ONE_ID}/columns`,
    });

    await expect.element(getColumnHeader(screen, 'Case type')).toBeInTheDocument();
    await expect.element(getColumnHeader(screen, 'Dimension')).not.toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'col-one' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'col-two' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('cell', { exact: true, name: 'col-three' }).query()).toBeNull();
  });

  it('hides the case type and dimension columns on the case type dimension route', async () => {
    const { screen } = await renderPage({
      path: ROUTE_PATH_CASE_TYPE_DIM,
      url: `/management/case-types/${CASE_TYPE_ONE_ID}/dimensions/${DIM_ONE_ID}/columns`,
    });

    await expect.element(screen.getByRole('heading', { name: /^Case type one -> Dim one -> Columns/ })).toBeInTheDocument();
    await expect.element(getColumnHeader(screen, 'Case type')).not.toBeInTheDocument();
    await expect.element(getColumnHeader(screen, 'Dimension')).not.toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'col-one' })).toBeInTheDocument();
  });

  it('hides the case type column and lists the columns of the case type on the case type route', async () => {
    const { screen } = await renderPage({
      path: ROUTE_PATH_CASE_TYPE,
      url: `/management/case-types/${CASE_TYPE_ONE_ID}/columns`,
    });

    await expect.element(screen.getByRole('heading', { name: /^Case type one -> Columns/ })).toBeInTheDocument();
    await expect.element(getColumnHeader(screen, 'Case type')).not.toBeInTheDocument();
    await expect.element(getColumnHeader(screen, 'Dimension')).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'col-one' })).toBeInTheDocument();
  });

  it('lists no columns for an unknown dimension', async () => {
    const { screen } = await renderPage({
      path: ROUTE_PATH_DIM,
      url: `/management/dimensions/${UNKNOWN_DIM_ID}/columns`,
    });

    await expect.element(getColumnHeader(screen, 'Case type')).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('cell', { exact: true, name: 'col-one' }).query()).toBeNull();
    await expect.poll(() => screen.getByRole('cell', { exact: true, name: 'col-three' }).query()).toBeNull();
  });

  it('creates a column with a reference column that needs no genetic distance fields', async () => {
    const { mock, screen } = await renderPage();

    await openCreateDialog(screen);
    await selectAutocompleteOption(screen, 'Case type', 'Case type one');
    await selectAutocompleteOption(screen, 'Dimension', 'Case type one -> Dim one');
    await selectAutocompleteOption(screen, 'Reference column', 'Ref col text');
    await screen.getByRole('textbox', { exact: true, name: 'Code' }).fill('col-new');
    await screen.getByRole('textbox', { exact: true, name: 'Label' }).fill('Label new');
    await screen.getByRole('textbox', { exact: true, name: 'Rank' }).fill('4');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.pathname).toBe(COLS_PATH);
    expect(postCall?.body).toEqual(expect.objectContaining({
      case_type_id: CASE_TYPE_ONE_ID,
      code: 'col-new',
      dim_id: DIM_ONE_ID,
      label: 'Label new',
      ref_col_id: REF_COL_TEXT_ID,
    }));
  }, 60000);

  it('does not save a genetic distance column without its required genetic distance fields', async () => {
    const { mock, screen } = await renderPage();

    await openCreateDialog(screen);
    await selectAutocompleteOption(screen, 'Case type', 'Case type one');
    await selectAutocompleteOption(screen, 'Dimension', 'Case type one -> Dim one');
    await selectAutocompleteOption(screen, 'Reference column', 'Ref col gd');
    await screen.getByRole('textbox', { exact: true, name: 'Code' }).fill('col-gd');
    await screen.getByRole('textbox', { exact: true, name: 'Label' }).fill('Label gd');
    await screen.getByRole('textbox', { exact: true, name: 'Rank' }).fill('4');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new column', { exact: true })).toBeVisible();
    expect(mock.calls.filter(({ method }) => method === 'POST')).toHaveLength(0);
  });

  it('clears the dimension when the case type changes to one without that dimension', async () => {
    const { screen } = await renderPage();

    await openCreateDialog(screen);
    await selectAutocompleteOption(screen, 'Case type', 'Case type one');
    await selectAutocompleteOption(screen, 'Dimension', 'Case type one -> Dim one');
    await selectAutocompleteOption(screen, 'Case type', 'Case type two');
    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Dimension' })).toHaveValue('Case type two -> Dim two');

    await selectAutocompleteOption(screen, 'Case type', 'Case type three');
    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Dimension' })).toHaveValue('');
  });

  it('replaces the reference column when the dimension changes to one that does not accept it', async () => {
    const { mock, screen } = await renderPage();

    await openCreateDialog(screen);
    await selectAutocompleteOption(screen, 'Case type', 'Case type one');
    await selectAutocompleteOption(screen, 'Dimension', 'Case type one -> Dim one');
    await selectAutocompleteOption(screen, 'Reference column', 'Ref col text');
    await selectAutocompleteOption(screen, 'Dimension', 'Case type one -> Dim three');
    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Reference column' }), { timeout: 3000 }).toHaveValue('Ref col number');
    await screen.getByRole('textbox', { exact: true, name: 'Code' }).fill('col-new');
    await screen.getByRole('textbox', { exact: true, name: 'Label' }).fill('Label new');
    await screen.getByRole('textbox', { exact: true, name: 'Rank' }).fill('4');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'POST')?.body).toEqual(expect.objectContaining({
      dim_id: DIM_THREE_ID,
      ref_col_id: REF_COL_NUMBER_ID,
    }));
  });

  it('resets the genetic sequence column when the case type changes', async () => {
    const { screen } = await renderPage();

    await openCreateDialog(screen);
    await selectAutocompleteOption(screen, 'Case type', 'Case type one');
    await screen.getByRole('combobox', { exact: true, name: 'Genetic sequence column' }).click();
    await screen.getByRole('option', { exact: true, name: 'Case type one -> Dim one -> Label B' }).click();
    await selectAutocompleteOption(screen, 'Case type', 'Case type two');
    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Genetic sequence column' })).toHaveTextContent('Case type two -> Dim two -> Label C');

    await selectAutocompleteOption(screen, 'Case type', 'Case type three');
    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Genetic sequence column' })).not.toHaveTextContent('Label C');
  });

  it('edits the label of a column and keeps its references', async () => {
    const { mock, screen } = await renderPage({
      path: ROUTE_PATH_DIM,
      url: `/management/dimensions/${DIM_ONE_ID}/columns`,
    });

    await openFirstRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Label A', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { exact: true, name: 'Label' }).fill('Label A renamed');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${COLS_PATH}/${COL_ONE_ID}`);
    expect(putCall?.body).toEqual(expect.objectContaining({
      dim_id: DIM_ONE_ID,
      id: COL_ONE_ID,
      label: 'Label A renamed',
      ref_col_id: REF_COL_TEXT_ID,
    }));
  });

  it('deletes a column via the cols endpoint', async () => {
    const { mock, screen } = await renderPage({
      path: ROUTE_PATH_DIM,
      url: `/management/dimensions/${DIM_ONE_ID}/columns`,
    });

    await openFirstRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${COLS_PATH}/${COL_ONE_ID}`);
  });

  it('offers no reference columns when the validation rules define no column types', async () => {
    const { screen } = await renderPage({ validationRules: {} });

    await openCreateDialog(screen);
    await selectAutocompleteOption(screen, 'Case type', 'Case type one');
    await selectAutocompleteOption(screen, 'Dimension', 'Case type one -> Dim one');
    await screen.getByRole('combobox', { exact: true, name: 'Reference column' }).click();

    await expect.poll(() => screen.getByRole('option', { exact: true, name: 'Ref col text' }).query()).toBeNull();
  });

  it('keeps a reference column that is still valid for the selected dimension', async () => {
    const { screen } = await renderPage();

    await openCreateDialog(screen);
    await selectAutocompleteOption(screen, 'Case type', 'Case type one');
    await selectAutocompleteOption(screen, 'Dimension', 'Case type one -> Dim one');
    await selectAutocompleteOption(screen, 'Reference column', 'Ref col text');
    await screen.getByRole('textbox', { exact: true, name: 'Code' }).fill('col-new');
    await waitForFormChangeDebounce();

    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Reference column' })).toHaveValue('Ref col text');
  });

  it('clears the reference column when the dimension changes and the reference column no longer fits', async () => {
    const { screen } = await renderPage();

    await openCreateDialog(screen);
    await selectAutocompleteOption(screen, 'Case type', 'Case type one');
    await selectAutocompleteOption(screen, 'Dimension', 'Case type one -> Dim one');
    await selectAutocompleteOption(screen, 'Reference column', 'Ref col text');
    await selectAutocompleteOption(screen, 'Dimension', 'Case type one -> Dim three');
    await waitForFormChangeDebounce();
    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Reference column' })).toHaveValue('Ref col number');
    await selectAutocompleteOption(screen, 'Dimension', 'Case type one -> Dim one');
    await waitForFormChangeDebounce();

    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Reference column' })).toHaveValue('');
  });

  it('keeps a genetic sequence column that is still valid after the dimension changes', async () => {
    const { screen } = await renderPage();

    await openCreateDialog(screen);
    await selectAutocompleteOption(screen, 'Case type', 'Case type one');
    await screen.getByRole('combobox', { exact: true, name: 'Genetic sequence column' }).click();
    await screen.getByRole('option', { exact: true, name: 'Case type one -> Dim one -> Label B' }).click();
    await selectAutocompleteOption(screen, 'Dimension', 'Case type one -> Dim three');
    await waitForFormChangeDebounce();

    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Genetic sequence column' })).toHaveTextContent('Case type one -> Dim one -> Label B');
  });

  it('saves a genetic distance column with a valid NCBI TaxID', async () => {
    const { mock, screen } = await renderPage();

    await openCreateDialog(screen);
    await selectAutocompleteOption(screen, 'Case type', 'Case type one');
    await selectAutocompleteOption(screen, 'Dimension', 'Case type one -> Dim one');
    await selectAutocompleteOption(screen, 'Reference column', 'Ref col gd');
    await screen.getByRole('textbox', { exact: true, name: 'Code' }).fill('col-gd');
    await screen.getByRole('textbox', { exact: true, name: 'Label' }).fill('Label gd');
    await screen.getByRole('textbox', { exact: true, name: 'Rank' }).fill('4');
    await screen.getByRole('combobox', { exact: true, name: 'Genetic sequence column' }).click();
    await screen.getByRole('option', { exact: true, name: 'Case type one -> Dim one -> Label B' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Tree algorithm codes' }).click();
    await screen.getByRole('option', { exact: true, name: 'NJ' }).click();
    await userEvent.keyboard('{Escape}');
    await screen.getByRole('textbox', { exact: true, name: 'NCBI TaxID' }).fill('NCBI:txid123');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
  }, 60000);

  it('does not save a genetic distance column with an NCBI TaxID that has trailing characters', async () => {
    const { mock, screen } = await renderPage();

    await openCreateDialog(screen);
    await selectAutocompleteOption(screen, 'Case type', 'Case type one');
    await selectAutocompleteOption(screen, 'Dimension', 'Case type one -> Dim one');
    await selectAutocompleteOption(screen, 'Reference column', 'Ref col gd');
    await screen.getByRole('textbox', { exact: true, name: 'Code' }).fill('col-gd');
    await screen.getByRole('textbox', { exact: true, name: 'Label' }).fill('Label gd');
    await screen.getByRole('textbox', { exact: true, name: 'Rank' }).fill('4');
    await screen.getByRole('combobox', { exact: true, name: 'Genetic sequence column' }).click();
    await screen.getByRole('option', { exact: true, name: 'Case type one -> Dim one -> Label B' }).click();
    await screen.getByRole('combobox', { exact: true, name: 'Tree algorithm codes' }).click();
    await screen.getByRole('option', { exact: true, name: 'NJ' }).click();
    await userEvent.keyboard('{Escape}');
    await screen.getByRole('textbox', { exact: true, name: 'NCBI TaxID' }).fill('NCBI:txid123abc');
    await screen.getByRole('button', { name: 'Save' }).click();
    await waitForFormChangeDebounce();

    await expect.element(screen.getByText('Create new column', { exact: true })).toBeVisible();
    expect(mock.calls.filter(({ method }) => method === 'POST')).toHaveLength(0);
  }, 60000);

  it('clears the genetic sequence column when the case type changes to one with several genetic sequence columns', async () => {
    const { screen } = await renderPage({ cols: [...COLS, EXTRA_GS_COL] });

    await openCreateDialog(screen);
    await selectAutocompleteOption(screen, 'Case type', 'Case type one');
    await screen.getByRole('combobox', { exact: true, name: 'Genetic sequence column' }).click();
    await screen.getByRole('option', { exact: true, name: 'Case type one -> Dim one -> Label B' }).click();
    await selectAutocompleteOption(screen, 'Case type', 'Case type two');
    await waitForFormChangeDebounce();

    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Genetic sequence column' })).not.toHaveTextContent('Label B');
  }, 60000);
});
