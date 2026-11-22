import { container } from 'tsyringe';
import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';
import type {
  CaseDbCaseType,
  CaseDbCaseTypeSetMember,
  CaseDbCol,
  CaseDbColSetMember,
  CaseDbDataCollection,
  CaseDbOrganizationAccessCasePolicy,
  CaseDbUser,
  CaseDbUserAccessCasePolicy,
} from '@gen-epix/api-casedb';
import { Box } from '@mui/material';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { mockApiRequest } from '@gen-epix/ui-client-common/test/lib';

import { renderComponent } from '../../../test/lib';

import { UserRightsDialogCaseAccessPolicy } from './UserRightsDialogCaseAccessPolicy';

const ORGANIZATION_ID = 'org-1';
const OTHER_ORGANIZATION_ID = 'org-2';
const USER_ID = 'user-1';
const OTHER_USER_ID = 'user-2';

const CASE_TYPE_ONE_ID = 'case-type-1';
const CASE_TYPE_TWO_ID = 'case-type-2';
const CASE_TYPE_THREE_ID = 'case-type-3';

const CASE_TYPE_SET_ORGANIZATION = 'case-type-set-org';
const CASE_TYPE_SET_USER = 'case-type-set-user';
const CASE_TYPE_SET_DISJOINT_USER = 'case-type-set-disjoint-user';

const WRITE_COL_SET_ORGANIZATION = 'write-col-set-org';
const WRITE_COL_SET_USER = 'write-col-set-user';
const READ_COL_SET_ORGANIZATION = 'read-col-set-org';
const READ_COL_SET_USER = 'read-col-set-user';

const COL_ONE_ID = 'col-1';
const COL_TWO_ID = 'col-2';
const COL_THREE_ID = 'col-3';

const DATA_COLLECTION_ONE_ID = 'data-collection-1';
const DATA_COLLECTION_TWO_ID = 'data-collection-2';
const DATA_COLLECTION_THREE_ID = 'data-collection-3';
const DATA_COLLECTION_FOUR_ID = 'data-collection-4';
const DATA_COLLECTION_FIVE_ID = 'data-collection-5';
const DATA_COLLECTION_SIX_ID = 'data-collection-6';
const DATA_COLLECTION_SEVEN_ID = 'data-collection-7';
const UNKNOWN_DATA_COLLECTION_ID = 'data-collection-unknown';

const DATA_COLLECTION_ONE_NAME = 'Data collection one';
const DATA_COLLECTION_TWO_NAME = 'Data collection two';
const DATA_COLLECTION_THREE_NAME = 'Data collection three';
const DATA_COLLECTION_FOUR_NAME = 'Data collection four';
const DATA_COLLECTION_FIVE_NAME = 'Data collection five';
const DATA_COLLECTION_SIX_NAME = 'Data collection six';
const DATA_COLLECTION_SEVEN_NAME = 'Data collection seven';

const createUser = (overrides: Partial<CaseDbUser> = {}): CaseDbUser => ({
  id: USER_ID,
  is_active: true,
  name: 'User one',
  organization_id: ORGANIZATION_ID,
  roles: [],
  ...overrides,
});

const createOrganizationPolicy = (overrides: Partial<CaseDbOrganizationAccessCasePolicy>): CaseDbOrganizationAccessCasePolicy => ({
  add_case: true,
  add_case_set: true,
  case_type_set_id: CASE_TYPE_SET_ORGANIZATION,
  data_collection_id: DATA_COLLECTION_ONE_ID,
  id: `org-policy-${overrides.data_collection_id ?? DATA_COLLECTION_ONE_ID}`,
  is_active: true,
  is_private: false,
  organization_id: ORGANIZATION_ID,
  read_case_set: true,
  read_col_set_id: READ_COL_SET_ORGANIZATION,
  remove_case: true,
  remove_case_set: true,
  write_case_set: true,
  write_col_set_id: WRITE_COL_SET_ORGANIZATION,
  ...overrides,
});

const createUserPolicy = (overrides: Partial<CaseDbUserAccessCasePolicy>): CaseDbUserAccessCasePolicy => ({
  add_case: true,
  add_case_set: true,
  case_type_set_id: CASE_TYPE_SET_USER,
  data_collection_id: DATA_COLLECTION_ONE_ID,
  id: `user-policy-${overrides.data_collection_id ?? DATA_COLLECTION_ONE_ID}`,
  is_active: true,
  read_case_set: true,
  read_col_set_id: READ_COL_SET_USER,
  remove_case: true,
  remove_case_set: true,
  user_id: USER_ID,
  write_case_set: true,
  write_col_set_id: WRITE_COL_SET_USER,
  ...overrides,
});

