import {
  describe,
  expect,
  it,
} from 'vitest';
import type {
  CaseDbApiPermission,
  CaseDbUserAccessCasePolicy,
} from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';
import type {
  CommonDbApiPermission,
  CommonDbUser,
} from '@gen-epix/api-commondb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockApiRequest,
  mockCrudApi,
  mockOrganizations,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';
import { container } from 'tsyringe';

import { UserAccessCasePoliciesAdminPage } from './UserAccessCasePoliciesAdminPage';

type PolicyFixture = { readonly id: string } & CaseDbUserAccessCasePolicy;
type UserFixture = { readonly id: string } & CommonDbUser;

const POLICIES_PATH = '/v1/user_access_case_policies';
const USERS_PATH = '/v1/users';
const DATA_COLLECTIONS_PATH = '/v1/data_collections';
const COL_SETS_PATH = '/v1/col_sets';
const CASE_TYPE_SETS_PATH = '/v1/case_type_sets';
const CASE_TYPE_SET_CATEGORIES_PATH = '/v1/case_type_set_categories';
const ROUTE_PATH = '/management/user-access-case-policies';
const URL = '/management/user-access-case-policies';

const PERMISSIONS: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.UserAccessCasePolicyCrudCommand, permission_type: CaseDbPermissionType.CREATE },
  { command_name: CaseDbCommandName.UserAccessCasePolicyCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.UserAccessCasePolicyCrudCommand, permission_type: CaseDbPermissionType.UPDATE },
  { command_name: CaseDbCommandName.UserAccessCasePolicyCrudCommand, permission_type: CaseDbPermissionType.DELETE },
];

const USER_ALICE_ID = '00000000-0000-4000-8000-000000000101';
const USER_BOB_ID = '00000000-0000-4000-8000-000000000102';
const DATA_COLLECTION_ID = '00000000-0000-4000-8000-000000000201';
const CASE_TYPE_SET_ID = '00000000-0000-4000-8000-000000000301';
const CASE_TYPE_SET_CATEGORY_ID = '00000000-0000-4000-8000-000000000302';
const COL_SET_READ_ID = '00000000-0000-4000-8000-000000000401';
const COL_SET_WRITE_ID = '00000000-0000-4000-8000-000000000402';
const ORGANIZATION_ID = '00000000-0000-4000-8000-000000000501';
const POLICY_ID = '00000000-0000-4000-8000-000000000601';

const userAliceFixture: UserFixture = {
  email: 'alice@example.test',
  id: USER_ALICE_ID,
  is_active: true,
  key: 'alice',
  name: 'Alice',
  organization_id: ORGANIZATION_ID,
  roles: [],
};

const userBobFixture: UserFixture = {
  email: 'bob@example.test',
  id: USER_BOB_ID,
  is_active: true,
  key: 'bob',
  name: 'Bob',
  organization_id: ORGANIZATION_ID,
  roles: [],
};

const dataCollectionFixture = { id: DATA_COLLECTION_ID, name: 'Collection A' };
const caseTypeSetCategoryFixture = { id: CASE_TYPE_SET_CATEGORY_ID, name: 'Category A' };
const caseTypeSetFixture = { case_type_set_category_id: CASE_TYPE_SET_CATEGORY_ID, id: CASE_TYPE_SET_ID, name: 'Case type set A' };
const colSetReadFixture = { id: COL_SET_READ_ID, name: 'Column set A' };
const colSetWriteFixture = { id: COL_SET_WRITE_ID, name: 'Column set B' };

const policyFixture: PolicyFixture = {
  add_case: true,
  add_case_set: false,
  case_type_set_id: CASE_TYPE_SET_ID,
  data_collection_id: DATA_COLLECTION_ID,
  id: POLICY_ID,
  is_active: true,
  read_case_set: true,
  read_col_set_id: COL_SET_READ_ID,
  remove_case: false,
  remove_case_set: false,
  user_id: USER_ALICE_ID,
  write_case_set: false,
  write_col_set_id: null,
};

