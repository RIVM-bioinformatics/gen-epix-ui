import { useMutation } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { NotificationManager } from '../../classes/managers/NotificationManager';
import { QueryClientManager } from '../../classes/managers/QueryClientManager';
import type { GenericData } from '../../models/data';
import { QueryUtil } from '../../utils/QueryUtil';
import { StringUtil } from '../../utils/StringUtil';
import { NotificationUtil } from '../../utils/NotificationUtil';


export type MutationContextCreate<TData> = { previousData?: TData[]; temporaryId?: string; notificationKey?: string };

export type UseCreateMutationProps<TData, TVariables extends GenericData | GenericData[] = TData> = {
  readonly queryFn?: (item: TVariables) => Promise<TData>;
  readonly resourceQueryKey?: string[];
  readonly associationQueryKeys?: string[][];
  readonly getProgressNotificationMessage: (data: TVariables) => string | ReactElement;
  readonly getErrorNotificationMessage: (data: TVariables, error: unknown) => string | ReactElement;
  readonly getSuccessNotificationMessage: (data: TData, context: MutationContextCreate<TData>) => string | ReactElement;
  readonly onSuccess?: (item: TData, variables: TVariables, context: MutationContextCreate<TData>) => Promise<void>;
  readonly onError?: (error: unknown, variables: TVariables, context: MutationContextCreate<TData>) => Promise<void>;
};

export const useCreateMutation = <TData extends GenericData | GenericData[], TVariables = TData>({
  queryFn,
  resourceQueryKey,
  getErrorNotificationMessage,
  getSuccessNotificationMessage,
  getProgressNotificationMessage,
  associationQueryKeys,
  onSuccess,
  onError,
}: UseCreateMutationProps<TData, TVariables>) => {
  const queryClient = QueryClientManager.instance.queryClient;

  const createMutation = useMutation<TData, Error, TVariables, MutationContextCreate<TData>>({
    mutationFn: async (item) => {
      return queryFn(item);
    },
    onMutate: async (variables) => {
      const notificationKey = NotificationManager.instance.showNotification({
        message: getProgressNotificationMessage(variables),
        severity: 'info',
        isLoading: true,
      });
      if (resourceQueryKey) {
        await queryClient.cancelQueries({ queryKey: resourceQueryKey });
        const previousData = queryClient.getQueryData<TData[]>(resourceQueryKey);
        if (Array.isArray(previousData)) {
          const temporaryId = StringUtil.createUuid();
          queryClient.setQueryData<TData[]>(resourceQueryKey, (oldItems: TData[]) => {
            return [
              {
                ...variables,
                id: temporaryId,
              },
              ...oldItems,
            ] as TData[];
          });
          return { previousData, temporaryId, notificationKey };
        }
      }
      return { notificationKey };
    },
    onError: async (error, variables, context) => {
      if (resourceQueryKey && Array.isArray(context.previousData)) {
        queryClient.setQueryData(resourceQueryKey, context.previousData);
      }
      await QueryUtil.invalidateQueryKeys(associationQueryKeys);
      if (onError) {
        await onError(error, variables, context);
      }
      NotificationManager.instance.fulfillNotification(context.notificationKey, NotificationUtil.wrapErrorNotificationMessage(getErrorNotificationMessage(variables, error), error), 'error');
    },
    onSuccess: async (item, variables, context) => {
      if (resourceQueryKey && Array.isArray(context?.previousData) && !Array.isArray(item)) {
        queryClient.setQueryData<GenericData[]>(resourceQueryKey, (oldItems) => {
          return [
            item,
            ...oldItems.filter(x => x.id !== context.temporaryId),
          ];
        });
      }
      await QueryUtil.invalidateQueryKeys(associationQueryKeys);
      if (onSuccess) {
        await onSuccess(item, variables, context);
      }
      NotificationManager.instance.fulfillNotification(context.notificationKey, getSuccessNotificationMessage(item, context), 'success');
    },
  });

  // Note: must be done in useMemo to avoid render loops (useMutation returns a new object every time)
  const mutate = useMemo(() => createMutation.mutate, [createMutation.mutate]);
  const isMutating = useMemo(() => createMutation.isPending, [createMutation.isPending]);
  return useMemo(() => ({ mutate, isMutating }), [isMutating, mutate]);
};
