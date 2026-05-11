import { Box } from '@mui/material';
import {
  type ReactElement,
  use,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import type {
  CaseDbCase,
  CaseDbCaseSet,
  CaseDbCaseSetMember,
  CaseDbTypedCompositeFilter,
} from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import type {
  DialogAction,
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '@gen-epix/ui';
import {
  QueryClientManager,
  ResponseHandler,
  Spinner,
  TestIdUtil,
  useDeleteMutation,
  useQueryMemo,
  withDialog,
} from '@gen-epix/ui';

import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { CASEDB_QUERY_KEY } from '../../../data/query';

export interface EpiRemoveCasesFromEventDialogOpenProps {
  caseSet: CaseDbCaseSet;
  rows: CaseDbCase[];
}

export interface EpiRemoveCasesFromEventDialogProps extends WithDialogRenderProps<EpiRemoveCasesFromEventDialogOpenProps> {
  //
}

export type EpiRemoveCasesFromEventDialogRefMethods = WithDialogRefMethods<EpiRemoveCasesFromEventDialogProps, EpiRemoveCasesFromEventDialogOpenProps>;

export const EpiRemoveCasesFromEventDialog = withDialog<EpiRemoveCasesFromEventDialogProps, EpiRemoveCasesFromEventDialogOpenProps>((
  {
    onActionsChange,
    onClose,
    onTitleChange,
    openProps,
  }: EpiRemoveCasesFromEventDialogProps,
): ReactElement => {
  const { t } = useTranslation();

  const epiDashboardStore = use(EpiDashboardStoreContext);
  const completeCaseType = useStore(epiDashboardStore, useShallow((state) => state.completeCaseType));
  const fetchData = useStore(epiDashboardStore, useShallow((state) => state.fetchData));
  const setSelectedIds = useStore(epiDashboardStore, useShallow((state) => state.setSelectedIds));

  const isMaxExceeded = openProps.rows.length > completeCaseType.props.delete_max_n_cases;

  const caseSetMembersFilter = useMemo<CaseDbTypedCompositeFilter>(() => ({
    filters: [
      {
        invert: false,
        key: 'case_id',
        members: openProps.rows.map(row => row.id),
        type: 'UUID_SET',
      },
      {
        invert: false,
        key: 'case_set_id',
        members: [openProps.caseSet.id],
        type: 'UUID_SET',
      },
    ],
    operator: 'AND',
    type: 'COMPOSITE',
  }), [openProps.caseSet.id, openProps.rows]);

  const { data: caseSetMembers, error: caseSetMembersError, isLoading: isCaseSetMembersLoading } = useQueryMemo({
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().caseSetMembersPostQuery(caseSetMembersFilter, { signal });
      return response.data;
    },
    queryKey: QueryClientManager.getInstance().getGenericKey(CASEDB_QUERY_KEY.CASE_SET_MEMBERS, caseSetMembersFilter),
  });

  const onSuccess = useCallback(async () => {
    setSelectedIds([]);
    await fetchData();
    onClose();
  }, [fetchData, onClose, setSelectedIds]);

  const onError = useCallback(async () => {
    await fetchData();
    onClose();
  }, [fetchData, onClose]);

  const { isMutating, mutate } = useDeleteMutation<CaseDbCaseSetMember[]>({
    associationQueryKeys: QueryClientManager.getInstance().getQueryKeyDependencies([CASEDB_QUERY_KEY.CASE_SET_MEMBERS], true),
    getErrorNotificationMessage: () => t('Could not remove all cases from {{eventName}}.', { eventName: openProps.caseSet.name }),
    getProgressNotificationMessage: (items) => t('Removing {{numCases}} case(s) from {{eventName}}...', { eventName: openProps.caseSet.name, numCases: items.length }),
    getSuccessNotificationMessage: (items) => t('Successfully removed {{numCases}} case(s) from {{eventName}}.', { eventName: openProps.caseSet.name, numCases: items.length }),
    onError,
    onSuccess,
    queryFn: async (items: CaseDbCaseSetMember[]) => {
      await CaseDbCaseApi.getInstance().caseSetMembersDeleteSome(items.map(item => item.id).join(','));
    },
  });

  const onConfirmButtonClick = useCallback((() => {
    mutate(caseSetMembers);
  }), [mutate, caseSetMembers]);

  const onCancelButtonClick = useCallback((() => {
    onClose();
  }), [onClose]);

  useEffect(() => {
    onTitleChange(t`Remove selected cases from event`);
  }, [onTitleChange, t]);


  useEffect(() => {
    const actions: DialogAction[] = [];
    actions.push(
      {
        ...TestIdUtil.createAttributes('EpiRemoveCasesFromEventDialog-closeButton'),
        autoFocus: true,
        color: 'primary',
        disabled: isMutating,
        label: t`Close`,
        onClick: onCancelButtonClick,
        variant: 'outlined',
      },
    );
    if (!isMaxExceeded) {
      actions.push(
        {
          ...TestIdUtil.createAttributes('EpiRemoveCasesFromEventDialog-confirmButton'),
          autoFocus: true,
          color: 'secondary',
          disabled: isMutating,
          label: t`Confirm`,
          onClick: onConfirmButtonClick,
          variant: 'contained',
        },
      );
    }
    onActionsChange(actions);
  }, [isMaxExceeded, isMutating, onActionsChange, onCancelButtonClick, onConfirmButtonClick, t]);

  if (isMutating) {
    return <Spinner />;
  }

  return (
    <ResponseHandler
      error={caseSetMembersError}
      isLoading={isCaseSetMembersLoading}
      shouldHideActionButtons
    >
      {isMaxExceeded ? (
        <Box>
          {t('You can only remove up to {{maxCases}} cases at a time. Please refine your selection and try again.', { maxCases: completeCaseType.props.delete_max_n_cases })}
        </Box>
      ) : (
        <Box>
          {t('Are you sure you want to remove {{numCases}} selected cases from {{eventName}}?', { eventName: openProps.caseSet.name, numCases: openProps.rows.length })}
        </Box>
      )}
    </ResponseHandler>
  );
}, {
  defaultTitle: '',
  fullWidth: true,
  maxWidth: 'md',
  testId: 'EpiRemoveCasesFromEventDialog',
});
