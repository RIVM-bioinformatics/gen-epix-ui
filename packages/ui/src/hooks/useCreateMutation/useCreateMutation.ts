import { useMutation } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { NotificationManager } from '../../classes/managers/NotificationManager';
import { QueryClientManager } from '../../classes/managers/QueryClientManager';
import type { GenericData } from '../../models/data';
import { QueryUtil } from '../../utils/QueryUtil';
import { StringUtil } from '../../utils/StringUtil';
import { NotificationUtil } from '../../utils/NotificationUtil';
import { ObjectUtil } from '../../utils/ObjectUtil';


export type MutationContextCreate<TData> = { notificationKey?: string; previousData?: TData[]; temporaryId?: string };

export type UseCreateMutationProps<TData extends GenericData | GenericData[], TVariables = TData> = {
  readonly associationQueryKeys?: string[][];
  readonly getErrorNotificationMessage: (data: TVariables, error: unknown) => ReactElement | string;
  readonly getProgressNotificationMessage: (data: TVariables) => ReactElement | string;
  readonly getSuccessNotificationMessage: (data: TData, context: MutationContextCreate<TData>) => ReactElement | string;
  readonly onError?: (error: unknown, variables: TVariables, context: MutationContextCreate<TData>) => Promise<void> | void;
  readonly onSuccess?: (item: TData, variables: TVariables, context: MutationContextCreate<TData>) => Promise<void> | void;
  readonly queryFn?: (item: TVariables) => Promise<TData>;
  readonly resourceQueryKey?: string[];
};

export const useCreateMutation = <TData extends GenericData | GenericData[], TVariables = TData>({
  associationQueryKeys,
  getErrorNotificationMessage,
  getProgressNotificationMessage,
  getSuccessNotificationMessage,
  onError,
  onSuccess,
  queryFn,
  resourceQueryKey,
}: UseCreateMutationProps<TData, TVariables>) => {
  const queryClient = QueryClientManager.instance.queryClient;

  const createMutation = useMutation<TData, Error, TVariables, MutationContextCreate<TData>>({
    mutationFn: async (item) => {
      return queryFn(ObjectUtil.deepRemoveEmptyStrings(item));
    },
    onError: async (error, variables, context) => {
      if (resourceQueryKey) {
        queryClient.setQueryData<TData[]>(resourceQueryKey, (oldItems: TData[]) => {
          if (!Array.isArray(oldItems)) {
            return oldItems;
          }
          return [...oldItems.filter(item => (item as GenericData)?.id !== context.temporaryId)];
        });
      }
      await QueryUtil.invalidateQueryKeys(associationQueryKeys);
      if (onError) {
        await onError(error, variables, context);
      }
      NotificationManager.instance.fulfillNotification(context.notificationKey, NotificationUtil.wrapErrorNotificationMessage(getErrorNotificationMessage(variables, error), error), 'error');
    },
    onMutate: async (variables) => {
      const notificationKey = NotificationManager.instance.showNotification({
        isLoading: true,
        message: getProgressNotificationMessage(variables),
        severity: 'info',
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
          return { notificationKey, previousData, temporaryId };
        }
      }
      return { notificationKey };
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
  return useMemo(() => ({ isMutating, mutate }), [isMutating, mutate]);
};
