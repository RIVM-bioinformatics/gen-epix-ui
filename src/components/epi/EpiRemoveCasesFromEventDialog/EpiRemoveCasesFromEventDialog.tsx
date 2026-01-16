import { Box } from '@mui/material';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactElement,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';

import type {
  Case,
  CaseSet,
  TypedUuidSetFilter,
  CaseSetMember,
} from '../../../api';
import { CaseApi } from '../../../api';
import type {
  WithDialogRenderProps,
  WithDialogRefMethods,
} from '../../../hoc/withDialog';
import { withDialog } from '../../../hoc/withDialog';
import { useDeleteMutation } from '../../../hooks/useDeleteMutation';
import { QUERY_KEY } from '../../../models/query';
import { EpiStoreContext } from '../../../stores/epiStore';
import { QueryUtil } from '../../../utils/QueryUtil';
import { TestIdUtil } from '../../../utils/TestIdUtil';
import type { DialogAction } from '../../ui/Dialog';
import { ResponseHandler } from '../../ui/ResponseHandler';
import { Spinner } from '../../ui/Spinner';
import { useQueryMemo } from '../../../hooks/useQueryMemo';

export interface EpiRemoveCasesFromEventDialogOpenProps {
  rows: Case[];
  caseSet: CaseSet;
}

export interface EpiRemoveCasesFromEventDialogProps extends WithDialogRenderProps<EpiRemoveCasesFromEventDialogOpenProps> {
  //
}

export type EpiRemoveCasesFromEventDialogRefMethods = WithDialogRefMethods<EpiRemoveCasesFromEventDialogProps, EpiRemoveCasesFromEventDialogOpenProps>;

export const EpiRemoveCasesFromEventDialog = withDialog<EpiRemoveCasesFromEventDialogProps, EpiRemoveCasesFromEventDialogOpenProps>((
  {
    openProps,
    onActionsChange,
    onTitleChange,
    onClose,
  }: EpiRemoveCasesFromEventDialogProps,
): ReactElement => {
  const [t] = useTranslation();

  const epiStore = useContext(EpiStoreContext);
  const completeCaseType = useStore(epiStore, useShallow((state) => state.completeCaseType));
  const fetchData = useStore(epiStore, useShallow((state) => state.fetchData));
  const setSelectedIds = useStore(epiStore, useShallow((state) => state.setSelectedIds));


  const caseSetMembersFilter = useMemo<TypedUuidSetFilter>(() => ({
    invert: false,
    key: 'case_id',
    type: 'UUID_SET',
    members: openProps.rows.map(row => row.id),
  }), [openProps.rows]);

  const { isLoading: isCaseSetMembersLoading, error: caseSetMembersError, data: caseSetMembers } = useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SET_MEMBERS, caseSetMembersFilter),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.caseSetMembersPostQuery(caseSetMembersFilter, { signal });
      return response.data;
    },
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

  const { mutate, isMutating } = useDeleteMutation<CaseSetMember[]>({
    associationQueryKeys: QueryUtil.getQueryKeyDependencies([QUERY_KEY.CASE_SET_MEMBERS], true),
    queryFn: async (items: CaseSetMember[]) => {
      await CaseApi.instance.caseSetMembersDeleteSome(items.map(item => item.id).join(','));
    },
    getProgressNotificationMessage: (items) => t('Removing {{numCases}} case(s) from {{eventName}}...', { numCases: items.length, eventName: openProps.caseSet.name }),
    getSuccessNotificationMessage: (items) => t('Successfully removed {{numCases}} case(s) from {{eventName}}.', { numCases: items.length, eventName: openProps.caseSet.name }),
    getErrorNotificationMessage: () => t('Could not remove all cases from {{eventName}}.', { eventName: openProps.caseSet.name }),
    onSuccess,
    onError,
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
        ...TestIdUtil.createAttributes('EpiRemoveCasesFromEventDialog-confirmButton'),
        color: 'secondary',
        autoFocus: true,
        variant: 'contained',
        onClick: onConfirmButtonClick,
        disabled: isMutating,
        label: t`Confirm`,
      },

    );
    onActionsChange(actions);
  }, [isMutating, onActionsChange, onCancelButtonClick, onConfirmButtonClick, t]);

  if (isMutating) {
    return <Spinner />;
  }

  return (
    <ResponseHandler
      shouldHideActionButtons
      error={caseSetMembersError}
      isLoading={isCaseSetMembersLoading}
    >
      <Box>
        {t('Are you sure you want to remove {{numCases}} selected cases from {{caseTypeName}}?', { numCases: openProps.rows.length, caseTypeName: completeCaseType.name })}
      </Box>
    </ResponseHandler>
  );
}, {
  testId: 'EpiRemoveCasesFromEventDialog',
  maxWidth: 'md',
  fullWidth: true,
  defaultTitle: '',
});