const CASE_TYPE_SET_MEMBERS: CaseDbCaseTypeSetMember[] = [
  { case_type_id: CASE_TYPE_ONE_ID, case_type_set_id: CASE_TYPE_SET_ORGANIZATION },
  { case_type_id: CASE_TYPE_TWO_ID, case_type_set_id: CASE_TYPE_SET_ORGANIZATION },
  { case_type_id: CASE_TYPE_TWO_ID, case_type_set_id: CASE_TYPE_SET_USER },
  { case_type_id: CASE_TYPE_THREE_ID, case_type_set_id: CASE_TYPE_SET_USER },
  { case_type_id: CASE_TYPE_THREE_ID, case_type_set_id: CASE_TYPE_SET_DISJOINT_USER },
] as CaseDbCaseTypeSetMember[];

const COL_SET_MEMBERS: CaseDbColSetMember[] = [
  { col_id: COL_ONE_ID, col_set_id: WRITE_COL_SET_ORGANIZATION },
  { col_id: COL_TWO_ID, col_set_id: WRITE_COL_SET_ORGANIZATION },
  { col_id: COL_TWO_ID, col_set_id: WRITE_COL_SET_USER },
  { col_id: COL_THREE_ID, col_set_id: WRITE_COL_SET_USER },
  { col_id: COL_ONE_ID, col_set_id: READ_COL_SET_ORGANIZATION },
  { col_id: COL_ONE_ID, col_set_id: READ_COL_SET_USER },
] as CaseDbColSetMember[];

const CASE_TYPES: CaseDbCaseType[] = [
  { id: CASE_TYPE_ONE_ID, name: 'Case type one' },
  { id: CASE_TYPE_TWO_ID, name: 'Case type two' },
  { id: CASE_TYPE_THREE_ID, name: 'Case type three' },
] as CaseDbCaseType[];

const COLS: CaseDbCol[] = [
  { case_type_id: CASE_TYPE_ONE_ID, code: 'one', id: COL_ONE_ID, rank: 1 },
  { case_type_id: CASE_TYPE_ONE_ID, code: 'two', id: COL_TWO_ID, rank: 2 },
  { case_type_id: CASE_TYPE_ONE_ID, code: 'three', id: COL_THREE_ID, rank: 3 },
] as CaseDbCol[];

const DATA_COLLECTIONS: CaseDbDataCollection[] = [
  { description: '', id: DATA_COLLECTION_ONE_ID, name: DATA_COLLECTION_ONE_NAME },
  { description: '', id: DATA_COLLECTION_TWO_ID, name: DATA_COLLECTION_TWO_NAME },
  { description: '', id: DATA_COLLECTION_THREE_ID, name: DATA_COLLECTION_THREE_NAME },
  { description: '', id: DATA_COLLECTION_FOUR_ID, name: DATA_COLLECTION_FOUR_NAME },
  { description: '', id: DATA_COLLECTION_FIVE_ID, name: DATA_COLLECTION_FIVE_NAME },
  { description: '', id: DATA_COLLECTION_SIX_ID, name: DATA_COLLECTION_SIX_NAME },
  { description: '', id: DATA_COLLECTION_SEVEN_ID, name: DATA_COLLECTION_SEVEN_NAME },
] as CaseDbDataCollection[];

// Only the data collection with a matching, active user policy and a shared case type set should appear
const ORGANIZATION_POLICIES: CaseDbOrganizationAccessCasePolicy[] = [
  // Effective: user policy exists, shared case type (case-type-2)
  createOrganizationPolicy({ data_collection_id: DATA_COLLECTION_ONE_ID }),
  // No user policy for this data collection
  createOrganizationPolicy({ data_collection_id: DATA_COLLECTION_TWO_ID }),
  // Case type sets do not intersect
  createOrganizationPolicy({ data_collection_id: DATA_COLLECTION_THREE_ID }),
  // Inactive organization policy
  createOrganizationPolicy({ data_collection_id: DATA_COLLECTION_FOUR_ID, is_active: false }),
  // Policy of another organization
  createOrganizationPolicy({ data_collection_id: DATA_COLLECTION_FIVE_ID, organization_id: OTHER_ORGANIZATION_ID }),
  // Only the user policy of another user exists
  createOrganizationPolicy({ data_collection_id: DATA_COLLECTION_SIX_ID }),
  // Inactive user policy
  createOrganizationPolicy({ data_collection_id: DATA_COLLECTION_SEVEN_ID }),
  // Data collection missing from the data collection list
  createOrganizationPolicy({ data_collection_id: UNKNOWN_DATA_COLLECTION_ID }),
];

const USER_POLICIES: CaseDbUserAccessCasePolicy[] = [
  createUserPolicy({ data_collection_id: DATA_COLLECTION_ONE_ID }),
  createUserPolicy({ case_type_set_id: CASE_TYPE_SET_DISJOINT_USER, data_collection_id: DATA_COLLECTION_THREE_ID }),
  createUserPolicy({ data_collection_id: DATA_COLLECTION_FOUR_ID }),
  createUserPolicy({ data_collection_id: DATA_COLLECTION_SIX_ID, user_id: OTHER_USER_ID }),
  createUserPolicy({ data_collection_id: DATA_COLLECTION_SEVEN_ID, is_active: false }),
  createUserPolicy({ data_collection_id: UNKNOWN_DATA_COLLECTION_ID }),
];

