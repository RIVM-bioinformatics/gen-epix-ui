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
  CaseDbColType,
} from '@gen-epix/api-casedb';
import type { CaseDbRefColValidationRulesResponseBody } from '@gen-epix/api-casedb';
import { container } from 'tsyringe';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';

import { useRefColsValidationRulesQuery } from './useRefColsValidationRulesQuery';

const createHookContext = (rules: CaseDbRefColValidationRulesResponseBody, error?: Error) => {
  const refColsValidationRules = vi.fn(async ({ signal }: { signal: AbortSignal }) => {
    if (error) {
      return Promise.reject(error);
    }
    return Promise.resolve({ data: rules, signal });
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
  container.registerInstance(CaseDbCaseApi, { refColsValidationRules } as unknown as CaseDbCaseApi);
  container.registerInstance(QueryClientService, queryClientService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    dispose: () => queryClientService.queryClient.clear(),
    refColsValidationRules,
    wrapper,
  };
};

afterEach(() => {
  container.clearInstances();
});

describe('useRefColsValidationRulesQuery', () => {
  it('loads validation rules and passes the abort signal to the API', async () => {
    const rules = {
      valid_col_types_by_dim_type: {
        GEO: [CaseDbColType.GEO_REGION],
      },
    };
    const { dispose, refColsValidationRules, wrapper } = createHookContext(rules);
    const { result, unmount } = renderHook(() => useRefColsValidationRulesQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(rules);
    expect(refColsValidationRules).toHaveBeenCalledOnce();
    expect(refColsValidationRules.mock.calls[0]?.[0].signal).toBeInstanceOf(AbortSignal);

    act(() => unmount());
    dispose();
  });

  it('exposes API failures', async () => {
    const error = new Error('Validation rules unavailable');
    const { dispose, wrapper } = createHookContext({}, error);
    const { result, unmount } = renderHook(() => useRefColsValidationRulesQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);

    act(() => unmount());
    dispose();
  });
});
