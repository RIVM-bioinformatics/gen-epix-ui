import {
  describe,
  expect,
  it,
} from 'vitest';
import type {
  CaseDbCaseType,
  CaseDbCaseTypeSet,
  CaseDbCaseTypeSetCategory,
  CaseDbCaseTypeSetMember,
  CaseDbCol,
  CaseDbColSet,
  CaseDbColSetMember,
  CaseDbDataCollection,
  CaseDbDim,
  CaseDbOrganizationAccessCasePolicy,
  CaseDbOrganizationShareCasePolicy,
  CaseDbUser,
  CaseDbUserAccessCasePolicy,
  CaseDbUserShareCasePolicy,
} from '@gen-epix/api-casedb';
import type { CommonDbApiPermission } from '@gen-epix/api-commondb';
import {
  mockApiRequest,
  mockOrganizations,
  renderRoutedPage,
} from '@gen-epix/ui-client-common/test/lib';

import { UserEffectiveRightsTesterAdminPage } from './UserEffectiveRightsTesterAdminPage';

const ROUTE_PATH = '/management/users/:userId/effective-rights-tester';
const USER_ID = '00000000-0000-4000-8000-000000000101';
const ORGANIZATION_ID = '00000000-0000-4000-8000-000000000001';
const DATA_COLLECTION_ONE_ID = '00000000-0000-4000-8000-000000000201';
const DATA_COLLECTION_TWO_ID = '00000000-0000-4000-8000-000000000202';
const CASE_TYPE_ID = '00000000-0000-4000-8000-000000000301';
const OTHER_CASE_TYPE_ID = '00000000-0000-4000-8000-000000000302';
const CASE_TYPE_SET_ID = '00000000-0000-4000-8000-000000000401';
const CASE_TYPE_SET_CATEGORY_ID = '00000000-0000-4000-8000-000000000402';
const COL_SET_READ_ID = '00000000-0000-4000-8000-000000000501';
const COL_ID = '00000000-0000-4000-8000-000000000601';
const DIM_ID = '00000000-0000-4000-8000-000000000701';
const USER_ACCESS_POLICY_ID = '00000000-0000-4000-8000-000000000801';
const USER_SHARE_POLICY_ID = '00000000-0000-4000-8000-000000000802';

const userFixture: CaseDbUser = {
  email: 'alice@example.test',
  id: USER_ID,
  is_active: true,
  key: 'alice',
  name: 'Alice',
  organization_id: ORGANIZATION_ID,
  roles: ['admin', 'user'],
};

const caseTypeFixture: CaseDbCaseType = { id: CASE_TYPE_ID, name: 'Case type one' };
const otherCaseTypeFixture: CaseDbCaseType = { id: OTHER_CASE_TYPE_ID, name: 'Case type two' };
const caseTypeSetCategoryFixture: CaseDbCaseTypeSetCategory = { id: CASE_TYPE_SET_CATEGORY_ID, name: 'Category one' } as CaseDbCaseTypeSetCategory;
const caseTypeSetFixture: CaseDbCaseTypeSet = { case_type_set_category_id: CASE_TYPE_SET_CATEGORY_ID, id: CASE_TYPE_SET_ID, name: 'Set one' } as CaseDbCaseTypeSet;
const caseTypeSetMemberFixture: CaseDbCaseTypeSetMember = { case_type_id: CASE_TYPE_ID, case_type_set_id: CASE_TYPE_SET_ID, id: '00000000-0000-4000-8000-000000000901' };
const dimFixture: CaseDbDim = { id: DIM_ID, label: 'Dimension one' } as CaseDbDim;
const colFixture: CaseDbCol = { case_type_id: CASE_TYPE_ID, dim_id: DIM_ID, id: COL_ID, label: 'Column one' } as CaseDbCol;
const colSetReadFixture: CaseDbColSet = { id: COL_SET_READ_ID, name: 'Read set' };
const colSetMemberFixture: CaseDbColSetMember = { col_id: COL_ID, col_set_id: COL_SET_READ_ID, id: '00000000-0000-4000-8000-000000000902' };
const dataCollectionOneFixture: CaseDbDataCollection = { id: DATA_COLLECTION_ONE_ID, name: 'Data collection one' };
const dataCollectionTwoFixture: CaseDbDataCollection = { id: DATA_COLLECTION_TWO_ID, name: 'Data collection two' };

