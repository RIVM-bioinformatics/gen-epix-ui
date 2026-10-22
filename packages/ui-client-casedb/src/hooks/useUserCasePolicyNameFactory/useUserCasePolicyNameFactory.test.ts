import {
  act,
  renderHook,
  waitFor,
} from '@testing-library/react';
import {
  afterEach,
  beforeAll,
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
  CaseDbUserAccessCasePolicy,
  CaseDbUserShareCasePolicy,
} from '@gen-epix/api-casedb';
import type {
  CommonDbOrganizationApi,
  CommonDbUser,
} from '@gen-epix/api-commondb';
import { container } from 'tsyringe';
import i18next from 'i18next';
import { API_ORGANIZATION_TOKEN } from '@gen-epix/ui-client-common/constants/api.constants';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import { useUserCasePolicyNameFactory } from './useUserCasePolicyNameFactory';

type HookContextOptions = {
  caseTypeSetCategories?: CaseDbCaseTypeSetCategory[];
  caseTypeSets?: CaseDbCaseTypeSet[];
  dataCollections?: CaseDbDataCollection[];
  userError?: Error;
  users?: CommonDbUser[];
};

const createUserAccessPolicy = (userId: string): CaseDbUserAccessCasePolicy => ({
  add_case: false,
  add_case_set: false,
  case_type_set_id: 'case-type-set-1',
  data_collection_id: 'data-collection-1',
  is_active: true,
  read_case_set: false,
  remove_case: false,
  remove_case_set: false,
  user_id: userId,
  write_case_set: false,
});

const createUserSharePolicy = (userId: string): CaseDbUserShareCasePolicy => ({
  add_case: false,
  add_case_set: false,
  case_type_set_id: 'case-type-set-1',
  data_collection_id: 'data-collection-1',
  from_data_collection_id: 'source-data-collection-1',
  is_active: true,
  remove_case: false,
  remove_case_set: false,
  user_id: userId,
});

const createHookContext = ({
  caseTypeSetCategories = [{ id: 'category-1', name: 'Category one', rank: 1 }],
  caseTypeSets = [{ case_type_set_category_id: 'category-1', id: 'case-type-set-1', name: 'Case type set one', rank: 1 }],
  dataCollections = [{ id: 'data-collection-1', name: 'Collection one' }],
  userError,
  users = [{ id: 'user-1', key: 'key-1', name: 'User one', organization_id: 'organization-1', roles: [] }],
}: HookContextOptions = {}) => {
  const usersGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => {
    if (userError) {
      return Promise.reject(userError);
    }
    return Promise.resolve({ data: users, signal });
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
  container.registerInstance(API_ORGANIZATION_TOKEN, { usersGetAll } as unknown as CommonDbOrganizationApi);
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

beforeAll(async () => {
  await i18next.init({
    lng: 'en',
    resources: {
      en: {
        translation: {
          'Unknown user': 'Unknown user',
        },
      },
    },
  });
});

afterEach(() => {
  container.clearInstances();
});

describe('useUserCasePolicyNameFactory', () => {
  it('creates names for access and share policies from mapped values', async () => {
    const { dispose, wrapper } = createHookContext();
    const { result, unmount } = renderHook(() => useUserCasePolicyNameFactory(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.getName(createUserAccessPolicy('user-1'))).toBe('User one (key-1) -> Collection one -> Case type set one');
    expect(result.current.getName(createUserSharePolicy('user-1'))).toBe('User one (key-1) -> Collection one -> Case type set one');

    act(() => unmount());
    dispose();
  });

  it('uses safe fallbacks when user, collection, or case-type set is missing', async () => {
    const { dispose, wrapper } = createHookContext({
      caseTypeSets: [],
      dataCollections: [],
      users: [],
    });
    const { result, unmount } = renderHook(() => useUserCasePolicyNameFactory(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.getName(createUserAccessPolicy('missing-user'))).toBe('Unknown user -> data-collection-1 -> case-type-set-1');

    act(() => unmount());
    dispose();
  });

  it('keeps the name factory safe when user lookup fails', async () => {
    const { dispose, wrapper } = createHookContext({ userError: new Error('Users unavailable') });
    const { result, unmount } = renderHook(() => useUserCasePolicyNameFactory(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.getName(createUserSharePolicy('user-1'))).toBe('Unknown user -> Collection one -> Case type set one');

    act(() => unmount());
    dispose();
  });
});