const mockUserRightsCaseAccessPolicyApi = (overrides: {
  readonly caseTypeSetMembers?: CaseDbCaseTypeSetMember[];
  readonly colSetMembers?: CaseDbColSetMember[];
  readonly organizationPolicies?: CaseDbOrganizationAccessCasePolicy[];
  readonly userPolicies?: CaseDbUserAccessCasePolicy[];
} = {}) => {
  mockApiRequest('GET', '/v1/organization_access_case_policies', () => Response.json(overrides.organizationPolicies ?? ORGANIZATION_POLICIES));
  mockApiRequest('GET', '/v1/user_access_case_policies', () => Response.json(overrides.userPolicies ?? USER_POLICIES));
  mockApiRequest('GET', '/v1/case_type_set_members', () => Response.json(overrides.caseTypeSetMembers ?? CASE_TYPE_SET_MEMBERS));
  mockApiRequest('GET', '/v1/case_types', () => Response.json(CASE_TYPES));
  mockApiRequest('GET', '/v1/col_set_members', () => Response.json(overrides.colSetMembers ?? COL_SET_MEMBERS));
  mockApiRequest('GET', '/v1/cols', () => Response.json(COLS));
  mockApiRequest('GET', '/v1/data_collections', () => Response.json(DATA_COLLECTIONS));
};

const renderUserRightsCaseAccessPolicy = async (user: CaseDbUser = createUser()) => {
  return renderComponent(
    <Box
      sx={{
        '& > *': { flex: 1, minHeight: 0 }, display: 'flex', flexDirection: 'column', height: 800,
      }}
    >
      <UserRightsDialogCaseAccessPolicy user={user} />
    </Box>,
  );
};

describe('UserRightsDialogCaseAccessPolicy', () => {
  afterEach(() => {
    container.resolve(QueryClientService).queryClient.clear();
  });

  it('renders the table', async () => {
    mockUserRightsCaseAccessPolicyApi();
    const screen = await renderUserRightsCaseAccessPolicy();

    await expect.element(screen.getByRole('table')).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: DATA_COLLECTION_ONE_NAME })).toBeInTheDocument();
  });

  it('shows only the effective policies of the user organization', async () => {
    mockUserRightsCaseAccessPolicyApi();
    const screen = await renderUserRightsCaseAccessPolicy();

    await expect.element(screen.getByRole('cell', { exact: true, name: DATA_COLLECTION_ONE_NAME })).toBeInTheDocument();
    await expect.element(screen.getByRole('heading', { name: 'Table (2)' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('cell', { exact: true, name: DATA_COLLECTION_TWO_NAME }).query()).toBeNull();
    await expect.poll(() => screen.getByRole('cell', { exact: true, name: DATA_COLLECTION_THREE_NAME }).query()).toBeNull();
    await expect.poll(() => screen.getByRole('cell', { exact: true, name: DATA_COLLECTION_FOUR_NAME }).query()).toBeNull();
    await expect.poll(() => screen.getByRole('cell', { exact: true, name: DATA_COLLECTION_FIVE_NAME }).query()).toBeNull();
    await expect.poll(() => screen.getByRole('cell', { exact: true, name: DATA_COLLECTION_SIX_NAME }).query()).toBeNull();
    await expect.poll(() => screen.getByRole('cell', { exact: true, name: DATA_COLLECTION_SEVEN_NAME }).query()).toBeNull();
  });

  it('shows no rows when the user has no matching policies', async () => {
    mockUserRightsCaseAccessPolicyApi({ userPolicies: [] });
    const screen = await renderUserRightsCaseAccessPolicy();

    await expect.element(screen.getByRole('table')).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('cell', { exact: true, name: DATA_COLLECTION_ONE_NAME }).query()).toBeNull();
  });

  it('shows no rows when the case type sets do not intersect', async () => {
    mockUserRightsCaseAccessPolicyApi({
      caseTypeSetMembers: CASE_TYPE_SET_MEMBERS.filter(member => member.case_type_set_id !== CASE_TYPE_SET_USER),
    });
    const screen = await renderUserRightsCaseAccessPolicy();

    await expect.element(screen.getByRole('table')).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('cell', { exact: true, name: DATA_COLLECTION_ONE_NAME }).query()).toBeNull();
  });

  it('renders a row without a name when the data collection is unknown', async () => {
    mockUserRightsCaseAccessPolicyApi({
      organizationPolicies: [createOrganizationPolicy({ data_collection_id: UNKNOWN_DATA_COLLECTION_ID })],
      userPolicies: [createUserPolicy({ data_collection_id: UNKNOWN_DATA_COLLECTION_ID })],
    });
    const screen = await renderUserRightsCaseAccessPolicy();

    await expect.element(screen.getByRole('heading', { name: 'Table (1)' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { exact: true, name: '1' })).toBeInTheDocument();
    await expect.poll(() => screen.getByRole('cell', { exact: true, name: DATA_COLLECTION_ONE_NAME }).query()).toBeNull();
  });
});
