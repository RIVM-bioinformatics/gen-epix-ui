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
  CaseDbProtocolType,
} from '@gen-epix/api-casedb';
import type { CaseDbProtocol } from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import {
  useSequencingProtocolMapQuery,
  useSequencingProtocolOptionsQuery,
  useSequencingProtocolsQuery,
} from './useSequencingProtocolsQuery';

const createProtocol = (id: string, name: string): CaseDbProtocol => ({
  code: id,
  id,
  name,
  protocol_type: CaseDbProtocolType.SEQUENCING,
});

const createHookContext = (protocols: CaseDbProtocol[], error?: Error) => {
  const retrieveSequencingProtocols = vi.fn(async ({ signal }: { signal: AbortSignal }) => {
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
  container.registerInstance(CaseDbCaseApi, { retrieveSequencingProtocols } as unknown as CaseDbCaseApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    dispose: () => queryClientService.queryClient.clear(),
    retrieveSequencingProtocols,
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useSequencingProtocolsQuery', () => {
  it('loads protocols and passes the abort signal to the API', async () => {
    const protocols = [createProtocol('protocol-1', 'Protocol one')];
    const { dispose, retrieveSequencingProtocols, wrapper } = createHookContext(protocols);
    const { result, unmount } = renderHook(() => useSequencingProtocolsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(protocols);
    expect(retrieveSequencingProtocols).toHaveBeenCalledWith(expect.anything());
    expect(retrieveSequencingProtocols.mock.calls[0]?.[0].signal).toBeInstanceOf(AbortSignal);

    act(() => unmount());
    dispose();
  });

  it('exposes API failures', async () => {
    const error = new Error('Sequencing protocols unavailable');
    const { dispose, wrapper } = createHookContext([], error);
    const { result, unmount } = renderHook(() => useSequencingProtocolsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    act(() => unmount());
    dispose();
  });
});

describe('useSequencingProtocolMapQuery', () => {
  it('maps protocols by ID', async () => {
    const protocols = [
      createProtocol('protocol-1', 'Protocol one'),
      createProtocol('protocol-2', 'Protocol two'),
    ];
    const { dispose, wrapper } = createHookContext(protocols);
    const { result, unmount } = renderHook(() => useSequencingProtocolMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(2);
    expect(result.current.map.get('protocol-1')).toEqual(protocols[0]);

    act(() => unmount());
    dispose();
  });

  it('returns an empty map when loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], new Error('Sequencing protocols unavailable'));
    const { result, unmount } = renderHook(() => useSequencingProtocolMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(0);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});

describe('useSequencingProtocolOptionsQuery', () => {
  it('creates options sorted by protocol name', async () => {
    const protocols = [
      createProtocol('protocol-2', 'Zulu protocol'),
      createProtocol('protocol-1', 'Alpha protocol'),
    ];
    const { dispose, wrapper } = createHookContext(protocols);
    const { result, unmount } = renderHook(() => useSequencingProtocolOptionsQuery(), { wrapper });

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
    const { dispose, wrapper } = createHookContext([], new Error('Sequencing protocols unavailable'));
    const { result, unmount } = renderHook(() => useSequencingProtocolOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});