const userAccessPolicyFixture: CaseDbUserAccessCasePolicy = {
  add_case: true,
  add_case_set: false,
  case_type_set_id: CASE_TYPE_SET_ID,
  data_collection_id: DATA_COLLECTION_ONE_ID,
  id: USER_ACCESS_POLICY_ID,
  is_active: true,
  read_case_set: true,
  read_col_set_id: COL_SET_READ_ID,
  remove_case: false,
  remove_case_set: false,
  user_id: USER_ID,
  write_case_set: false,
  write_col_set_id: null,
};

const organizationAccessPolicyFixture: CaseDbOrganizationAccessCasePolicy = {
  add_case: true,
  add_case_set: true,
  case_type_set_id: CASE_TYPE_SET_ID,
  data_collection_id: DATA_COLLECTION_ONE_ID,
  id: '00000000-0000-4000-8000-000000000811',
  is_active: true,
  is_private: false,
  organization_id: ORGANIZATION_ID,
  read_case_set: true,
  read_col_set_id: COL_SET_READ_ID,
  remove_case: true,
  remove_case_set: true,
  write_case_set: true,
  write_col_set_id: COL_SET_READ_ID,
};

const organizationSharePolicyFixture: CaseDbOrganizationShareCasePolicy = {
  add_case: true,
  add_case_set: true,
  case_type_set_id: CASE_TYPE_SET_ID,
  data_collection_id: DATA_COLLECTION_ONE_ID,
  from_data_collection_id: DATA_COLLECTION_TWO_ID,
  id: '00000000-0000-4000-8000-000000000812',
  is_active: true,
  organization_id: ORGANIZATION_ID,
  remove_case: true,
  remove_case_set: true,
};

const userSharePolicyFixture: CaseDbUserShareCasePolicy = {
  add_case: true,
  add_case_set: false,
  case_type_set_id: CASE_TYPE_SET_ID,
  data_collection_id: DATA_COLLECTION_ONE_ID,
  from_data_collection_id: DATA_COLLECTION_TWO_ID,
  id: USER_SHARE_POLICY_ID,
  is_active: true,
  remove_case: true,
  remove_case_set: false,
  user_id: USER_ID,
};

const PERMISSIONS: CommonDbApiPermission[] = [];

type RenderPageOptions = {
  readonly userAccessCasePolicies?: CaseDbUserAccessCasePolicy[];
  readonly userSharePolicies?: CaseDbUserShareCasePolicy[];
};

const renderPage = async ({
  userAccessCasePolicies = [userAccessPolicyFixture],
  userSharePolicies = [],
}: RenderPageOptions = {}) => {
  mockApiRequest('GET', `/v1/users/${USER_ID}`, () => Response.json(userFixture));
  mockOrganizations();
  mockApiRequest('GET', '/v1/organization_access_case_policies', () => Response.json([organizationAccessPolicyFixture]));
  mockApiRequest('GET', '/v1/organization_share_case_policies', () => Response.json([organizationSharePolicyFixture]));
  mockApiRequest('GET', '/v1/user_access_case_policies', () => Response.json(userAccessCasePolicies));
  mockApiRequest('GET', '/v1/user_share_case_policies', () => Response.json(userSharePolicies));
  mockApiRequest('GET', '/v1/case_type_set_members', () => Response.json([caseTypeSetMemberFixture]));
  mockApiRequest('GET', '/v1/case_type_sets', () => Response.json([caseTypeSetFixture]));
  mockApiRequest('GET', '/v1/case_type_set_categories', () => Response.json([caseTypeSetCategoryFixture]));
  mockApiRequest('GET', '/v1/case_types', () => Response.json([caseTypeFixture, otherCaseTypeFixture]));
  mockApiRequest('GET', '/v1/col_set_members', () => Response.json([colSetMemberFixture]));
  mockApiRequest('GET', '/v1/col_sets', () => Response.json([colSetReadFixture]));
  mockApiRequest('GET', '/v1/cols', () => Response.json([colFixture]));
  mockApiRequest('GET', '/v1/dims', () => Response.json([dimFixture]));
  mockApiRequest('GET', '/v1/data_collections', () => Response.json([dataCollectionOneFixture, dataCollectionTwoFixture]));

  return await renderRoutedPage(
    <UserEffectiveRightsTesterAdminPage />, {
      path: ROUTE_PATH,
      permissions: PERMISSIONS,
      url: `/management/users/${USER_ID}/effective-rights-tester`,
    },
  );
};

