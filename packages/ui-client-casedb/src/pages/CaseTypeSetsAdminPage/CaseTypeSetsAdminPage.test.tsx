import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type {
  CaseDbApiPermission,
  CaseDbCaseType,
  CaseDbCaseTypeSet,
  CaseDbCaseTypeSetCategory,
  CaseDbCaseTypeSetMember,
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

import { CaseTypeSetsAdminPage } from './CaseTypeSetsAdminPage';

type CaseTypeSetFixture = { readonly id: string } & CaseDbCaseTypeSet;

type MembershipPutCall = {
  readonly body: { readonly case_type_set_members: readonly CaseDbCaseTypeSetMember[] };
  readonly pathname: string;
};

const CASE_TYPE_SETS_PATH = '/v1/case_type_sets';
const CASE_TYPE_SET_CATEGORIES_PATH = '/v1/case_type_set_categories';
const CASE_TYPE_SET_MEMBERS_PATH = '/v1/case_type_set_members';
const CASE_TYPES_PATH = '/v1/case_types';
const ROUTE_PATH = '/management/case-type-sets';
const URL = '/management/case-type-sets';

const CASE_TYPE_SET_PERMISSIONS: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.CaseTypeSetCrudCommand, permission_type: CaseDbPermissionType.CREATE },
  { command_name: CaseDbCommandName.CaseTypeSetCrudCommand, permission_type: CaseDbPermissionType.UPDATE },
  { command_name: CaseDbCommandName.CaseTypeSetCrudCommand, permission_type: CaseDbPermissionType.DELETE },
  { command_name: CaseDbCommandName.CaseTypeSetCaseTypeUpdateAssociationCommand, permission_type: CaseDbPermissionType.EXECUTE },
];

const CATEGORY_CONTENT_ID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
const CATEGORY_SECURITY_ID = '3f2504e0-4f89-41d3-9a0c-0305e82c3301';

const categoryContentFixture: { readonly id: string } & CaseDbCaseTypeSetCategory = {
  description: null,
  id: CATEGORY_CONTENT_ID,
  name: 'Content',
  purpose: 'CONTENT',
  rank: 1,
};

const categorySecurityFixture: { readonly id: string } & CaseDbCaseTypeSetCategory = {
  description: null,
  id: CATEGORY_SECURITY_ID,
  name: 'Security',
  purpose: 'SECURITY',
  rank: 2,
};

const caseTypeOneFixture: { readonly id: string } & CaseDbCaseType = {
  id: 'case-type-one',
  name: 'Case type one',
};

const caseTypeTwoFixture: { readonly id: string } & CaseDbCaseType = {
  id: 'case-type-two',
  name: 'Case type two',
};

const caseTypeThreeFixture: { readonly id: string } & CaseDbCaseType = {
  id: 'case-type-three',
  name: 'Case type three',
};

const CASE_TYPES = [caseTypeOneFixture, caseTypeTwoFixture, caseTypeThreeFixture];

const setAlphaFixture: CaseTypeSetFixture = {
  case_type_set_category_id: CATEGORY_CONTENT_ID,
  description: 'Alpha description',
  id: 'set-alpha',
  name: 'Alpha set',
  rank: 1,
};

const setBetaFixture: CaseTypeSetFixture = {
  case_type_set_category_id: CATEGORY_SECURITY_ID,
  description: null,
  id: 'set-beta',
  name: 'Beta set',
  rank: 2,
};

const MEMBERSHIPS: CaseDbCaseTypeSetMember[] = [
  { case_type_id: 'case-type-one', case_type_set_id: 'set-alpha' },
  { case_type_id: 'case-type-two', case_type_set_id: 'set-alpha' },
];

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (initialItems: CaseTypeSetFixture[] = [setAlphaFixture, setBetaFixture], permissions = CASE_TYPE_SET_PERMISSIONS, membershipsGate?: Promise<void>) => {
  const mock = mockCrudApi(CASE_TYPE_SETS_PATH, initialItems);
  const membershipPuts: MembershipPutCall[] = [];
  mockApiRequest('GET', CASE_TYPE_SET_CATEGORIES_PATH, () => Response.json([categoryContentFixture, categorySecurityFixture]));
  mockApiRequest('GET', CASE_TYPES_PATH, () => Response.json(CASE_TYPES));
  mockApiRequest('GET', CASE_TYPE_SET_MEMBERS_PATH, async () => {
    await membershipsGate;
    return Response.json(MEMBERSHIPS);
  });
  for (const id of ['set-alpha', 'set-beta', 'created-3']) {
    const pathname = `${CASE_TYPE_SETS_PATH}/${id}/case_types`;
    mockApiRequest('PUT', pathname, async (request) => {
      membershipPuts.push({ body: await request.json(), pathname });
      return Response.json({});
    });
  }
  const screen = await renderRoutedPage(
    <CaseTypeSetsAdminPage />, {
      path: ROUTE_PATH,
      permissions,
      url: URL,
    },
  );
  return { membershipPuts, mock, screen };
};

