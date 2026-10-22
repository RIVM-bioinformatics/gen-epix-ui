import {
  describe,
  expect,
  it,
} from 'vitest';
import type {
  CaseDbCaseTypeSetMember,
  CaseDbColSetMember,
  CaseDbOrganizationAccessCasePolicy,
  CaseDbOrganizationShareCasePolicy,
  CaseDbUser,
  CaseDbUserAccessCasePolicy,
  CaseDbUserShareCasePolicy,
} from '@gen-epix/api-casedb';

import { EffectiveRightsUtil } from './EffectiveRightsUtil';

type AssembleArgs = Parameters<typeof EffectiveRightsUtil.assembleUserEffectiveRights>[0];

const createUser = (): CaseDbUser => ({ id: 'user-1' } as CaseDbUser);

const createOrganizationAccessPolicy = (
  overrides: Partial<CaseDbOrganizationAccessCasePolicy> = {},
): CaseDbOrganizationAccessCasePolicy => ({
  add_case: true,
  add_case_set: true,
  case_type_set_id: 'org-case-types',
  data_collection_id: 'collection-1',
  is_active: true,
  is_private: false,
  organization_id: 'organization-1',
  read_case_set: true,
  read_col_set_id: 'org-read-cols',
  remove_case: true,
  remove_case_set: true,
  write_case_set: true,
  write_col_set_id: 'org-write-cols',
  ...overrides,
});

const createOrganizationSharePolicy = (
  overrides: Partial<CaseDbOrganizationShareCasePolicy> = {},
): CaseDbOrganizationShareCasePolicy => ({
  add_case: true,
  add_case_set: true,
  case_type_set_id: 'org-share-case-types',
  data_collection_id: 'collection-1',
  from_data_collection_id: 'collection-2',
  is_active: true,
  organization_id: 'organization-1',
  remove_case: true,
  remove_case_set: true,
  ...overrides,
});

const createUserAccessPolicy = (
  overrides: Partial<CaseDbUserAccessCasePolicy> = {},
): CaseDbUserAccessCasePolicy => ({
  add_case: true,
  add_case_set: true,
  case_type_set_id: 'user-case-types',
  data_collection_id: 'collection-1',
  read_case_set: true,
  read_col_set_id: 'user-read-cols',
  remove_case: true,
  remove_case_set: true,
  write_case_set: true,
  write_col_set_id: 'user-write-cols',
  ...overrides,
} as CaseDbUserAccessCasePolicy);

const createUserSharePolicy = (
  overrides: Partial<CaseDbUserShareCasePolicy> = {},
): CaseDbUserShareCasePolicy => ({
  add_case: true,
  add_case_set: true,
  case_type_set_id: 'user-share-case-types',
  data_collection_id: 'collection-1',
  from_data_collection_id: 'collection-2',
  remove_case: false,
  remove_case_set: true,
  ...overrides,
} as CaseDbUserShareCasePolicy);

const createArgs = (overrides: Partial<AssembleArgs> = {}): AssembleArgs => ({
  caseTypeSetMembers: [],
  colSetMembers: [],
  organizationAccessCasePolicies: [],
  organizationShareCasePolicies: [],
  user: createUser(),
  userAccessCasePolicies: [],
  userShareCasePolicies: [],
  ...overrides,
});

const createCaseTypeSetMember = (caseTypeSetId: string, caseTypeId: string): CaseDbCaseTypeSetMember => ({
  case_type_id: caseTypeId,
  case_type_set_id: caseTypeSetId,
});

const createColSetMember = (colSetId: string, colId: string): CaseDbColSetMember => ({
  col_id: colId,
  col_set_id: colSetId,
});