type Screen = Awaited<ReturnType<typeof renderPage>>;

const selectAutocompleteOption = async (screen: Screen, fieldLabel: string, optionName: string) => {
  await screen.getByRole('combobox', { exact: true, name: fieldLabel }).click();
  await screen.getByRole('option', { exact: true, name: optionName }).click();
};

describe('UserEffectiveRightsTesterAdminPage', () => {
  it('shows the user details and no result before a case type and data collection are selected', async () => {
    const screen = await renderPage();

    await expect.element(screen.getByText('Testing effective rights for user: alice@example.test', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Organization: Example organization', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Roles: admin, user', { exact: true })).toBeVisible();
    await expect.element(screen.getByRole('combobox', { exact: true, name: 'From data collection' })).toBeDisabled();
    await expect.element(screen.getByText('Effective rights result:', { exact: true })).not.toBeInTheDocument();
  });

  it('shows the effective rights for the selected case type and data collection', async () => {
    const screen = await renderPage();

    await selectAutocompleteOption(screen, 'Case type', 'Case type one');
    await selectAutocompleteOption(screen, 'Data collection', 'Data collection one');

    await expect.element(screen.getByText('Effective rights result:', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Add case: Yes', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Remove case: No', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Add case set: No', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Remove case set: No', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Read case set: Yes', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Write case set: No', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Read case properties: Yes', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Write case properties: No', { exact: true })).toBeVisible();
    await expect.element(screen.getByRole('combobox', { exact: true, name: 'From data collection' })).toBeDisabled();
    await expect.element(screen.getByText(/Note: The user has share case rights/)).not.toBeInTheDocument();
  });

  it('shows that no rights apply when the case type is not granted through a case type set', async () => {
    const screen = await renderPage();

    await selectAutocompleteOption(screen, 'Case type', 'Case type two');
    await selectAutocompleteOption(screen, 'Data collection', 'Data collection one');

    await expect.element(screen.getByText('Add case: No', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Remove case: No', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Read case set: No', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Read case properties: No', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Write case properties: No', { exact: true })).toBeVisible();
  });

  it('enables the from data collection when share rights exist and applies them once selected', async () => {
    const screen = await renderPage({ userSharePolicies: [userSharePolicyFixture] });

    await selectAutocompleteOption(screen, 'Case type', 'Case type one');
    await selectAutocompleteOption(screen, 'Data collection', 'Data collection one');

    await expect.element(screen.getByRole('combobox', { exact: true, name: 'From data collection' })).toBeEnabled();
    await expect.element(screen.getByText(/Note: The user has share case rights/)).toBeVisible();
    await expect.element(screen.getByText('Remove case: No', { exact: true })).toBeVisible();

    await selectAutocompleteOption(screen, 'From data collection', 'Data collection two');

    await expect.element(screen.getByText(/Note: The user has share case rights/)).not.toBeInTheDocument();
    await expect.element(screen.getByText('Add case: Yes', { exact: true })).toBeVisible();
  });

  it('shows all rights when both the user and the organization grant them', async () => {
    const screen = await renderPage({
      userAccessCasePolicies: [{
        ...userAccessPolicyFixture,
        add_case_set: true,
        remove_case: true,
        remove_case_set: true,
        write_case_set: true,
        write_col_set_id: COL_SET_READ_ID,
      }],
    });

    await selectAutocompleteOption(screen, 'Case type', 'Case type one');
    await selectAutocompleteOption(screen, 'Data collection', 'Data collection one');

    await expect.element(screen.getByText('Add case: Yes', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Remove case: Yes', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Add case set: Yes', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Remove case set: Yes', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Write case set: Yes', { exact: true })).toBeVisible();
    await expect.element(screen.getByText('Write case properties: Yes', { exact: true })).toBeVisible();
  });
});
