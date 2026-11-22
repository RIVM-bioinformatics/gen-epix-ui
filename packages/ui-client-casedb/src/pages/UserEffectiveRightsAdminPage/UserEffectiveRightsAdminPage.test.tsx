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
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';

import type { CaseDbConfig } from '../../models/config.models';

import { UserEffectiveRightsAdminPage } from './UserEffectiveRightsAdminPage';

const createId = (index: number) => `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`;

const ROUTE_PATH = '/management/users/:userId/effective-rights';
const USER_ID = createId(101);
const ORGANIZATION_ID = createId(1);
const DATA_COLLECTION_ONE_ID = createId(201);
const DATA_COLLECTION_TWO_ID = createId(202);
const CASE_TYPE_ONE_ID = createId(301);
const CASE_TYPE_TWO_ID = createId(302);
const CASE_TYPE_THREE_ID = createId(303);
const CASE_TYPE_FOUR_ID = createId(304);
const CASE_TYPE_FIVE_ID = createId(305);
const CATEGORY_ID = createId(390);
const SET_ONE_ID = createId(401);
const SET_TWO_ID = createId(402);
const SET_THREE_ID = createId(403);
const SET_FOUR_ID = createId(404);
const SET_FIVE_ID = createId(405);
const SET_SIX_ID = createId(406);
const SET_SEVEN_ID = createId(407);
const SET_EIGHT_ID = createId(408);
const COL_SET_READ_ID = createId(501);
const MISSING_COL_SET_ID = createId(599);
const COL_ID = createId(601);
const DIM_ID = createId(701);

const userFixture: CaseDbUser = {
  email: 'alice@example.test',
  id: USER_ID,
  is_active: true,
  key: 'alice',
  name: 'Alice',
  organization_id: ORGANIZATION_ID,
  roles: ['user'],
};

const caseTypeFixtures: CaseDbCaseType[] = [
  { id: CASE_TYPE_ONE_ID, name: 'Case type one' },
  { id: CASE_TYPE_TWO_ID, name: 'Case type two' },
  { id: CASE_TYPE_THREE_ID, name: 'Case type three' },
  { id: CASE_TYPE_FOUR_ID, name: 'Case type four' },
  { id: CASE_TYPE_FIVE_ID, name: 'Case type five' },
] as CaseDbCaseType[];
const caseTypeSetCategoryFixture: CaseDbCaseTypeSetCategory = { id: CATEGORY_ID, name: 'Category one' } as CaseDbCaseTypeSetCategory;
const dimFixture: CaseDbDim = { id: DIM_ID, label: 'Dimension one' } as CaseDbDim;
const colFixture: CaseDbCol = { case_type_id: CASE_TYPE_ONE_ID, dim_id: DIM_ID, id: COL_ID, label: 'Column one' } as CaseDbCol;
const colSetReadFixture: CaseDbColSet = { id: COL_SET_READ_ID, name: 'Read set' };
const colSetMemberFixture: CaseDbColSetMember = { col_id: COL_ID, col_set_id: COL_SET_READ_ID, id: createId(902) };
const missingColSetMemberFixture: CaseDbColSetMember = { col_id: COL_ID, col_set_id: MISSING_COL_SET_ID, id: createId(903) };
const dataCollectionOneFixture: CaseDbDataCollection = { id: DATA_COLLECTION_ONE_ID, name: 'Data collection one' };
const dataCollectionTwoFixture: CaseDbDataCollection = { id: DATA_COLLECTION_TWO_ID, name: 'Data collection two' };

type CaseTypeSetDefinition = {
  readonly caseTypeIds: string[];
  readonly id: string;
  readonly name: string;
};

const SET_ONE_DEFINITION: CaseTypeSetDefinition = { caseTypeIds: [CASE_TYPE_ONE_ID], id: SET_ONE_ID, name: 'Set one' };

const createCaseTypeSets = (definitions: CaseTypeSetDefinition[]): CaseDbCaseTypeSet[] => definitions.map(definition => ({
  case_type_set_category_id: CATEGORY_ID,
  id: definition.id,
  name: definition.name,
}) as CaseDbCaseTypeSet);

