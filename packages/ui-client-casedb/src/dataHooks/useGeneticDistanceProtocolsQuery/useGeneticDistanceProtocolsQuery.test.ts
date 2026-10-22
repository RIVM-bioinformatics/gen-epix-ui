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
  CaseDbSeqDistanceType,
} from '@gen-epix/api-casedb';
import type { CaseDbGeneticDistanceProtocol } from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import {
  useGeneticDistanceProtocolOptionsQuery,
  useGeneticDistanceProtocolsQuery,
} from './useGeneticDistanceProtocolsQuery';

const createProtocol = (id: string, name: string): CaseDbGeneticDistanceProtocol => ({
  id,
  min_scale_unit: 1,
  name,
  seqdb_is_integer_distance: true,
  seqdb_seq_distance_protocol_id: `seq-${id}`,
  seqdb_seq_distance_type: CaseDbSeqDistanceType.SNP_HAMMING,
});

const createHookContext = (protocols: CaseDbGeneticDistanceProtocol[], error?: Error) => {
  const geneticDistanceProtocolsGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => {
    if (error) {
      return Promise.reject(error);
    }
    return Promise.resolve({ data: protocols, signal });
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
  container.registerInstance(CaseDbCaseApi, { geneticDistanceProtocolsGetAll } as unknown as CaseDbCaseApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    dispose: () => queryClientService.queryClient.clear(),
    geneticDistanceProtocolsGetAll,
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useGeneticDistanceProtocolsQuery', () => {
  it('loads protocols and passes the abort signal to the API', async () => {
    const protocols = [createProtocol('protocol-1', 'Protocol one')];
    const { dispose, geneticDistanceProtocolsGetAll, wrapper } = createHookContext(protocols);
    const { result, unmount } = renderHook(() => useGeneticDistanceProtocolsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(protocols);
    expect(geneticDistanceProtocolsGetAll).toHaveBeenCalledWith(null, null, expect.anything());
    expect(geneticDistanceProtocolsGetAll.mock.calls[0]?.[2].signal).toBeInstanceOf(AbortSignal);

    act(() => unmount());
    dispose();
  });

  it('exposes API failures', async () => {
    const error = new Error('Genetic-distance protocols unavailable');
    const { dispose, wrapper } = createHookContext([], error);
    const { result, unmount } = renderHook(() => useGeneticDistanceProtocolsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    act(() => unmount());
    dispose();
  });
});

describe('useGeneticDistanceProtocolOptionsQuery', () => {
  it('creates options sorted by protocol name', async () => {
    const protocols = [
      createProtocol('protocol-2', 'Zulu protocol'),
      createProtocol('protocol-1', 'Alpha protocol'),
    ];
    const { dispose, wrapper } = createHookContext(protocols);
    const { result, unmount } = renderHook(() => useGeneticDistanceProtocolOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([
      { label: 'Alpha protocol', value: 'protocol-1' },
      { label: 'Zulu protocol', value: 'protocol-2' },
    ]);

    act(() => unmount());
    dispose();
  });

  it('returns empty options when loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], new Error('Genetic-distance protocols unavailable'));
    const { result, unmount } = renderHook(() => useGeneticDistanceProtocolOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});
