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
  CaseDbCol,
  CaseDbDim,
} from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import {
  useColMapQuery,
  useColNameFactory,
  useColOptionsQuery,
  useColsQuery,
} from './useColsQuery';

type HookContextOptions = {
  caseTypeError?: Error;
  caseTypes?: CaseDbCaseType[];
  colError?: Error;
  cols?: CaseDbCol[];
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

const createCol = (id: string, caseTypeId: string, dimId: string, label: string, rank = 1): CaseDbCol => ({
  case_type_id: caseTypeId,
  code: id,
  dim_id: dimId,
  id,
  label,
  rank,
  ref_col_id: `ref-${id}`,
});

const createHookContext = ({
  caseTypeError,
  caseTypes = [],
  colError,
  cols = [],
  dimError,
  dims = [],
}: HookContextOptions = {}) => {
  const caseTypesGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => {
    if (caseTypeError) {
      return Promise.reject(caseTypeError);
    }
    return Promise.resolve({ data: caseTypes, signal });
  });
  const colsGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => {
    if (colError) {
      return Promise.reject(colError);
    }
    return Promise.resolve({ data: cols, signal });
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
  container.registerInstance(CaseDbCaseApi, { caseTypesGetAll, colsGetAll, dimsGetAll } as unknown as CaseDbCaseApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    caseTypesGetAll,
    colsGetAll,
    dimsGetAll,
    dispose: () => queryClientService.queryClient.clear(),
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useColsQuery', () => {
  it('loads columns and passes the abort signal to the API', async () => {
    const cols = [createCol('col-1', 'type-1', 'dim-1', 'Field one')];
    const { colsGetAll, dispose, wrapper } = createHookContext({ cols });
    const { result, unmount } = renderHook(() => useColsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(cols);
    expect(colsGetAll).toHaveBeenCalledWith(null, null, expect.anything());
    expect(colsGetAll.mock.calls[0]?.[2].signal).toBeInstanceOf(AbortSignal);

    act(() => unmount());
    dispose();
  });

  it('exposes API failures', async () => {
    const error = new Error('Columns unavailable');
    const { dispose, wrapper } = createHookContext({ colError: error });
    const { result, unmount } = renderHook(() => useColsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    act(() => unmount());
    dispose();
  });
});

describe('useColMapQuery', () => {
  it('maps columns by ID', async () => {
    const cols = [
      createCol('col-1', 'type-1', 'dim-1', 'Field one'),
      createCol('col-2', 'type-1', 'dim-1', 'Field two'),
    ];
    const { dispose, wrapper } = createHookContext({ cols });
    const { result, unmount } = renderHook(() => useColMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(2);
    expect(result.current.map.get('col-1')).toEqual(cols[0]);

    act(() => unmount());
    dispose();
  });

  it('returns an empty map when loading fails', async () => {
    const { dispose, wrapper } = createHookContext({ colError: new Error('Columns unavailable') });
    const { result, unmount } = renderHook(() => useColMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(0);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});

describe('useColNameFactory', () => {
  it('uses mapped names and falls back to IDs when either mapping is missing', async () => {
    const caseTypes = [createCaseType('type-1', 'Case type one')];
    const dims = [createDim('dim-1', 'type-1', 'Dimension one')];
    const { dispose, wrapper } = createHookContext({ caseTypes, dims });
    const { result, unmount } = renderHook(() => useColNameFactory(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.getName(createCol('col-1', 'type-1', 'dim-1', 'Field one'))).toBe('Case type one -> Dimension one -> Field one');
    expect(result.current.getName(createCol('col-2', 'missing-type', 'dim-1', 'Field two'))).toBe('missing-type -> Dimension one -> Field two');
    expect(result.current.getName(createCol('col-3', 'type-1', 'missing-dim', 'Field three'))).toBe('Case type one -> missing-dim -> Field three');

    act(() => unmount());
    dispose();
  });

  it('surfaces dependent lookup errors and retains ID fallbacks', async () => {
    const { dispose, wrapper } = createHookContext({ caseTypeError: new Error('Case types unavailable') });
    const { result, unmount } = renderHook(() => useColNameFactory(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.getName(createCol('col-1', 'type-1', 'dim-1', 'Field one'))).toBe('type-1 -> dim-1 -> Field one');

    act(() => unmount());
    dispose();
  });
});

describe('useColOptionsQuery', () => {
  it('creates options with mapped names sorted by rank', async () => {
    const caseTypes = [createCaseType('type-1', 'Case type one')];
    const dims = [createDim('dim-1', 'type-1', 'Dimension one')];
    const cols = [
      createCol('col-2', 'type-1', 'dim-1', 'Field two', 2),
      createCol('col-1', 'type-1', 'dim-1', 'Field one', 1),
    ];
    const { dispose, wrapper } = createHookContext({ caseTypes, cols, dims });
    const { result, unmount } = renderHook(() => useColOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([
      { label: 'Case type one -> Dimension one -> Field one', value: 'col-1' },
      { label: 'Case type one -> Dimension one -> Field two', value: 'col-2' },
    ]);

    act(() => unmount());
    dispose();
  });

  it('returns empty options when column loading fails', async () => {
    const { dispose, wrapper } = createHookContext({ colError: new Error('Columns unavailable') });
    const { result, unmount } = renderHook(() => useColOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});
