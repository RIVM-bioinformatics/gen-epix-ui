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
  act,
  renderHook,
  waitFor,
} from '@testing-library/react';
import { container } from 'tsyringe';

import type { GenericData } from '../../models/data.models';
import type { ConfigBase } from '../../models/config.models';
import { NotificationService } from '../../classes/services/NotificationService';
import { QueryClientService } from '../../classes/services/QueryClientService';

import { useCreateMutation } from './useCreateMutation';
import type { UseCreateMutationProps } from './useCreateMutation';

type CreateVariables = {
  empty: string;
  name: string;
  nested: {
    value: string;
  };
};

type TestData = {
  name: string;
} & GenericData;

const createHookContext = () => {
  const queryClientService = new QueryClientService({
    config: {
      queryClient: {
        retry: () => false,
        retryDelay: () => 0,
      },
    },
    queryKeyDependencies: [],
  });
  const notificationService = new NotificationService({
    notifications: {
      autoHideAfterMs: Number.POSITIVE_INFINITY,
    },
  } as ConfigBase);
  container.registerInstance(QueryClientService, queryClientService);
  container.registerInstance(NotificationService, notificationService);

  const wrapper = ({ children }: PropsWithChildren) => createElement(
    QueryClientProvider,
    { client: queryClientService.queryClient },
    children,
  );

  return {
    dispose: () => queryClientService.queryClient.clear(),
    notificationService,
    queryClient: queryClientService.queryClient,
    queryClientService,
    wrapper,
  };
};

const createMutationProps = (
  queryFn: (variables: CreateVariables) => Promise<TestData>,
  overrides: Partial<UseCreateMutationProps<TestData, CreateVariables>> = {},
): UseCreateMutationProps<TestData, CreateVariables> => ({
  getErrorNotificationMessage: () => 'Create failed',
  getProgressNotificationMessage: variables => `Creating ${variables.name}`,
  getSuccessNotificationMessage: item => `Created ${item.id}`,
  queryFn,
  ...overrides,
});

afterEach(() => {
  container.clearInstances();
});

