import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import { container } from 'tsyringe';
import type {
  CaseDbApiPermission,
  CaseDbCaseType,
  CaseDbCol,
  CaseDbColSet,
  CaseDbColSetMember,
  CaseDbDim,
} from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockApiRequest,
  mockCrudApi,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { ColSetsAdminPage } from './ColSetsAdminPage';

type ColSetFixture = { readonly id: string } & CaseDbColSet;

type ColsPutCall = {
  readonly body: { readonly col_set_members: readonly CaseDbColSetMember[] };
  readonly pathname: string;
};

const COL_SETS_PATH = '/v1/col_sets';
const COL_SET_MEMBERS_PATH = '/v1/col_set_members';
const COLS_PATH = '/v1/cols';
const CASE_TYPES_PATH = '/v1/case_types';
const DIMS_PATH = '/v1/dims';
const ROUTE_PATH = '/management/col-sets';
const URL = '/management/col-sets';

const COL_SET_PERMISSIONS: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.ColSetCrudCommand, permission_type: CaseDbPermissionType.CREATE },
  { command_name: CaseDbCommandName.ColSetCrudCommand, permission_type: CaseDbPermissionType.UPDATE },
  { command_name: CaseDbCommandName.ColSetCrudCommand, permission_type: CaseDbPermissionType.DELETE },
  { command_name: CaseDbCommandName.ColSetColUpdateAssociationCommand, permission_type: CaseDbPermissionType.EXECUTE },
];

const COL_ONE_ID = '11111111-1111-4111-8111-111111111111';
const COL_TWO_ID = '22222222-2222-4222-8222-222222222222';
const COL_THREE_ID = '33333333-3333-4333-8333-333333333333';

const caseTypeFixture = {
  code: 'case-type-code',
  id: 'case-type-one',
  name: 'Case type one',
} as CaseDbCaseType;

const dimFixture = {
  code: 'dim-code',
  id: 'dim-one',
  label: 'Dim one',
  rank: 1,
} as CaseDbDim;

const colOneFixture: CaseDbCol = {
  case_type_id: 'case-type-one',
  code: 'col-one',
  dim_id: 'dim-one',
  id: COL_ONE_ID,
  label: 'Label A',
  rank: 1,
  ref_col_id: 'ref-col-one',
};

const colTwoFixture: CaseDbCol = {
  case_type_id: 'case-type-one',
  code: 'col-two',
  dim_id: 'dim-one',
  id: COL_TWO_ID,
  label: 'Label B',
  rank: 2,
  ref_col_id: 'ref-col-two',
};

const colThreeFixture: CaseDbCol = {
  case_type_id: 'case-type-one',
  code: 'col-three',
  dim_id: 'dim-one',
  id: COL_THREE_ID,
  label: 'Label C',
  rank: 3,
  ref_col_id: 'ref-col-three',
};

const COLS = [colOneFixture, colTwoFixture, colThreeFixture];

const colSetAlphaFixture: ColSetFixture = {
  description: 'Alpha description',
  id: 'set-alpha',
  name: 'Alpha set',
};

const colSetBetaFixture: ColSetFixture = {
  description: null,
  id: 'set-beta',
  name: 'Beta set',
};

const MEMBERS: CaseDbColSetMember[] = [
  { col_id: COL_ONE_ID, col_set_id: 'set-alpha' },
  { col_id: COL_TWO_ID, col_set_id: 'set-alpha' },
];

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (initialItems: ColSetFixture[] = [colSetAlphaFixture, colSetBetaFixture], permissions = COL_SET_PERMISSIONS, membershipsGate?: Promise<void>, membershipsFail = false) => {
  const mock = mockCrudApi(COL_SETS_PATH, initialItems);
  const colsPuts: ColsPutCall[] = [];
  mockApiRequest('GET', COLS_PATH, () => Response.json(COLS));
  mockApiRequest('GET', CASE_TYPES_PATH, () => Response.json([caseTypeFixture]));
  mockApiRequest('GET', DIMS_PATH, () => Response.json([dimFixture]));
  mockApiRequest('GET', COL_SET_MEMBERS_PATH, async () => {
    await membershipsGate;
    return membershipsFail ? new Response(null, { status: 500 }) : Response.json(MEMBERS);
  });
  for (const id of ['set-alpha', 'set-beta', 'created-3']) {
    const pathname = `${COL_SETS_PATH}/${id}/cols`;
    mockApiRequest('PUT', pathname, async (request) => {
      const body = (await request.json()) as ColsPutCall['body'];
      colsPuts.push({ body, pathname });
      return Response.json({});
    });
  }
  const screen = await renderRoutedPage(
    <ColSetsAdminPage />, {
      path: ROUTE_PATH,
      permissions: permissions as CommonDbApiPermission[],
      url: URL,
    },
  );
  return { colsPuts, mock, screen };
};

