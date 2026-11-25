import {
  describe,
  expect,
  it,
} from 'vitest';
import type {
  CaseDbApiPermission,
  CaseDbOrganizationAccessCasePolicy,
} from '@gen-epix/api-casedb';
import {
  CaseDbCommandName,
  CaseDbPermissionType,
} from '@gen-epix/api-casedb';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import {
  mockApiRequest,
  mockCrudApi,
  mockOrganizations,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';
import { container } from 'tsyringe';

import { OrganizationAccessCasePoliciesAdminPage } from './OrganizationAccessCasePoliciesAdminPage';

type PolicyFixture = { readonly id: string } & CaseDbOrganizationAccessCasePolicy;

const POLICIES_PATH = '/v1/organization_access_case_policies';
const DATA_COLLECTIONS_PATH = '/v1/data_collections';
const COL_SETS_PATH = '/v1/col_sets';
const CASE_TYPE_SETS_PATH = '/v1/case_type_sets';
const CASE_TYPE_SET_CATEGORIES_PATH = '/v1/case_type_set_categories';
const ROUTE_PATH = '/management/organization-access-case-policies';
const URL = '/management/organization-access-case-policies';

const PERMISSIONS: CaseDbApiPermission[] = [
  { command_name: CaseDbCommandName.OrganizationAccessCasePolicyCrudCommand, permission_type: CaseDbPermissionType.CREATE },
  { command_name: CaseDbCommandName.OrganizationAccessCasePolicyCrudCommand, permission_type: CaseDbPermissionType.READ },
  { command_name: CaseDbCommandName.OrganizationAccessCasePolicyCrudCommand, permission_type: CaseDbPermissionType.UPDATE },
  { command_name: CaseDbCommandName.OrganizationAccessCasePolicyCrudCommand, permission_type: CaseDbPermissionType.DELETE },
];

const ORGANIZATION_ID = '00000000-0000-4000-8000-000000000001';
const DATA_COLLECTION_A_ID = '00000000-0000-4000-8000-000000000201';
const DATA_COLLECTION_B_ID = '00000000-0000-4000-8000-000000000202';
const CASE_TYPE_SET_ID = '00000000-0000-4000-8000-000000000301';
const CASE_TYPE_SET_CATEGORY_ID = '00000000-0000-4000-8000-000000000401';
const COL_SET_A_ID = '00000000-0000-4000-8000-000000000501';
const COL_SET_B_ID = '00000000-0000-4000-8000-000000000502';
const PUBLIC_POLICY_ID = '00000000-0000-4000-8000-000000000601';
const PRIVATE_POLICY_ID = '00000000-0000-4000-8000-000000000602';

const dataCollectionAFixture = { id: DATA_COLLECTION_A_ID, name: 'Collection A' };
const dataCollectionBFixture = { id: DATA_COLLECTION_B_ID, name: 'Collection B' };
const caseTypeSetCategoryFixture = { id: CASE_TYPE_SET_CATEGORY_ID, name: 'Category A' };
const caseTypeSetFixture = { case_type_set_category_id: CASE_TYPE_SET_CATEGORY_ID, id: CASE_TYPE_SET_ID, name: 'Case type set A' };
const colSetAFixture = { id: COL_SET_A_ID, name: 'Column set A' };
const colSetBFixture = { id: COL_SET_B_ID, name: 'Column set B' };

const publicPolicyFixture: PolicyFixture = {
  add_case: true,
  add_case_set: false,
  case_type_set_id: CASE_TYPE_SET_ID,
  data_collection_id: DATA_COLLECTION_A_ID,
  id: PUBLIC_POLICY_ID,
  is_active: true,
  is_private: false,
  organization_id: ORGANIZATION_ID,
  read_case_set: true,
  read_col_set_id: null,
  remove_case: false,
  remove_case_set: false,
  write_case_set: false,
  write_col_set_id: null,
};

const privatePolicyFixture: PolicyFixture = {
  add_case: true,
  add_case_set: true,
  case_type_set_id: CASE_TYPE_SET_ID,
  data_collection_id: DATA_COLLECTION_A_ID,
  id: PRIVATE_POLICY_ID,
  is_active: true,
  is_private: true,
  organization_id: ORGANIZATION_ID,
  read_case_set: false,
  read_col_set_id: COL_SET_A_ID,
  remove_case: true,
  remove_case_set: true,
  write_case_set: true,
  write_col_set_id: COL_SET_B_ID,
};

const PUBLIC_POLICY_NAME = 'Example organization -> Collection A -> Case type set A';

const getNotificationMessages = () => container.resolve(NotificationService).data.map(({ message }) => message);

const renderPage = async (initialItems: PolicyFixture[] = [publicPolicyFixture], permissions: CaseDbApiPermission[] = PERMISSIONS) => {
  const mock = mockCrudApi(POLICIES_PATH, initialItems);
  mockOrganizations();
  mockApiRequest('GET', DATA_COLLECTIONS_PATH, () => Response.json([dataCollectionAFixture, dataCollectionBFixture]));
  mockApiRequest('GET', COL_SETS_PATH, () => Response.json([colSetAFixture, colSetBFixture]));
  mockApiRequest('GET', CASE_TYPE_SETS_PATH, () => Response.json([caseTypeSetFixture]));
  mockApiRequest('GET', CASE_TYPE_SET_CATEGORIES_PATH, () => Response.json([caseTypeSetCategoryFixture]));
  const screen = await renderRoutedPage(
    <OrganizationAccessCasePoliciesAdminPage />, {
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

describe('OrganizationAccessCasePoliciesAdminPage', () => {
  it('lists the policies with resolved organization, collection and case type set names', async () => {
    const { screen } = await renderPage();

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Example organization' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Collection A' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Category A | Case type set A' })).toBeInTheDocument();
  });

  it('lists the column sets of a private policy', async () => {
    const { screen } = await renderPage([privatePolicyFixture]);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Column set A' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: 'Column set B' })).toBeInTheDocument();
  });

  it('creates a public policy with the selected flags', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new organization access case policy', { exact: true })).toBeVisible();
    await selectOption(screen, 'Organization', 'Example organization');
    await selectOption(screen, 'Data collection', 'Collection A');
    await selectOption(screen, 'Case type set', 'Category A | Case type set A');
    await selectOption(screen, 'Is private', 'No');
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
      data_collection_id: DATA_COLLECTION_A_ID,
      is_active: true,
      is_private: false,
      organization_id: ORGANIZATION_ID,
      read_case_set: true,
      remove_case: false,
      remove_case_set: true,
      write_case_set: false,
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been created.')]));
  });

  it('creates a private policy that forces the case rights and sends the column sets', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new organization access case policy', { exact: true })).toBeVisible();
    await selectOption(screen, 'Organization', 'Example organization');
    await selectOption(screen, 'Data collection', 'Collection A');
    await selectOption(screen, 'Case type set', 'Category A | Case type set A');
    await selectOption(screen, 'Is private', 'Yes');
    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Add case' })).toBeDisabled();
    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Remove case set' })).toBeDisabled();
    await selectOption(screen, 'Read column set', 'Column set A');
    await selectOption(screen, 'Write column set', 'Column set B');
    await selectOption(screen, 'Read case set', 'No');
    await selectOption(screen, 'Write case set', 'Yes');
    await selectOption(screen, 'Is active', 'Yes');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(1);
    const postCall = mock.calls.find(({ method }) => method === 'POST');
    expect(postCall?.body).toEqual(expect.objectContaining({
      add_case: true,
      add_case_set: true,
      is_private: true,
      read_col_set_id: COL_SET_A_ID,
      remove_case: true,
      remove_case_set: true,
      write_case_set: true,
      write_col_set_id: COL_SET_B_ID,
    }));
  });

  it('does not create a private policy without a read column set', async () => {
    const { mock, screen } = await renderPage();

    await screen.getByRole('button', { name: 'Create item' }).click();
    await expect.element(screen.getByText('Create new organization access case policy', { exact: true })).toBeVisible();
    await selectOption(screen, 'Organization', 'Example organization');
    await selectOption(screen, 'Data collection', 'Collection A');
    await selectOption(screen, 'Case type set', 'Category A | Case type set A');
    await selectOption(screen, 'Is private', 'Yes');
    await selectOption(screen, 'Write column set', 'Column set B');
    await selectOption(screen, 'Read case set', 'No');
    await selectOption(screen, 'Write case set', 'No');
    await selectOption(screen, 'Is active', 'Yes');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.element(screen.getByText('Read column set is required for private policies')).toBeVisible();
    await expect.poll(() => mock.calls.filter(({ method }) => method === 'POST').length).toBe(0);
  });

  it('edits a public policy and sends the changed flags', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByText(`Edit item: ${PUBLIC_POLICY_NAME}`, { exact: true })).toBeVisible();
    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Add case' })).toBeEnabled();
    await selectOption(screen, 'Is active', 'No');
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.pathname).toBe(`${POLICIES_PATH}/${PUBLIC_POLICY_ID}`);
    expect(putCall?.body).toEqual(expect.objectContaining({
      case_type_set_id: CASE_TYPE_SET_ID,
      data_collection_id: DATA_COLLECTION_A_ID,
      id: PUBLIC_POLICY_ID,
      is_active: false,
      is_private: false,
      organization_id: ORGANIZATION_ID,
    }));
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been saved.')]));
  });

  it('locks the case rights of a private policy until it is made public', async () => {
    const { mock, screen } = await renderPage([privatePolicyFixture]);

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Edit' }).click();
    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Add case' })).toBeDisabled();
    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Remove case' })).toBeDisabled();
    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Add case set' })).toBeDisabled();
    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Remove case set' })).toBeDisabled();
    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Read case set' })).toBeEnabled();

    await selectOption(screen, 'Is private', 'No');
    await expect.element(screen.getByRole('combobox', { exact: true, name: 'Add case' })).toBeEnabled();
    await screen.getByRole('button', { name: 'Save' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'PUT').length).toBe(1);
    const putCall = mock.calls.find(({ method }) => method === 'PUT');
    expect(putCall?.body).toEqual(expect.objectContaining({
      id: PRIVATE_POLICY_ID,
      is_private: false,
    }));
  });

  it('deletes a policy', async () => {
    const { mock, screen } = await renderPage();

    await openRowActions(screen);
    await screen.getByRole('menuitem', { name: 'Delete' }).click();
    await expect.element(screen.getByTestId('CrudPageDeleteDialog-title')).toHaveTextContent(`Delete item: ${PUBLIC_POLICY_NAME}`);
    await screen.getByRole('button', { name: 'Confirm' }).click();

    await expect.poll(() => mock.calls.filter(({ method }) => method === 'DELETE').length).toBe(1);
    expect(mock.calls.find(({ method }) => method === 'DELETE')?.pathname).toBe(`${POLICIES_PATH}/${PUBLIC_POLICY_ID}`);
    await expect.poll(getNotificationMessages).toEqual(expect.arrayContaining([expect.stringContaining('has been deleted.')]));
  });

  it('hides the create action without permissions', async () => {
    const { screen } = await renderPage([publicPolicyFixture], []);

    await expect.element(screen.getByRole('cell', { exact: true, name: 'Example organization' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('button', { name: 'Create item' }).query()).toBeNull();
  });
});