const createCaseTypeSetMembers = (definitions: CaseTypeSetDefinition[]): CaseDbCaseTypeSetMember[] => definitions.flatMap((definition, definitionIndex) => definition.caseTypeIds.map((caseTypeId, memberIndex) => ({
  case_type_id: caseTypeId,
  case_type_set_id: definition.id,
  id: createId(1000 + definitionIndex * 10 + memberIndex),
})));

const createOrganizationAccessPolicy = (caseTypeSetId: string, overrides: Partial<CaseDbOrganizationAccessCasePolicy> = {}): CaseDbOrganizationAccessCasePolicy => ({
  add_case: true,
  add_case_set: true,
  case_type_set_id: caseTypeSetId,
  data_collection_id: DATA_COLLECTION_ONE_ID,
  id: createId(811),
  is_active: true,
  is_private: false,
  organization_id: ORGANIZATION_ID,
  read_case_set: true,
  read_col_set_id: COL_SET_READ_ID,
  remove_case: true,
  remove_case_set: true,
  write_case_set: true,
  write_col_set_id: COL_SET_READ_ID,
  ...overrides,
});

const createOrganizationSharePolicy = (caseTypeSetId: string): CaseDbOrganizationShareCasePolicy => ({
  add_case: true,
  add_case_set: true,
  case_type_set_id: caseTypeSetId,
  data_collection_id: DATA_COLLECTION_ONE_ID,
  from_data_collection_id: DATA_COLLECTION_TWO_ID,
  id: createId(812),
  is_active: true,
  organization_id: ORGANIZATION_ID,
  remove_case: true,
  remove_case_set: true,
});

const createUserSharePolicy = (caseTypeSetId: string, overrides: Partial<CaseDbUserShareCasePolicy> = {}): CaseDbUserShareCasePolicy => ({
  add_case: false,
  add_case_set: false,
  case_type_set_id: caseTypeSetId,
  data_collection_id: DATA_COLLECTION_ONE_ID,
  from_data_collection_id: DATA_COLLECTION_TWO_ID,
  id: createId(821),
  is_active: true,
  remove_case: false,
  remove_case_set: false,
  user_id: USER_ID,
  ...overrides,
});

const createUserAccessPolicy = (caseTypeSetId: string, overrides: Partial<CaseDbUserAccessCasePolicy> = {}): CaseDbUserAccessCasePolicy => ({
  add_case: true,
  add_case_set: false,
  case_type_set_id: caseTypeSetId,
  data_collection_id: DATA_COLLECTION_ONE_ID,
  id: createId(801),
  is_active: true,
  read_case_set: true,
  read_col_set_id: COL_SET_READ_ID,
  remove_case: false,
  remove_case_set: false,
  user_id: USER_ID,
  write_case_set: false,
  write_col_set_id: null,
  ...overrides,
});

type PageFixture = {
  readonly caseTypeSetDefinitions?: CaseTypeSetDefinition[];
  readonly colSets?: CaseDbColSet[];
  readonly dataCollections?: CaseDbDataCollection[];
  readonly organizationAccessPolicies?: CaseDbOrganizationAccessCasePolicy[];
  readonly organizationSharePolicies?: CaseDbOrganizationShareCasePolicy[];
  readonly userAccessPolicies?: CaseDbUserAccessCasePolicy[];
  readonly userDelayMs?: number;
  readonly userSharePolicies?: CaseDbUserShareCasePolicy[];
};

const PERMISSIONS: CommonDbApiPermission[] = [];

