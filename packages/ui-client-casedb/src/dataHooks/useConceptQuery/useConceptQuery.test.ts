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
import { CaseDbOntologyApi } from '@gen-epix/api-casedb';
import type {
  CaseDbConcept,
  CaseDbConceptSet,
} from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import {
  useConceptMapQuery,
  useConceptNameFactory,
  useConceptOptionsQuery,
  useConceptQuery,
} from './useConceptQuery';

const createConcept = (id: string, conceptSetId: string, name: string, rank: number): CaseDbConcept => ({
  code: id,
  concept_set_id: conceptSetId,
  id,
  name,
  rank,
});

const createConceptSet = (id: string, name: string): CaseDbConceptSet => ({
  code: id,
  id,
  name,
  type: 'NOMINAL',
});

type HookContextOptions = {
  conceptError?: Error;
  concepts?: CaseDbConcept[];
  conceptSetError?: Error;
  conceptSets?: CaseDbConceptSet[];
};

const createHookContext = ({
  conceptError,
  concepts = [],
  conceptSetError,
  conceptSets = [],
}: HookContextOptions = {}) => {
  const conceptsGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => {
    if (conceptError) {
      return Promise.reject(conceptError);
    }
    return Promise.resolve({ data: concepts, signal });
  });
  const conceptSetsGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => {
    if (conceptSetError) {
      return Promise.reject(conceptSetError);
    }
    return Promise.resolve({ data: conceptSets, signal });
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
  container.registerInstance(CaseDbOntologyApi, { conceptSetsGetAll, conceptsGetAll } as unknown as CaseDbOntologyApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    conceptsGetAll,
    dispose: () => queryClientService.queryClient.clear(),
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useConceptQuery', () => {
  it('loads concepts and passes the abort signal to the API', async () => {
    const concepts = [createConcept('concept-1', 'set-1', 'Concept one', 1)];
    const { conceptsGetAll, dispose, wrapper } = createHookContext({ concepts });
    const { result, unmount } = renderHook(() => useConceptQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(concepts);
    expect(conceptsGetAll).toHaveBeenCalledWith(null, null, expect.anything());
    expect(conceptsGetAll.mock.calls[0]?.[2].signal).toBeInstanceOf(AbortSignal);

    act(() => unmount());
    dispose();
  });

  it('exposes API failures', async () => {
    const error = new Error('Concepts unavailable');
    const { dispose, wrapper } = createHookContext({ conceptError: error });
    const { result, unmount } = renderHook(() => useConceptQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    act(() => unmount());
    dispose();
  });
});

describe('useConceptMapQuery', () => {
  it('maps concepts by ID', async () => {
    const concepts = [
      createConcept('concept-1', 'set-1', 'Concept one', 1),
      createConcept('concept-2', 'set-1', 'Concept two', 2),
    ];
    const { dispose, wrapper } = createHookContext({ concepts });
    const { result, unmount } = renderHook(() => useConceptMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(2);
    expect(result.current.map.get('concept-1')).toEqual(concepts[0]);

    act(() => unmount());
    dispose();
  });

  it('returns an empty map when loading fails', async () => {
    const { dispose, wrapper } = createHookContext({ conceptError: new Error('Concepts unavailable') });
    const { result, unmount } = renderHook(() => useConceptMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(0);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});

describe('useConceptNameFactory', () => {
  it('uses the concept-set name or falls back to its ID', async () => {
    const conceptSets = [createConceptSet('set-1', 'Set one')];
    const { dispose, wrapper } = createHookContext({ conceptSets });
    const { result, unmount } = renderHook(() => useConceptNameFactory(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.getName(createConcept('concept-1', 'set-1', 'Concept one', 1))).toBe('Set one -> Concept one');
    expect(result.current.getName(createConcept('concept-2', 'missing-set', 'Concept two', 1))).toBe('missing-set -> Concept two');

    act(() => unmount());
    dispose();
  });

  it('surfaces concept-set lookup failures while retaining the ID fallback', async () => {
    const { dispose, wrapper } = createHookContext({ conceptSetError: new Error('Concept sets unavailable') });
    const { result, unmount } = renderHook(() => useConceptNameFactory(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.getName(createConcept('concept-1', 'set-1', 'Concept one', 1))).toBe('set-1 -> Concept one');

    act(() => unmount());
    dispose();
  });
});

describe('useConceptOptionsQuery', () => {
  it('creates concept options sorted by rank with set names', async () => {
    const concepts = [
      createConcept('concept-2', 'set-1', 'Second concept', 2),
      createConcept('concept-1', 'set-1', 'First concept', 1),
    ];
    const conceptSets = [createConceptSet('set-1', 'Set one')];
    const { dispose, wrapper } = createHookContext({ concepts, conceptSets });
    const { result, unmount } = renderHook(() => useConceptOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([
      { label: 'Set one -> First concept', value: 'concept-1' },
      { label: 'Set one -> Second concept', value: 'concept-2' },
    ]);

    act(() => unmount());
    dispose();
  });

  it('returns empty options when concept loading fails', async () => {
    const { dispose, wrapper } = createHookContext({ conceptError: new Error('Concepts unavailable') });
    const { result, unmount } = renderHook(() => useConceptOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});
