import { container } from 'tsyringe';
import { useMutation } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import {
  useCallback,
  useMemo,
} from 'react';
import { ObjectUtil } from '@gen-epix/ui-core/utils/ObjectUtil';

import { NotificationService } from '../../classes/services/NotificationService';
import { QueryClientService } from '../../classes/services/QueryClientService';
import type { GenericData } from '../../models/data.models';
import { NotificationUtil } from '../../utils/NotificationUtil';

export type MutationContextEdit<TData> = { item?: TData; notificationKey?: string; previousData?: TData[] };

export type UseEditMutationProps<TData, TVariables = TData> = {
  readonly associationQueryKeys?: string[][];
  readonly getErrorNotificationMessage: (data: TData, variables: TVariables, error: unknown) => ReactElement | string;
  // Optional function to get an intermediate item to be set in the query cache before the mutation is completed.
  // This is useful for optimistic updates where you want to show a temporary state before the mutation is confirmed.
  // The function receives the variables and the previous item, and should return the intermediate item.
  // Only needed if the variables are different from the previous item.
  readonly getIntermediateItem?: (variables: TVariables, previousItem: TData) => TData;
  readonly getProgressNotificationMessage: (data: TData, variables: TVariables) => ReactElement | string;
  readonly getSuccessNotificationMessage: (data: TData, context: MutationContextEdit<TData>) => ReactElement | string;
  readonly onError?: (error: unknown, variables: TVariables, context: MutationContextEdit<TData>) => Promise<void> | void;
  readonly onSuccess?: (item: TData, variables: TVariables, context: MutationContextEdit<TData>) => Promise<void> | void;
  readonly queryFn?: (variables: TVariables, previousData: TData) => Promise<TData>;
  readonly resourceQueryKey?: string[];
};

type EditMutationVariables<TData, TVariables> = {
  readonly previousItem: TData;
  readonly variables: TVariables;
};

const isSingleGenericData = (item: GenericData | GenericData[]): item is GenericData => !Array.isArray(item);

export const useEditMutation = <TData extends GenericData | GenericData[], TVariables = TData>({
  associationQueryKeys,
  getErrorNotificationMessage,
  getIntermediateItem,
  getProgressNotificationMessage,
  getSuccessNotificationMessage,
  onError,
  onSuccess,
  queryFn,
  resourceQueryKey,
}: UseEditMutationProps<TData, TVariables>) => {
  const queryClient = container.resolve(QueryClientService).queryClient;

  const mutationFn = useCallback(async ({ previousItem, variables }: EditMutationVariables<TData, TVariables>) => {
    if (!queryFn) {
      throw new Error('Edit mutation queryFn is required');
    }
    return queryFn(ObjectUtil.deepNullifyEmptyStrings(variables), previousItem);
  }, [queryFn]);

  const editMutation = useMutation<TData, Error, EditMutationVariables<TData, TVariables>, MutationContextEdit<TData>>({
    mutationFn,
    onError: async (error, mutationVariables, context) => {
      const safeContext: MutationContextEdit<TData> = context ?? {};
      if (resourceQueryKey && Array.isArray(safeContext.previousData)) {
        queryClient.setQueryData<TData[]>(resourceQueryKey, safeContext.previousData);
      }
      await container.resolve(QueryClientService).invalidateQueryKeys(associationQueryKeys);
      if (onError) {
        await onError(error, mutationVariables.variables, safeContext);
      }
      const errorMessage = safeContext.item
        ? getErrorNotificationMessage(safeContext.item, mutationVariables.variables, error)
        : String(error);
      if (safeContext.notificationKey) {
        container.resolve(NotificationService).fulfillNotification(safeContext.notificationKey, NotificationUtil.wrapErrorNotificationMessage(errorMessage, error), 'error');
      }
    },
    onMutate: async ({ previousItem, variables }) => {
      if (!previousItem) {
        throw new Error('previousItem is not set');
      }
      const notificationKey = container.resolve(NotificationService).showNotification({
        isLoading: true,
        message: getProgressNotificationMessage(previousItem, variables),
        severity: 'info',
      });
      if (resourceQueryKey) {
        await queryClient.cancelQueries({ queryKey: resourceQueryKey });
        const previousData = queryClient.getQueryData<TData[]>(resourceQueryKey);

        if (Array.isArray(previousData) && !Array.isArray(variables)) {
          const intermediateItem = getIntermediateItem ? getIntermediateItem(variables, previousItem) : {
            ...variables,
            id: (previousItem as GenericData).id,
          } as GenericData;
          queryClient.setQueryData<GenericData[]>(resourceQueryKey, (oldItems) => {
            return oldItems.map(x => x.id === (previousItem as GenericData).id ? intermediateItem : x) as GenericData[];
          });
          return { item: previousItem, notificationKey, previousData };
        }
      }
      return { item: previousItem, notificationKey };
    },
    onSuccess: async (item, mutationVariables, context) => {
      if (resourceQueryKey && Array.isArray(context?.previousData) && isSingleGenericData(item)) {
        const previousItemId = (context.item as GenericData)?.id;
        queryClient.setQueryData<GenericData[]>(resourceQueryKey, (oldItems) => {
          if (!Array.isArray(oldItems)) {
            return oldItems;
          }
          return oldItems.map(oldItem => oldItem.id === previousItemId ? item : oldItem);
        });
      }
      await container.resolve(QueryClientService).invalidateQueryKeys(associationQueryKeys);
      if (onSuccess) {
        await onSuccess(item, mutationVariables.variables, context);
      }
      container.resolve(NotificationService).fulfillNotification(context.notificationKey, getSuccessNotificationMessage(item, context), 'success');
    },
  });

  // Note: must be done in useMemo to avoid render loops (useMutation returns a new object every time)
  const editMutate = editMutation.mutate;
  const mutate = useMemo(() => (variables: TVariables, previousItem: TData) => {
    editMutate({ previousItem, variables });
  }, [editMutate]);
  const isMutating = useMemo(() => editMutation.isPending, [editMutation.isPending]);
  return useMemo(() => ({ isMutating, mutate }), [isMutating, mutate]);
};