const POLICY_NAME = 'Alice (alice) -> Collection A -> Case type set A';

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (initialItems: PolicyFixture[] = [policyFixture], permissions: CaseDbApiPermission[] = PERMISSIONS) => {
  const mock = mockCrudApi(POLICIES_PATH, initialItems);
  mockApiRequest('GET', USERS_PATH, () => Response.json([userAliceFixture, userBobFixture]));
  mockOrganizations();
  mockApiRequest('GET', DATA_COLLECTIONS_PATH, () => Response.json([dataCollectionFixture]));
  mockApiRequest('GET', COL_SETS_PATH, () => Response.json([colSetReadFixture, colSetWriteFixture]));
  mockApiRequest('GET', CASE_TYPE_SETS_PATH, () => Response.json([caseTypeSetFixture]));
  mockApiRequest('GET', CASE_TYPE_SET_CATEGORIES_PATH, () => Response.json([caseTypeSetCategoryFixture]));
  const screen = await renderRoutedPage(
    <UserAccessCasePoliciesAdminPage />, {
      path: ROUTE_PATH,
      permissions: permissions as CommonDbApiPermission[],
      url: URL,
    },
  );
  return { mock, screen };
};

type Screen = Awaited<ReturnType<typeof renderPage>>['screen'];

const openRowActions = async (screen: Screen) => {
  await screen.getByRole('button', { name: 'Row actions' }).first().click();
};

const selectOption = async (screen: Screen, fieldName: string, optionName: string) => {
  await screen.getByRole('combobox', { exact: true, name: fieldName }).click();
  await screen.getByRole('option', { exact: true, name: optionName }).click();
};

describe('UserAccessCasePoliciesAdminPage', () => {
  it('lists the policies with resolved user, data collection, case type set and column set names', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alice (alice)' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Collection A' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Category A | Case type set A' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Column set A' })).toBeInTheDocument();
  });

  it('creates a policy with all selections and boolean flags', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new user access case policy', { exact: true })).toBeVisible();
    await selectOption(screen, 'User', 'Bob (bob)');
    await selectOption(screen, 'Data collection', 'Collection A');
    await selectOption(screen, 'Case type set', 'Category A | Case type set A');
    await selectOption(screen, 'Read column set', 'Column set A');
    await selectOption(screen, 'Write column set', 'Column set B');
    await selectOption(screen, 'Add case', 'Yes');
    await selectOption(screen, 'Remove case', 'No');
    await selectOption(screen, 'Add case set', 'No');
    await selectOption(screen, 'Remove case set', 'Yes');
    await selectOption(screen, 'Read case set', 'Yes');
    await selectOption(screen, 'Write case set', 'No');
    await selectOption(screen, 'Is active', 'Yes');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.pathname).toBe(POLICIES_PATH);
    expect(postCall?.body).toEqual(expect.objectContaining({
      add_case: true,
      add_case_set: false,
      case_type_set_id: CASE_TYPE_SET_ID,
      data_collection_id: DATA_COLLECTION_ID,
      is_active: true,
      read_case_set: true,
      read_col_set_id: COL_SET_READ_ID,
      remove_case: false,
      remove_case_set: true,
      user_id: USER_BOB_ID,
      write_case_set: false,
      write_col_set_id: COL_SET_WRITE_ID,
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('does not create a policy when required selections are missing', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new user access case policy', { exact: true })).toBeVisible();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(0);
  });

  it('edits a policy and sends the changed flags', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText(`Edit item: ${POLICY_NAME}`, { exact: true })).toBeVisible();
    await selectOption(screen, 'Is active', 'No');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${POLICIES_PATH}/${POLICY_ID}`);
    expect(putCall?.body).toEqual(expect.objectContaining({
      case_type_set_id: CASE_TYPE_SET_ID,
      data_collection_id: DATA_COLLECTION_ID,
      id: POLICY_ID,
      is_active: false,
      read_col_set_id: COL_SET_READ_ID,
      user_id: USER_ALICE_ID,
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('deletes a policy', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await expect.element(screen.getByRole('dialog').getByText(POLICY_NAME, { exact: false }).first()).toBeVisible();
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${POLICIES_PATH}/${POLICY_ID}`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([policyFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Alice (alice)' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });
});
