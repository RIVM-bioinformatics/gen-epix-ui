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
import type {
  CaseDbCaseType,
  CaseDbDim,
} from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import {
  useDimMapQuery,
  useDimNameFactory,
  useDimOptionsQuery,
  useDimsQuery,
} from './useDimsQuery';

type HookContextOptions = {
  caseTypeError?: Error;
  caseTypes?: CaseDbCaseType[];
  dimError?: Error;
  dims?: CaseDbDim[];
};

const createCaseType = (id: string, name: string): CaseDbCaseType => ({ id, name });

const createDim = (id: string, caseTypeId: string, label: string, rank = 1): CaseDbDim => ({
  case_type_id: caseTypeId,
  code: id,
  id,
  label,
  rank,
  ref_dim_id: `ref-${id}`,
});

const createHookContext = ({
  caseTypeError,
  caseTypes = [],
  dimError,
  dims = [],
}: HookContextOptions = {}) => {
  const caseTypesGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => {
    if (caseTypeError) {
      return Promise.reject(caseTypeError);
    }
    return Promise.resolve({ data: caseTypes, signal });
  });
  const dimsGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => {
    if (dimError) {
      return Promise.reject(dimError);
    }
    return Promise.resolve({ data: dims, signal });
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
  container.registerInstance(CaseDbCaseApi, { caseTypesGetAll, dimsGetAll } as unknown as CaseDbCaseApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    caseTypesGetAll,
    dimsGetAll,
    dispose: () => queryClientService.queryClient.clear(),
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useDimsQuery', () => {
  it('loads dimensions and passes the abort signal to the API', async () => {
    const dims = [createDim('dim-1', 'type-1', 'Dimension one')];
    const { dimsGetAll, dispose, wrapper } = createHookContext({ dims });
    const { result, unmount } = renderHook(() => useDimsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(dims);
    expect(dimsGetAll).toHaveBeenCalledWith(null, null, expect.anything());
    expect(dimsGetAll.mock.calls[0]?.[2].signal).toBeInstanceOf(AbortSignal);

    act(() => unmount());
    dispose();
  });

  it('exposes API failures', async () => {
    const error = new Error('Dimensions unavailable');
    const { dispose, wrapper } = createHookContext({ dimError: error });
    const { result, unmount } = renderHook(() => useDimsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    act(() => unmount());
    dispose();
  });
});

describe('useDimMapQuery', () => {
  it('maps dimensions by ID', async () => {
    const dims = [
      createDim('dim-1', 'type-1', 'Dimension one'),
      createDim('dim-2', 'type-1', 'Dimension two'),
    ];
    const { dispose, wrapper } = createHookContext({ dims });
    const { result, unmount } = renderHook(() => useDimMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(2);
    expect(result.current.map.get('dim-1')).toEqual(dims[0]);

    act(() => unmount());
    dispose();
  });

  it('returns an empty map when loading fails', async () => {
    const { dispose, wrapper } = createHookContext({ dimError: new Error('Dimensions unavailable') });
    const { result, unmount } = renderHook(() => useDimMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(0);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});

describe('useDimNameFactory', () => {
  it('uses case-type names and falls back to case-type IDs', async () => {
    const caseTypes = [createCaseType('type-1', 'Case type one')];
    const { dispose, wrapper } = createHookContext({ caseTypes });
    const { result, unmount } = renderHook(() => useDimNameFactory(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.getName(createDim('dim-1', 'type-1', 'Dimension one'))).toBe('Case type one -> Dimension one');
    expect(result.current.getName(createDim('dim-2', 'missing-type', 'Dimension two'))).toBe('missing-type -> Dimension two');

    act(() => unmount());
    dispose();
  });

  it('surfaces case-type lookup failures and retains the ID fallback', async () => {
    const { dispose, wrapper } = createHookContext({ caseTypeError: new Error('Case types unavailable') });
    const { result, unmount } = renderHook(() => useDimNameFactory(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.getName(createDim('dim-1', 'type-1', 'Dimension one'))).toBe('type-1 -> Dimension one');

    act(() => unmount());
    dispose();
  });
});

describe('useDimOptionsQuery', () => {
  it('creates dimension options with case-type names sorted by rank', async () => {
    const caseTypes = [createCaseType('type-1', 'Case type one')];
    const dims = [
      createDim('dim-2', 'type-1', 'Dimension two', 2),
      createDim('dim-1', 'type-1', 'Dimension one', 1),
    ];
    const { dispose, wrapper } = createHookContext({ caseTypes, dims });
    const { result, unmount } = renderHook(() => useDimOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([
      { label: 'Case type one -> Dimension one', value: 'dim-1' },
      { label: 'Case type one -> Dimension two', value: 'dim-2' },
    ]);

    act(() => unmount());
    dispose();
  });

  it('returns empty options when dimension loading fails', async () => {
    const { dispose, wrapper } = createHookContext({ dimError: new Error('Dimensions unavailable') });
    const { result, unmount } = renderHook(() => useDimOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});