describe('EffectiveRightsUtil.assembleUserEffectiveRights', () => {
  it('returns no rights when the user is absent', () => {
    expect(EffectiveRightsUtil.assembleUserEffectiveRights(createArgs({
      user: null,
    }))).toEqual([]);
  });

  it.each([
    ['organization access policies', { organizationAccessCasePolicies: undefined }],
    ['organization share policies', { organizationShareCasePolicies: undefined }],
    ['user access policies', { userAccessCasePolicies: undefined }],
    ['user share policies', { userShareCasePolicies: undefined }],
    ['case-type set members', { caseTypeSetMembers: undefined }],
    ['column-set members', { colSetMembers: undefined }],
  ])('returns no rights when %s are unavailable', (_label, missing) => {
    expect(EffectiveRightsUtil.assembleUserEffectiveRights(createArgs(missing as unknown as Partial<AssembleArgs>))).toEqual([]);
  });

  it('combines access and matching share policies with categorized members', () => {
    const result = EffectiveRightsUtil.assembleUserEffectiveRights(createArgs({
      caseTypeSetMembers: [
        createCaseTypeSetMember('org-case-types', 'case-type-1'),
        createCaseTypeSetMember('org-case-types', 'case-type-2'),
        createCaseTypeSetMember('org-case-types', 'case-type-3'),
        createCaseTypeSetMember('user-case-types', 'case-type-1'),
        createCaseTypeSetMember('user-case-types', 'case-type-2'),
        createCaseTypeSetMember('org-share-case-types', 'case-type-1'),
        createCaseTypeSetMember('org-share-case-types', 'case-type-2'),
        createCaseTypeSetMember('user-share-case-types', 'case-type-1'),
        createCaseTypeSetMember('user-share-case-types', 'case-type-2'),
      ],
      colSetMembers: [
        createColSetMember('org-read-cols', 'read-1'),
        createColSetMember('org-read-cols', 'read-2'),
        createColSetMember('org-write-cols', 'write-1'),
        createColSetMember('org-write-cols', 'write-2'),
        createColSetMember('user-read-cols', 'read-1'),
        createColSetMember('user-write-cols', 'write-2'),
      ],
      organizationAccessCasePolicies: [createOrganizationAccessPolicy()],
      organizationShareCasePolicies: [createOrganizationSharePolicy()],
      userAccessCasePolicies: [createUserAccessPolicy()],
      userShareCasePolicies: [createUserSharePolicy({ remove_case: false })],
    }));

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      add_case: true,
      add_case_set: true,
      case_type_set_ids: ['user-case-types'],
      categorized_case_type_ids: ['case-type-1', 'case-type-2'],
      categorized_read_col_ids: ['read-1'],
      categorized_write_col_ids: ['write-2'],
      data_collection_id: 'collection-1',
      effective_share_case_rights: [{
        add_case: true,
        add_case_set: true,
        case_type_set_ids: ['org-share-case-types'],
        categorized_case_type_ids: ['case-type-1', 'case-type-2'],
        from_data_collection_id: 'collection-2',
        remove_case: false,
        remove_case_set: true,
        uncategorized_case_type_ids: [],
      }],
      is_private: false,
      organization_id: 'organization-1',
      read_case_set: true,
      read_col_set_id: 'org-read-cols',
      read_col_set_ids: ['user-read-cols'],
      remove_case: true,
      remove_case_set: true,
      uncategorized_case_type_ids: [],
      uncategorized_read_col_ids: [],
      uncategorized_write_col_ids: [],
      write_case_set: true,
      write_col_set_id: 'org-write-cols',
      write_col_set_ids: ['user-write-cols'],
    });
  });

  it('omits share rights when no matching user policy grants an action', () => {
    const result = EffectiveRightsUtil.assembleUserEffectiveRights(createArgs({
      organizationAccessCasePolicies: [createOrganizationAccessPolicy()],
      organizationShareCasePolicies: [createOrganizationSharePolicy()],
      userAccessCasePolicies: [createUserAccessPolicy()],
      userShareCasePolicies: [],
    }));

    expect(result[0]?.effective_share_case_rights).toEqual([]);
  });

  it('returns an empty list when there are no organization access policies', () => {
    expect(EffectiveRightsUtil.assembleUserEffectiveRights(createArgs())).toEqual([]);
  });
});

describe('EffectiveRightsUtil.getMatchingOrganizationShareCasePolicies', () => {
  it('returns only active policies matching both organization and data collection', () => {
    const matching = createOrganizationSharePolicy();

    expect(EffectiveRightsUtil.getMatchingOrganizationShareCasePolicies({
      dataCollectionId: 'collection-1',
      organizationId: 'organization-1',
      organizationShareCasePolicies: [
        matching,
        createOrganizationSharePolicy({ is_active: false }),
        createOrganizationSharePolicy({ data_collection_id: 'other-collection' }),
        createOrganizationSharePolicy({ organization_id: 'other-organization' }),
      ],
    })).toEqual([matching]);
  });

  it('returns no matches when the policy list is absent', () => {
    expect(EffectiveRightsUtil.getMatchingOrganizationShareCasePolicies({
      dataCollectionId: 'collection-1',
      organizationId: 'organization-1',
      organizationShareCasePolicies: undefined,
    })).toEqual([]);
  });
});

describe('EffectiveRightsUtil.getOrganizationPolicyGroups', () => {
  it('returns no groups when either policy collection is unavailable', () => {
    expect(EffectiveRightsUtil.getOrganizationPolicyGroups({
      organizationAccessCasePolicies: undefined,
      organizationShareCasePolicies: [],
    })).toEqual([]);
    expect(EffectiveRightsUtil.getOrganizationPolicyGroups({
      organizationAccessCasePolicies: [],
      organizationShareCasePolicies: undefined,
    })).toEqual([]);
  });

  it('groups active access policies by organization and collection with active shares', () => {
    const firstAccess = createOrganizationAccessPolicy();
    const secondAccess = createOrganizationAccessPolicy({ add_case: false });
    const otherCollectionAccess = createOrganizationAccessPolicy({ data_collection_id: 'collection-2' });
    const matchingShare = createOrganizationSharePolicy();

    expect(EffectiveRightsUtil.getOrganizationPolicyGroups({
      organizationAccessCasePolicies: [
        firstAccess,
        secondAccess,
        createOrganizationAccessPolicy({ is_active: false, organization_id: 'inactive' }),
        otherCollectionAccess,
      ],
      organizationShareCasePolicies: [
        matchingShare,
        createOrganizationSharePolicy({ organization_id: 'other-organization' }),
        createOrganizationSharePolicy({ data_collection_id: 'collection-2', is_active: false }),
      ],
    })).toEqual([
      {
        access_case_policies: [firstAccess, secondAccess],
        data_collection_id: 'collection-1',
        organization_id: 'organization-1',
        share_case_policies: [matchingShare],
      },
      {
        access_case_policies: [otherCollectionAccess],
        data_collection_id: 'collection-2',
        organization_id: 'organization-1',
        share_case_policies: [],
      },
    ]);
  });
});