const renderPage = async ({
  caseTypeSetDefinitions = [SET_ONE_DEFINITION],
  colSets = [colSetReadFixture],
  dataCollections = [dataCollectionOneFixture, dataCollectionTwoFixture],
  organizationAccessPolicies = [createOrganizationAccessPolicy(SET_ONE_ID)],
  organizationSharePolicies = [createOrganizationSharePolicy(SET_ONE_ID)],
  userAccessPolicies = [createUserAccessPolicy(SET_ONE_ID)],
  userDelayMs = 0,
  userSharePolicies = [],
}: PageFixture = {}) => {
  mockApiRequest('GET', `/v1/users/${USER_ID}`, async () => {
    await new Promise(resolve => setTimeout(resolve, userDelayMs));
    return Response.json(userFixture);
  });
  mockOrganizations();
  mockApiRequest('GET', '/v1/organization_access_case_policies', () => Response.json(organizationAccessPolicies));
  mockApiRequest('GET', '/v1/organization_share_case_policies', () => Response.json(organizationSharePolicies));
  mockApiRequest('GET', '/v1/user_access_case_policies', () => Response.json(userAccessPolicies));
  mockApiRequest('GET', '/v1/user_share_case_policies', () => Response.json(userSharePolicies));
  mockApiRequest('GET', '/v1/case_type_set_members', () => Response.json(createCaseTypeSetMembers(caseTypeSetDefinitions)));
  mockApiRequest('GET', '/v1/case_type_sets', () => Response.json(createCaseTypeSets(caseTypeSetDefinitions)));
  mockApiRequest('GET', '/v1/case_type_set_categories', () => Response.json([caseTypeSetCategoryFixture]));
  mockApiRequest('GET', '/v1/case_types', () => Response.json(caseTypeFixtures));
  mockApiRequest('GET', '/v1/col_set_members', () => Response.json([colSetMemberFixture, missingColSetMemberFixture]));
  mockApiRequest('GET', '/v1/col_sets', () => Response.json(colSets));
  mockApiRequest('GET', '/v1/cols', () => Response.json([colFixture]));
  mockApiRequest('GET', '/v1/dims', () => Response.json([dimFixture]));
  mockApiRequest('GET', '/v1/data_collections', () => Response.json(dataCollections));

  return await renderRoutedPage(
    <UserEffectiveRightsAdminPage />, {
      path: ROUTE_PATH,
      permissions: PERMISSIONS,
      url: `/management/users/${USER_ID}/effective-rights`,
    },
  );
};