const openRowActions = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

describe('ColSetsAdminPage', () => {
  it('lists the column sets with their column count', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alpha set' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Beta set' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: '2 / 3' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: '0 / 3' })).toBeInTheDocument();
  });

  it('renders no rows until the column set memberships have loaded', async () => {
    let releaseMemberships: () => void = () => undefined;
    const membershipsGate = new Promise<void>((resolve) => {
      releaseMemberships = resolve;
    });
    const { screen } = await renderPage([colSetAlphaFixture, colSetBetaFixture], COL_SET_PERMISSIONS, membershipsGate);

    await expect.element(screen.getByRole('button', { name: 'Create item' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('cell', { exact: true, name: 'Alpha set' }).query()).toBeNull();

    releaseMemberships();

    await expect.element(screen.getByRole('cell', { exact: true, name: '2 / 3' })).toBeInTheDocument();
  });

  it('shows an error and no rows when the column set memberships fail to load', async () => {
    const { screen } = await renderPage([colSetAlphaFixture, colSetBetaFixture], COL_SET_PERMISSIONS, undefined, true);

    await expect.element(screen.getByText('Sorry, an unexpected error has occurred.')).toBeInTheDocument();
    await expect.element(screen.getByText('Error message: Request failed with status code 500', { exact: false })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('cell', { exact: true, name: 'Alpha set' }).query()).toBeNull();
  });

  it('creates a column set and synchronizes its selected columns', async () => {
    const { colsPuts, mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new column set', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Gamma set');
    await screen.getByRole('textbox', { name: 'Description' }).fill('Gamma description');
    await screen.getByText('Case type one -> Dim one -> Label C', { exact: true }).click();
    await screen.getByRole('button', { name: 'move selected right' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.pathname).toBe(COL_SETS_PATH);
    expect(postCall?.body).toEqual(expect.objectContaining({ description: 'Gamma description', name: 'Gamma set' }));
    expect(postCall?.body).not.toHaveProperty('colIds');

    await expect.poll(() => colsPuts.length).toBe(1);
    expect(colsPuts[0]?.pathname).toBe(`${COL_SETS_PATH}/created-3/cols`);
    expect(colsPuts[0]?.body).toEqual({
      col_set_members: [{ col_id: COL_THREE_ID, col_set_id: 'created-3' }],
    });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('does not save a column set without any columns', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new column set', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Gamma set');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Create new column set', { exact: true })).toBeVisible();
    expect(mock.calls.filter(({ method }) => method === 'POST')).toHaveLength(0);
  });

  it('edits a column set and replaces its column membership', async () => {
    const { colsPuts, mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Alpha set', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Alpha renamed');
    await screen.getByText('Case type one -> Dim one -> Label A', { exact: true }).click();
    await screen.getByRole('button', { name: 'move selected left' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => colsPuts.length).toBe(1);
    expect(colsPuts[0]?.pathname).toBe(`${COL_SETS_PATH}/set-alpha/cols`);
    expect(colsPuts[0]?.body).toEqual({
      col_set_members: [{ col_id: COL_TWO_ID, col_set_id: 'set-alpha' }],
    });

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${COL_SETS_PATH}/set-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ id: 'set-alpha', name: 'Alpha renamed' }));
    expect(putCall?.body).not.toHaveProperty('colIds');
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a column set via the column sets endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${COL_SETS_PATH}/set-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });
});