describe('useCreateMutation', () => {
  it('completes successful mutations when no onSuccess callback is provided', async () => {
    const { dispose, notificationService, wrapper } = createHookContext();
    const queryFn = vi.fn(async (_variables: CreateVariables) => Promise.resolve({
      id: 'created-without-callback',
      name: 'Created',
    }));
    const { result, unmount } = renderHook(
      () => useCreateMutation(createMutationProps(queryFn)),
      { wrapper },
    );

    act(() => {
      result.current.mutate({
        empty: '',
        name: 'Created',
        nested: { value: '' },
      });
    });

    await waitFor(() => {
      expect(notificationService.data[0]?.severity).toBe('success');
    });

    expect(queryFn).toHaveBeenCalledOnce();
    expect(result.current.isMutating).toBe(false);

    unmount();
    dispose();
  });

  it('normalizes empty strings and fulfills the notification for a mutation without a resource cache', async () => {
    const { dispose, notificationService, wrapper } = createHookContext();
    const variables: CreateVariables = {
      empty: '',
      name: 'New record',
      nested: { value: '' },
    };
    const createdItem: TestData = {
      id: 'created-1',
      name: 'New record',
    };
    const queryFn = vi.fn(async (normalizedVariables: CreateVariables) => Promise.resolve({
      ...createdItem,
      name: normalizedVariables.name,
    }));
    const onSuccess = vi.fn();
    const { result, unmount } = renderHook(
      () => useCreateMutation(createMutationProps(queryFn, { onSuccess })),
      { wrapper },
    );

    act(() => {
      result.current.mutate(variables);
    });

    await waitFor(() => {
      expect(notificationService.data[0]?.severity).toBe('success');
    });

    expect(queryFn).toHaveBeenCalledOnce();
    expect(queryFn.mock.calls[0]?.[0]).toEqual({
      empty: null,
      name: 'New record',
      nested: { value: null },
    });
    expect(onSuccess).toHaveBeenCalledWith(createdItem, variables, expect.objectContaining({
      notificationKey: notificationService.data[0]?.key,
    }));
    expect(notificationService.data[0]).toMatchObject({
      isLoading: false,
      message: 'Created created-1',
      severity: 'success',
    });
    expect(result.current.isMutating).toBe(false);

    unmount();
    dispose();
  });

  it('inserts an optimistic item and replaces it after success', async () => {
    const { dispose, notificationService, queryClient, queryClientService, wrapper } = createHookContext();
    const resourceQueryKey = ['users'];
    const associationQueryKey = ['organization-admin-policies'];
    const existingItem: TestData = {
      id: 'existing-1',
      name: 'Existing',
    };
    const createdItem: TestData = {
      id: 'created-1',
      name: 'Created',
    };
    queryClient.setQueryData<TestData[]>(resourceQueryKey, [existingItem]);
    queryClient.setQueryData(associationQueryKey, [{ id: 'policy-1' }]);
    let resolveMutation: ((item: TestData) => void) | undefined;
    const queryFn = vi.fn(async (_variables: CreateVariables) => new Promise<TestData>((resolve) => {
      resolveMutation = resolve;
    }));
    const onSuccess = vi.fn();
    const variables: CreateVariables = {
      empty: '',
      name: 'Created',
      nested: { value: '' },
    };
    const { result, unmount } = renderHook(
      () => useCreateMutation(createMutationProps(queryFn, {
        associationQueryKeys: [associationQueryKey],
        onSuccess,
        resourceQueryKey,
      })),
      { wrapper },
    );

    act(() => {
      result.current.mutate(variables);
    });

    await waitFor(() => {
      expect(queryClient.getQueryData<TestData[]>(resourceQueryKey)).toHaveLength(2);
    });
    const optimisticItems = queryClient.getQueryData<TestData[]>(resourceQueryKey);
    expect(optimisticItems?.[0]?.name).toBe('Created');
    expect(optimisticItems?.[0]?.id).not.toBe('created-1');
    expect(notificationService.data[0]).toMatchObject({
      isLoading: true,
      message: 'Creating Created',
      severity: 'info',
    });

    if (!resolveMutation) {
      throw new Error('Expected the mutation promise to be pending');
    }
    act(() => resolveMutation(createdItem));

    await waitFor(() => {
      expect(notificationService.data[0]?.severity).toBe('success');
      expect(queryClient.getQueryData<TestData[]>(resourceQueryKey)).toEqual([createdItem, existingItem]);
    });

    expect(onSuccess).toHaveBeenCalledOnce();
    expect(queryClientService.queryCache.find({ queryKey: associationQueryKey })?.state.isInvalidated).toBe(true);
    expect(result.current.isMutating).toBe(false);

    unmount();
    dispose();
  });

  it('removes the optimistic item and reports failures', async () => {
    const { dispose, notificationService, queryClient, queryClientService, wrapper } = createHookContext();
    const resourceQueryKey = ['users'];
    const associationQueryKey = ['organization-admin-policies'];
    const existingItem: TestData = {
      id: 'existing-1',
      name: 'Existing',
    };
    const error = new Error('Create request failed');
    queryClient.setQueryData<TestData[]>(resourceQueryKey, [existingItem]);
    queryClient.setQueryData(associationQueryKey, [{ id: 'policy-1' }]);
    const onError = vi.fn();
    const queryFn = vi.fn(async (_variables: CreateVariables) => Promise.reject(error));
    const { result, unmount } = renderHook(
      () => useCreateMutation(createMutationProps(queryFn, {
        associationQueryKeys: [associationQueryKey],
        onError,
        resourceQueryKey,
      })),
      { wrapper },
    );

    act(() => {
      result.current.mutate({
        empty: '',
        name: 'Failed',
        nested: { value: '' },
      });
    });

    await waitFor(() => {
      expect(notificationService.data[0]?.severity).toBe('error');
      expect(queryClient.getQueryData<TestData[]>(resourceQueryKey)).toEqual([existingItem]);
    });

    expect(onError).toHaveBeenCalledOnce();
    expect(notificationService.data[0]?.message).toBe('Create failed');
    expect(queryClientService.queryCache.find({ queryKey: associationQueryKey })?.state.isInvalidated).toBe(true);
    expect(result.current.isMutating).toBe(false);

    unmount();
    dispose();
  });

  it('handles mutation failures when no resource cache is configured', async () => {
    const { dispose, notificationService, queryClient, wrapper } = createHookContext();
    const error = new Error('Create failed without a resource cache');
    const onError = vi.fn();
    const queryFn = vi.fn(async (_variables: CreateVariables) => Promise.reject(error));
    const { result, unmount } = renderHook(
      () => useCreateMutation(createMutationProps(queryFn, { onError })),
      { wrapper },
    );

    act(() => {
      result.current.mutate({
        empty: '',
        name: 'Failed',
        nested: { value: '' },
      });
    });

    await waitFor(() => {
      expect(notificationService.data[0]?.severity).toBe('error');
    });

    expect(onError).toHaveBeenCalledOnce();
    expect(queryClient.getQueryData(['users'])).toBeUndefined();
    expect(result.current.isMutating).toBe(false);

    unmount();
    dispose();
  });

  it('preserves non-array cache data when an optimistic create fails', async () => {
    const { dispose, notificationService, queryClient, wrapper } = createHookContext();
    const resourceQueryKey = ['users'];
    const invalidCacheValue = { unexpected: true };
    queryClient.setQueryData(resourceQueryKey, invalidCacheValue);
    const queryFn = vi.fn(async (_variables: CreateVariables) => Promise.reject(new Error('Create failed')));
    const { result, unmount } = renderHook(
      () => useCreateMutation(createMutationProps(queryFn, { resourceQueryKey })),
      { wrapper },
    );

    act(() => {
      result.current.mutate({
        empty: '',
        name: 'Failed',
        nested: { value: '' },
      });
    });

    await waitFor(() => {
      expect(notificationService.data[0]?.severity).toBe('error');
    });

    expect(queryClient.getQueryData(resourceQueryKey)).toEqual(invalidCacheValue);

    unmount();
    dispose();
  });
});