describe('UserEffectiveRightsAdminPage', () => {
  it('shows the effective rights of the user', async () => {
    const screen = await renderPage();

    await expect.element(screen.getByRole('heading', { name: /Alice \(alice\) effective rights/ })).toBeVisible();
    await expect.element(screen.getByRole('link', { exact: true, name: 'Category one | Set one' })).toBeVisible();
    await expect.element(screen.getByRole('link', { exact: true, name: 'Read set' })).toBeVisible();
  });

  it('opens the details dialog when a set link is clicked', async () => {
    const screen = await renderPage();

    await screen.getByRole('link', { exact: true, name: 'Category one | Set one' }).click();

    await expect.element(screen.getByRole('dialog')).toBeVisible();
  });

  it('opens the details dialog when a row is clicked', async () => {
    const screen = await renderPage();

    await screen.getByText('Data collection one', { exact: true }).click();

    await expect.element(screen.getByRole('dialog')).toBeVisible();
  });

  it('uses the data collection id as row name when the data collection is unknown and page events are enabled', async () => {
    const screen = await renderPage({
      dataCollections: [dataCollectionOneFixture],
      organizationAccessPolicies: [createOrganizationAccessPolicy(SET_ONE_ID, { data_collection_id: DATA_COLLECTION_TWO_ID })],
      organizationSharePolicies: [],
      userAccessPolicies: [createUserAccessPolicy(SET_ONE_ID, { data_collection_id: DATA_COLLECTION_TWO_ID })],
    });
    const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
    const originalEnablePageEvents = config.enablePageEvents;
    config.enablePageEvents = true;

    try {
      await screen.getByRole('row', { name: /Read set/ }).click();

      await expect.element(screen.getByRole('dialog')).toBeVisible();
    } finally {
      config.enablePageEvents = originalEnablePageEvents;
    }
  });

  it('applies active user share policies of the user to the effective rights', async () => {
    const screen = await renderPage({
      organizationAccessPolicies: [createOrganizationAccessPolicy(SET_ONE_ID)],
      organizationSharePolicies: [],
      userAccessPolicies: [createUserAccessPolicy(SET_ONE_ID)],
      userSharePolicies: [createUserSharePolicy(SET_ONE_ID)],
    });

    await expect.element(screen.getByRole('row', { name: /Read set/ })).toBeVisible();
  });

  it('shows a view all link when some case types are not part of a set', async () => {
    const screen = await renderPage({
      caseTypeSetDefinitions: [
        { caseTypeIds: [CASE_TYPE_ONE_ID, CASE_TYPE_TWO_ID], id: SET_TWO_ID, name: 'Set two' },
        { caseTypeIds: [CASE_TYPE_ONE_ID, CASE_TYPE_THREE_ID], id: SET_THREE_ID, name: 'Set three' },
      ],
      organizationAccessPolicies: [createOrganizationAccessPolicy(SET_TWO_ID)],
      organizationSharePolicies: [],
      userAccessPolicies: [createUserAccessPolicy(SET_THREE_ID)],
    });

    await expect.element(screen.getByRole('link', { exact: true, name: 'View all' })).toBeVisible();
  });

  it('shows the number of sets when more than two sets apply', async () => {
    const screen = await renderPage({
      caseTypeSetDefinitions: [
        { caseTypeIds: [CASE_TYPE_ONE_ID, CASE_TYPE_TWO_ID, CASE_TYPE_THREE_ID, CASE_TYPE_FOUR_ID], id: SET_FOUR_ID, name: 'Set four' },
        { caseTypeIds: [CASE_TYPE_ONE_ID, CASE_TYPE_TWO_ID, CASE_TYPE_THREE_ID, CASE_TYPE_FIVE_ID], id: SET_FIVE_ID, name: 'Set five' },
        { caseTypeIds: [CASE_TYPE_ONE_ID, CASE_TYPE_TWO_ID], id: SET_SIX_ID, name: 'Set six' },
        { caseTypeIds: [CASE_TYPE_TWO_ID, CASE_TYPE_THREE_ID], id: SET_SEVEN_ID, name: 'Set seven' },
        { caseTypeIds: [CASE_TYPE_ONE_ID, CASE_TYPE_THREE_ID], id: SET_EIGHT_ID, name: 'Set eight' },
      ],
      organizationAccessPolicies: [createOrganizationAccessPolicy(SET_FOUR_ID)],
      organizationSharePolicies: [],
      userAccessPolicies: [createUserAccessPolicy(SET_FIVE_ID)],
    });

    await expect.element(screen.getByRole('link', { exact: true, name: 'View 3 sets' })).toBeVisible();
  });

  it('shows the id of a write column set that is not in the column set list', async () => {
    const screen = await renderPage({
      organizationAccessPolicies: [createOrganizationAccessPolicy(SET_ONE_ID, { write_col_set_id: MISSING_COL_SET_ID })],
      userAccessPolicies: [createUserAccessPolicy(SET_ONE_ID, { write_col_set_id: MISSING_COL_SET_ID })],
    });

    await expect.element(screen.getByRole('link', { exact: true, name: MISSING_COL_SET_ID })).toBeVisible();
  });

  it('shows the id of a read column set that is not in the column set list', async () => {
    const screen = await renderPage({
      organizationAccessPolicies: [createOrganizationAccessPolicy(SET_ONE_ID, { read_col_set_id: MISSING_COL_SET_ID })],
      userAccessPolicies: [createUserAccessPolicy(SET_ONE_ID, { read_col_set_id: MISSING_COL_SET_ID })],
    });

    await expect.element(screen.getByRole('link', { exact: true, name: MISSING_COL_SET_ID })).toBeVisible();
  });

  it('renders the rights once the user has loaded after the policies', async () => {
    const screen = await renderPage({ userDelayMs: 300 });

    await expect.element(screen.getByRole('heading', { name: /Alice \(alice\) effective rights/ })).toBeVisible();
    await expect.element(screen.getByRole('link', { exact: true, name: 'Category one | Set one' })).toBeVisible();
  });
});