const openRowActions = async (screen: Awaited<ReturnType<typeof renderPage>>['screen']) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

describe('CaseTypeSetsAdminPage', () => {
  it('lists the case type sets with their category and case type count', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { name: 'Alpha set', exact: true })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { name: 'Beta set', exact: true })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { name: 'Content', exact: true })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { name: 'Security', exact: true })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { name: '2 / 3', exact: true })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { name: '0 / 3', exact: true })).toBeInTheDocument();
  });

  it('renders no rows until the case type set memberships have loaded', async () => {
    let releaseMemberships: () => void = () => undefined;
    const membershipsGate = new Promise<void>((resolve) => {
      releaseMemberships = resolve;
    });
    const { screen } = await renderPage([setAlphaFixture, setBetaFixture], CASE_TYPE_SET_PERMISSIONS, membershipsGate);

    await expect.element(screen.getByRole('button', { name: 'Create item' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('cell', { name: 'Alpha set', exact: true }).query()).toBeNull();

    releaseMemberships();

    await expect.element(screen.getByRole('cell', { name: '2 / 3', exact: true })).toBeInTheDocument();
  });

  it('creates a case type set and synchronizes its selected case types', async () => {
    const { membershipPuts, mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new case type set', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Gamma set');
    await screen.getByRole('textbox', { name: 'Description' }).fill('Gamma description');
    await screen.getByRole('textbox', { name: 'Rank' }).fill('3');
    await screen.getByRole('combobox', { name: 'Category' }).click();
    await screen.getByRole('option', { exact: true, name: 'Security' }).click();
    await screen.getByText('Case type two', { exact: true }).click();
    await screen.getByRole('button', { name: 'move selected right' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.pathname).toBe(CASE_TYPE_SETS_PATH);
    expect(postCall?.body).toEqual(expect.objectContaining({ case_type_set_category_id: CATEGORY_SECURITY_ID, description: 'Gamma description', name: 'Gamma set', rank: 3 }));
    expect(postCall?.body).not.toHaveProperty('caseTypeIds');

    await expect.poll(() => membershipPuts.length).toBe(1);
    expect(membershipPuts[0]?.pathname).toBe(`${CASE_TYPE_SETS_PATH}/created-3/case_types`);
    expect(membershipPuts[0]?.body).toEqual({
      case_type_set_members: [{ case_type_id: 'case-type-two', case_type_set_id: 'created-3' }],
    });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('edits a case type set and replaces its case type membership', async () => {
    const { membershipPuts, mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText('Edit item: Alpha set', { exact: true })).toBeVisible();
    await screen.getByRole('textbox', { name: 'Name' }).fill('Alpha renamed');
    await screen.getByText('Case type one', { exact: true }).click();
    await screen.getByRole('button', { name: 'move selected left' }).click();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${CASE_TYPE_SETS_PATH}/set-alpha`);
    expect(putCall?.body).toEqual(expect.objectContaining({ id: 'set-alpha', name: 'Alpha renamed' }));
    expect(putCall?.body).not.toHaveProperty('caseTypeIds');

    await expect.poll(() => membershipPuts.length).toBe(1);
    expect(membershipPuts[0]?.pathname).toBe(`${CASE_TYPE_SETS_PATH}/set-alpha/case_types`);
    expect(membershipPuts[0]?.body).toEqual({
      case_type_set_members: [{ case_type_id: 'case-type-two', case_type_set_id: 'set-alpha' }],
    });
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a case type set via the case type sets endpoint', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${CASE_TYPE_SETS_PATH}/set-alpha`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([setAlphaFixture], []);

    await expect.element(screen.getByRole('cell', { name: 'Alpha set', exact: true })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });
});
