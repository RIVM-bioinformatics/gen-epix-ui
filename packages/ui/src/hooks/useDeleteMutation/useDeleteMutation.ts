import { useMutation } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { NotificationManager } from '../../classes/managers/NotificationManager';
import { QueryClientManager } from '../../classes/managers/QueryClientManager';
import type { GenericData } from '../../models/data';
import { NotificationUtil } from '../../utils/NotificationUtil';
import { QueryClientManager } from '../../classes/managers/QueryClientManager';


export type MutationContextDelete<TData> = { notificationKey?: string; previousData?: TData[] };

export type UseDeleteMutationProps<TData> = {
  readonly associationQueryKeys?: string[][];
  readonly getErrorNotificationMessage?: (data: TData, error: unknown) => ReactElement | string;
  readonly getProgressNotificationMessage: (data: TData) => ReactElement | string;
  readonly getSuccessNotificationMessage?: (data: TData, context: MutationContextDelete<TData>) => ReactElement | string;
  readonly onError?: (error: unknown, item: TData, context: MutationContextDelete<TData>) => Promise<void> | void;
  readonly onSuccess?: (item: TData, context: MutationContextDelete<TData>) => Promise<void> | void;
  readonly queryFn?: (data: TData) => Promise<unknown>;
  readonly resourceQueryKey?: string[];
};

export const useDeleteMutation = <TData extends GenericData | GenericData[]>({
  associationQueryKeys,
  getErrorNotificationMessage,
  getProgressNotificationMessage,
  getSuccessNotificationMessage,
  onError,
  onSuccess,
  queryFn,
  resourceQueryKey,
}: UseDeleteMutationProps<TData>) => {
  const queryClient = QueryClientManager.getInstance().queryClient;

  const deleteMutation = useMutation<unknown, Error, TData, MutationContextDelete<TData>>({
    mutationFn: async (item) => {
      return queryFn(item);
    },
    onError: async (error, item, context) => {
      if (resourceQueryKey) {
        queryClient.setQueryData(resourceQueryKey, (oldItems: TData[]) => {
          if (!Array.isArray(oldItems)) {
            return oldItems;
          }
          return [...oldItems, item];
        });
      }
      if (associationQueryKeys) {
        await QueryClientManager.getInstance().invalidateQueryKeys(associationQueryKeys);
      }
      if (onError) {
        await onError(error, item, context);
      }
      NotificationManager.getInstance().fulfillNotification(context.notificationKey, NotificationUtil.wrapErrorNotificationMessage(getErrorNotificationMessage(item, error), error), 'error');
    },
    onMutate: async (item) => {
      const notificationKey = NotificationManager.getInstance().showNotification({
        isLoading: true,
        message: getProgressNotificationMessage(item),
        severity: 'info',
      });
      if (resourceQueryKey) {
        await queryClient.cancelQueries({ queryKey: resourceQueryKey });
        const previousData = queryClient.getQueryData<TData[]>(resourceQueryKey);

        if (Array.isArray(previousData) && !Array.isArray(item)) {
          queryClient.setQueryData<GenericData[]>(resourceQueryKey, (oldItems) => {
            return oldItems.filter(i => i.id !== item.id);
          });
          return { notificationKey, previousData };
        }
      }
      return { notificationKey };
    },
    onSuccess: async (_data, item, context) => {
      if (associationQueryKeys) {
        await QueryClientManager.getInstance().invalidateQueryKeys(associationQueryKeys);
      }
      if (onSuccess) {
        await onSuccess(item, context);
      }
      NotificationManager.getInstance().fulfillNotification(context.notificationKey, getSuccessNotificationMessage(item, context), 'success');
    },
  });

  // Note: must be done in useMemo to avoid render loops (useMutation returns a new object every time)
  const mutate = useMemo(() => deleteMutation.mutate, [deleteMutation.mutate]);
  const isMutating = useMemo(() => deleteMutation.isPending, [deleteMutation.isPending]);
  return useMemo(() => ({ isMutating, mutate }), [isMutating, mutate]);
};
