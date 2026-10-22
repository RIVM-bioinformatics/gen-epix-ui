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
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import type { CaseDbCaseSetCategory } from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import {
  useCaseSetCategoriesQuery,
  useCaseSetCategoryMapQuery,
  useCaseSetCategoryOptionsQuery,
} from './useCaseSetCategoriesQuery';

const createCategory = (id: string, name: string, rank?: number): CaseDbCaseSetCategory => ({
  description: null,
  id,
  name,
  ...(rank === undefined ? {} : { rank }),
});

const createHookContext = (categories: CaseDbCaseSetCategory[], error?: Error) => {
  const caseSetCategoriesGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => {
    if (error) {
      return Promise.reject(error);
    }
    return Promise.resolve({ data: categories, signal });
  });
  const queryClientService = new QueryClientService({
    config: {
      queryClient: {
        retry: () => false,
        retryDelay: () => 0,
      },
    },
    queryKeyDependencies: [],
  });
  container.registerInstance(CaseDbCaseApi, { caseSetCategoriesGetAll } as unknown as CaseDbCaseApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    caseSetCategoriesGetAll,
    dispose: () => queryClientService.queryClient.clear(),
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useCaseSetCategoriesQuery', () => {
  it('loads categories and passes the abort signal to the API', async () => {
    const categories = [createCategory('category-1', 'Category one', 1)];
    const { caseSetCategoriesGetAll, dispose, wrapper } = createHookContext(categories);
    const { result, unmount } = renderHook(() => useCaseSetCategoriesQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(categories);
    expect(caseSetCategoriesGetAll).toHaveBeenCalledOnce();
    expect(caseSetCategoriesGetAll.mock.calls[0]?.[2].signal).toBeInstanceOf(AbortSignal);

    act(() => unmount());
    dispose();
  });

  it('exposes category API failures', async () => {
    const error = new Error('Categories unavailable');
    const { dispose, wrapper } = createHookContext([], error);
    const { result, unmount } = renderHook(() => useCaseSetCategoriesQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    act(() => unmount());
    dispose();
  });
});

describe('useCaseSetCategoryMapQuery', () => {
  it('maps categories by ID', async () => {
    const categories = [createCategory('category-1', 'Category one'), createCategory('category-2', 'Category two')];
    const { dispose, wrapper } = createHookContext(categories);
    const { result, unmount } = renderHook(() => useCaseSetCategoryMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(2);
    expect(result.current.map.get('category-1')).toEqual(categories[0]);

    act(() => unmount());
    dispose();
  });

  it('returns an empty map when category loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], new Error('Categories unavailable'));
    const { result, unmount } = renderHook(() => useCaseSetCategoryMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(0);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});

describe('useCaseSetCategoryOptionsQuery', () => {
  it('sorts category options by rank and then name', async () => {
    const categories = [
      createCategory('category-3', 'Zulu category', 2),
      createCategory('category-2', 'Beta category', 1),
      createCategory('category-1', 'Alpha category'),
    ];
    const { dispose, wrapper } = createHookContext(categories);
    const { result, unmount } = renderHook(() => useCaseSetCategoryOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([
      { label: 'Alpha category', value: 'category-1' },
      { label: 'Beta category', value: 'category-2' },
      { label: 'Zulu category', value: 'category-3' },
    ]);

    act(() => unmount());
    dispose();
  });

  it('returns empty options when category loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], new Error('Categories unavailable'));
    const { result, unmount } = renderHook(() => useCaseSetCategoryOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});
