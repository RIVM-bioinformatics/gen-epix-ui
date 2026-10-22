import {
  act,
  renderHook,
  waitFor,
} from '@testing-library/react';
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { createElement } from 'react';
import type { PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  CaseDbCaseApi,
  CaseDbOrganizationApi,
} from '@gen-epix/api-casedb';
import type {
  CaseDbCaseTypeSet,
  CaseDbCaseTypeSetCategory,
  CaseDbDataCollection,
  CaseDbOrganizationAccessCasePolicy,
  CaseDbOrganizationShareCasePolicy,
} from '@gen-epix/api-casedb';
import type {
  CommonDbOrganization,
  CommonDbOrganizationApi,
} from '@gen-epix/api-commondb';
import { container } from 'tsyringe';
import { API_ORGANIZATION_TOKEN } from '@gen-epix/ui-client-common/constants/api.constants';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import { useOrganizationCasePolicyNameFactory } from './useOrganizationCasePolicyNameFactory';

type HookContextOptions = {
  caseTypeSetCategories?: CaseDbCaseTypeSetCategory[];
  caseTypeSets?: CaseDbCaseTypeSet[];
  dataCollections?: CaseDbDataCollection[];
  organizationError?: Error;
  organizations?: CommonDbOrganization[];
};

const createOrganizationAccessPolicy = (organizationId: string): CaseDbOrganizationAccessCasePolicy => ({
  add_case: false,
  add_case_set: false,
  case_type_set_id: 'case-type-set-1',
  data_collection_id: 'data-collection-1',
  is_active: true,
  is_private: false,
  organization_id: organizationId,
  read_case_set: false,
  remove_case: false,
  remove_case_set: false,
  write_case_set: false,
});

const createOrganizationSharePolicy = (organizationId: string): CaseDbOrganizationShareCasePolicy => ({
  add_case: false,
  add_case_set: false,
  case_type_set_id: 'case-type-set-1',
  data_collection_id: 'data-collection-1',
  from_data_collection_id: 'source-data-collection-1',
  is_active: true,
  organization_id: organizationId,
  remove_case: false,
  remove_case_set: false,
});

const createHookContext = ({
  caseTypeSetCategories = [{ id: 'category-1', name: 'Category one', rank: 1 }],
  caseTypeSets = [{ case_type_set_category_id: 'category-1', id: 'case-type-set-1', name: 'Case type set one', rank: 1 }],
  dataCollections = [{ id: 'data-collection-1', name: 'Collection one' }],
  organizationError,
  organizations = [{ code: 'organization-1', id: 'organization-1', name: 'Organization one' }],
}: HookContextOptions = {}) => {
  const organizationsGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => {
    if (organizationError) {
      return Promise.reject(organizationError);
    }
    return Promise.resolve({ data: organizations, signal });
  });
  const dataCollectionsGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => Promise.resolve({ data: dataCollections, signal }));
  const caseTypeSetsGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => Promise.resolve({ data: caseTypeSets, signal }));
  const caseTypeSetCategoriesGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => Promise.resolve({ data: caseTypeSetCategories, signal }));
  const queryClientService = new QueryClientService({
    config: {
      queryClient: {
        retry: () => false,
        retryDelay: () => 0,
      },
    },
    queryKeyDependencies: [],
  });
  container.registerInstance(API_ORGANIZATION_TOKEN, { organizationsGetAll } as unknown as CommonDbOrganizationApi);
  container.registerInstance(CaseDbOrganizationApi, { dataCollectionsGetAll } as unknown as CaseDbOrganizationApi);
  container.registerInstance(CaseDbCaseApi, { caseTypeSetCategoriesGetAll, caseTypeSetsGetAll } as unknown as CaseDbCaseApi);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    dispose: () => queryClientService.queryClient.clear(),
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useOrganizationCasePolicyNameFactory', () => {
  it('creates access and share policy names from their mapped values', async () => {
    const { dispose, wrapper } = createHookContext();
    const { result, unmount } = renderHook(() => useOrganizationCasePolicyNameFactory(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.getName(createOrganizationAccessPolicy('organization-1'))).toBe('Organization one -> Collection one -> Case type set one');
    expect(result.current.getName(createOrganizationSharePolicy('organization-1'))).toBe('Organization one -> Collection one -> Case type set one');

    act(() => unmount());
    dispose();
  });

  it('falls back to IDs when the related maps do not contain a policy entry', async () => {
    const { dispose, wrapper } = createHookContext({
      caseTypeSets: [],
      dataCollections: [],
      organizations: [],
    });
    const { result, unmount } = renderHook(() => useOrganizationCasePolicyNameFactory(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.getName(createOrganizationAccessPolicy('organization-1'))).toBe('organization-1 -> data-collection-1 -> case-type-set-1');

    act(() => unmount());
    dispose();
  });

  it('falls back to the organization ID when its lookup fails', async () => {
    const { dispose, wrapper } = createHookContext({ organizationError: new Error('Organizations unavailable') });
    const { result, unmount } = renderHook(() => useOrganizationCasePolicyNameFactory(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.getName(createOrganizationAccessPolicy('organization-1'))).toBe('organization-1 -> Collection one -> Case type set one');

    act(() => unmount());
    dispose();
  });
});
