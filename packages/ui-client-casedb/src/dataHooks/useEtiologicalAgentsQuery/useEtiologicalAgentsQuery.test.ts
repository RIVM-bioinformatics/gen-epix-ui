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
import type { CaseDbEtiologicalAgent } from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import {
  useEtiologicalAgentOptionsQuery,
  useEtiologicalAgentsMapQuery,
  useEtiologicalAgentsQuery,
} from './useEtiologicalAgentsQuery';

const createAgent = (id: string, name: string): CaseDbEtiologicalAgent => ({
  id,
  name,
  type: 'virus',
});

const createHookContext = (agents: CaseDbEtiologicalAgent[], error?: Error) => {
  const etiologicalAgentsGetAll = vi.fn(async (_limit: null | number, _offset: null | number, { signal }: { signal: AbortSignal }) => {
    if (error) {
      return Promise.reject(error);
    }
    return Promise.resolve({ data: agents, signal });
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
  container.registerInstance(CaseDbOntologyApi, { etiologicalAgentsGetAll } as unknown as CaseDbOntologyApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    dispose: () => queryClientService.queryClient.clear(),
    etiologicalAgentsGetAll,
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useEtiologicalAgentsQuery', () => {
  it('loads agents and passes the abort signal to the API', async () => {
    const agents = [createAgent('agent-1', 'Agent one')];
    const { dispose, etiologicalAgentsGetAll, wrapper } = createHookContext(agents);
    const { result, unmount } = renderHook(() => useEtiologicalAgentsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(agents);
    expect(etiologicalAgentsGetAll).toHaveBeenCalledWith(null, null, expect.anything());
    expect(etiologicalAgentsGetAll.mock.calls[0]?.[2].signal).toBeInstanceOf(AbortSignal);

    act(() => unmount());
    dispose();
  });

  it('exposes API failures', async () => {
    const error = new Error('Etiological agents unavailable');
    const { dispose, wrapper } = createHookContext([], error);
    const { result, unmount } = renderHook(() => useEtiologicalAgentsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    act(() => unmount());
    dispose();
  });
});

describe('useEtiologicalAgentsMapQuery', () => {
  it('maps agents by ID', async () => {
    const agents = [
      createAgent('agent-1', 'Agent one'),
      createAgent('agent-2', 'Agent two'),
    ];
    const { dispose, wrapper } = createHookContext(agents);
    const { result, unmount } = renderHook(() => useEtiologicalAgentsMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(2);
    expect(result.current.map.get('agent-1')).toEqual(agents[0]);

    act(() => unmount());
    dispose();
  });

  it('returns an empty map when loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], new Error('Etiological agents unavailable'));
    const { result, unmount } = renderHook(() => useEtiologicalAgentsMapQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.map.size).toBe(0);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});

describe('useEtiologicalAgentOptionsQuery', () => {
  it('creates agent options sorted by name', async () => {
    const agents = [
      createAgent('agent-2', 'Zulu agent'),
      createAgent('agent-1', 'Alpha agent'),
    ];
    const { dispose, wrapper } = createHookContext(agents);
    const { result, unmount } = renderHook(() => useEtiologicalAgentOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([
      { label: 'Alpha agent', value: 'agent-1' },
      { label: 'Zulu agent', value: 'agent-2' },
    ]);

    act(() => unmount());
    dispose();
  });

  it('returns empty options when loading fails', async () => {
    const { dispose, wrapper } = createHookContext([], new Error('Etiological agents unavailable'));
    const { result, unmount } = renderHook(() => useEtiologicalAgentOptionsQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.options).toEqual([]);
    expect(result.current.error).toBeInstanceOf(Error);

    act(() => unmount());
    dispose();
  });
});
