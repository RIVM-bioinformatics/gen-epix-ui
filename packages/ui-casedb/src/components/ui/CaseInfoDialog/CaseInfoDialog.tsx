import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import ShareIcon from '@mui/icons-material/Share';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import {
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import type {
  CaseDbCase,
  CaseDbTypedUuidSetFilter,
} from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import type {
  ConfirmationRefMethods,
  DialogAction,
  WithDialogRefMethods,
  WithDialogRenderProps,
} from '@gen-epix/ui';
import {
  Confirmation,
  FeatureFlagsService,
  QueryClientService,
  ResponseHandler,
  Spinner,
  TestIdUtil,
  useArray,
  useDeleteMutation,
  useItemQuery,
  useQueryMemo,
  withDialog,
} from '@gen-epix/ui';
import { Typography } from '@mui/material';

import type { CaseAbacContext } from '../../../context/caseAbac';
import { CaseAbacContextProvider } from '../../../context/caseAbac';
import { useCaseRightsQuery } from '../../../dataHooks/useCaseRightsQuery';
import {
  useDataCollectionOptionsQuery,
  useDataCollectionsMapQuery,
  useDataCollectionsQuery,
} from '../../../dataHooks/useDataCollectionsQuery';
import { DashboardStoreContext } from '../../../stores/dashboardStore';
import { CASEDB_QUERY_KEY } from '../../../data/query';

import { CaseCaseSetInfo } from './CaseCaseSetInfo';
import { CaseInfoForm } from './CaseInfoForm';
import { ReadOnlyCaseContent } from './ReadOnlyCaseContent';
import { CaseContent } from './CaseContent';
import { CaseSharingInfo } from './CaseSharingInfo';
import { CaseSharingForm } from './CaseSharingForm';


export enum CASE_INFO_DIALOG_TAB_NAME {
  EDIT = 'EDIT',
  INFO = 'INFO',
  SHARING = 'SHARING',
}

export interface CaseInfoDialogOpenProps {
  caseId: string;
  caseTypeId: string;
  initialTab?: CASE_INFO_DIALOG_TAB_NAME;
}

export interface CaseInfoDialogProps extends WithDialogRenderProps<CaseInfoDialogOpenProps> {
  //
}

export type CaseInfoDialogRefMethods = WithDialogRefMethods<CaseInfoDialogProps, CaseInfoDialogOpenProps>;

export const CaseInfoDialog = withDialog<CaseInfoDialogProps, CaseInfoDialogOpenProps>((
  {
    onActionsChange,
    onClose,
    onTitleChange,
    openProps,
  }: CaseInfoDialogProps,
): ReactElement => {
  const { t } = useTranslation();
  const caseIds = useMemo(() => [openProps.caseId], [openProps.caseId]);
  const dataCollectionsQuery = useDataCollectionsQuery();
  const dataCollectionsMapQuery = useDataCollectionsMapQuery();
  const dataCollectionOptionsQuery = useDataCollectionOptionsQuery();

  const dashboardStore = use(DashboardStoreContext);
  const fetchData = useStore(dashboardStore, useShallow((state) => state.fetchData));
  const [currentTab, setCurrentTab] = useState<CASE_INFO_DIALOG_TAB_NAME>(openProps.initialTab ?? CASE_INFO_DIALOG_TAB_NAME.INFO);
  const [isEpiCaseFormSaving, setIsEpiCaseFormSaving] = useState(false);
  const [isEpiCaseDataCollectionFormSaving, setIsEpiCaseDataCollectionFormSaving] = useState(false);
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const deleteConfirmationRef = useRef<ConfirmationRefMethods>(null);
  const valuesFormId = useId();
  const dataCollectionsFormId = useId();

  const onFinish = useCallback(async () => {
    setIsEpiCaseFormSaving(false);
    setIsEpiCaseDataCollectionFormSaving(false);
    setIsRefreshingData(true);
    setCurrentTab(CASE_INFO_DIALOG_TAB_NAME.INFO);
    await fetchData();
    setIsRefreshingData(false);
  }, [fetchData]);

  const onDeleteSuccess = useCallback(async () => {
    await onFinish();
    onClose();
  }, [onClose, onFinish]);

  const onDeleteError = useCallback(() => {
    onClose();
  }, [onClose]);

  const { isMutating: isDeleteMutating, mutate: deleteMutate } = useDeleteMutation<CaseDbCase>({
    associationQueryKeys: QueryClientService.getInstance().getQueryKeyDependencies([CASEDB_QUERY_KEY.CASES], true),
    getErrorNotificationMessage: (data) => t('Unable to remove case: {{id}}.', { id: data.id }),
    getProgressNotificationMessage: (data) => t('Deleting case: {{id}}...', { id: data.id }),
    getSuccessNotificationMessage: (data) => t('Case: {{id}}, has been removed.', { id: data.id }),
    onError: onDeleteError,
    onSuccess: onDeleteSuccess,
    queryFn: async (item: CaseDbCase) => {
      return await CaseDbCaseApi.getInstance().casesDeleteOne(item.id);
    },
    resourceQueryKey: QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.CASES),
  });

  const caseRightsQuery = useCaseRightsQuery(caseIds, openProps.caseTypeId, !isDeleteMutating && !isRefreshingData);
  const loadables = useArray([caseRightsQuery, dataCollectionsQuery, dataCollectionsMapQuery, dataCollectionOptionsQuery]);

  const { data: caseDbCase, error: caseError, isLoading: caseIsLoading } = useItemQuery<CaseDbCase>({
    baseQueryKey: CASEDB_QUERY_KEY.CASES_LAZY,
    itemId: openProps.caseId,
    useQueryOptions: {
      enabled: !isDeleteMutating && !isRefreshingData,
      queryFn: async ({ signal }) => {
        const response = await CaseDbCaseApi.getInstance().casesGetOne(openProps.caseId, { signal });
        return response.data;
      },
    },
  });

  const caseDataCollectionLinksFilter = useMemo<CaseDbTypedUuidSetFilter>(() => ({
    invert: false,
    key: 'case_id',
    members: [caseDbCase?.id],
    type: 'UUID_SET',
  }), [caseDbCase?.id]);
  const { data: caseDataCollectionLinks, error: caseDataCollectionLinksError, isLoading: isCaseDataCollectionLinksLoading } = useQueryMemo({
    enabled: !!caseDbCase,
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().caseDataCollectionLinksPostQuery(caseDataCollectionLinksFilter, null, null, { signal });
      return response.data;
    },
    queryKey: QueryClientService.getInstance().getGenericKey(CASEDB_QUERY_KEY.CASE_DATA_COLLECTION_LINKS, caseDataCollectionLinksFilter),
  });


  const canEdit = useMemo(() => {
    return !!caseRightsQuery.data && caseRightsQuery.data.some((right) => right.is_full_access || right.write_col_ids.length) && (FeatureFlagsService.getInstance().featureFlags?.upload_enabled ?? false);
  }, [caseRightsQuery.data]);

  const canShare = useMemo(() => {
    return !!caseRightsQuery.data && caseRightsQuery.data.some((right) => right.is_full_access || right.remove_data_collection_ids.length || right.add_data_collection_ids.length);
  }, [caseRightsQuery.data]);

  const canDelete = useCallback(() => {
    return !!caseRightsQuery.data && caseRightsQuery.data.some((right) => right.is_full_access || right.can_delete);
  }, [caseRightsQuery]);

  const onEditButtonClick = useCallback(() => {
    setCurrentTab(CASE_INFO_DIALOG_TAB_NAME.EDIT);
  }, []);

  const onShareButtonClick = useCallback(() => {
    setCurrentTab(CASE_INFO_DIALOG_TAB_NAME.SHARING);
  }, []);

  const onGoBackButtonClick = useCallback(() => {
    setCurrentTab(CASE_INFO_DIALOG_TAB_NAME.INFO);
  }, []);


  const onEpiCaseFormIsSavingChange = useCallback((isSaving: boolean) => {
    setIsEpiCaseFormSaving(isSaving);
  }, []);

  const onEpiCaseDataCollectionFormIsSavingChange = useCallback((isSaving: boolean) => {
    setIsEpiCaseDataCollectionFormSaving(isSaving);
  }, []);

  const onDeleteEventButtonClick = useCallback(() => {
    deleteConfirmationRef.current.open();
  }, []);

  const onDeleteConfirmationConfirm = useCallback(() => {
    deleteMutate(caseDbCase);
  }, [caseDbCase, deleteMutate]);

  const isSaving = isEpiCaseFormSaving || isEpiCaseDataCollectionFormSaving;

  useEffect(() => {
    if (currentTab === CASE_INFO_DIALOG_TAB_NAME.EDIT) {
      onTitleChange(t`Case information - Edit`);
    } else if (currentTab === CASE_INFO_DIALOG_TAB_NAME.SHARING) {
      onTitleChange(t`Case information - Share`);
    } else {
      onTitleChange(t`Case information`);
    }
  }, [currentTab, onTitleChange, t]);

  useEffect(() => {
    const actions: DialogAction[] = [];

    if (currentTab === CASE_INFO_DIALOG_TAB_NAME.EDIT || currentTab === CASE_INFO_DIALOG_TAB_NAME.SHARING) {
      actions.push({
        ...TestIdUtil.createAttributes('CaseInfoDialog-goBackButton'),
        color: 'primary',
        disabled: isSaving,
        label: t`Go back`,
        onClick: onGoBackButtonClick,
        startIcon: <ArrowLeftIcon />,
        variant: 'outlined',
      });
    }

    if (currentTab === CASE_INFO_DIALOG_TAB_NAME.EDIT && canEdit) {
      actions.push(
        {
          ...TestIdUtil.createAttributes('CaseInfoDialog-saveButton'),
          color: 'secondary',
          disabled: isSaving,
          form: valuesFormId,
          label: t`Save`,
          startIcon: <SaveIcon />,
          type: 'submit',
          variant: 'contained',
        },
      );
    } else if (currentTab === CASE_INFO_DIALOG_TAB_NAME.SHARING && canShare) {
      actions.push(
        {
          ...TestIdUtil.createAttributes('CaseInfoDialog-saveButton'),
          color: 'secondary',
          disabled: isSaving,
          form: dataCollectionsFormId,
          label: t`Save`,
          startIcon: <SaveIcon />,
          type: 'submit',
          variant: 'contained',
        },
      );
    } else if (currentTab === CASE_INFO_DIALOG_TAB_NAME.INFO) {
      actions.push(
        {
          ...TestIdUtil.createAttributes('CaseSetInfoDialog-deleteButton'),
          color: 'primary',
          disabled: !canDelete(),
          label: t`Delete`,
          onClick: onDeleteEventButtonClick,
          startIcon: <DeleteIcon />,
          variant: 'outlined',
        },
      );
      actions.push(
        {
          ...TestIdUtil.createAttributes('CaseInfoDialog-editDataCollectionsButton'),
          color: 'primary',
          disabled: !canShare,
          label: t`Share`,
          onClick: onShareButtonClick,
          startIcon: <ShareIcon />,
          variant: 'outlined',
        },
      );
      actions.push(
        {
          ...TestIdUtil.createAttributes('CaseInfoDialog-editCaseContentButton'),
          color: 'primary',
          disabled: !canEdit,
          label: t`Edit`,
          onClick: onEditButtonClick,
          startIcon: <EditIcon />,
          variant: 'outlined',
        },
      );
    }
    onActionsChange(actions);
  }, [onActionsChange, onEditButtonClick, t, currentTab, onGoBackButtonClick, onShareButtonClick, valuesFormId, dataCollectionsFormId, onClose, isSaving, canShare, onDeleteEventButtonClick, canDelete, canEdit]);

  const caseAbacContextValue = useMemo<CaseAbacContext>(() => {
    return {
      createdInDataCollection: caseDbCase ? dataCollectionsMapQuery.map.get(caseDbCase.created_in_data_collection_id) : undefined,
      itemDataCollectionLinks: [caseDataCollectionLinks],
      rights: caseRightsQuery.data,
      userDataCollectionOptions: dataCollectionOptionsQuery.options,
      userDataCollections: dataCollectionsQuery.data,
      userDataCollectionsMap: dataCollectionsMapQuery.map,
    };
  }, [dataCollectionsQuery.data, dataCollectionsMapQuery.map, dataCollectionOptionsQuery.options, caseDataCollectionLinks, caseRightsQuery.data, caseDbCase]);

  if (isRefreshingData) {
    return (
      <Spinner
        inline
        label={t`Refreshing data`}
      />
    );
  }

  return (
    <>
      <ResponseHandler
        error={caseError || caseDataCollectionLinksError}
        inlineSpinner
        isLoading={caseIsLoading || isCaseDataCollectionLinksLoading}
        loadables={loadables}
        shouldHideActionButtons
      >
        <CaseAbacContextProvider caseAbac={caseAbacContextValue}>
          <ReadOnlyCaseContent
            caseDbCase={caseDbCase}
            sx={{
              marginBottom: 2,
            }}
          />
          {currentTab === CASE_INFO_DIALOG_TAB_NAME.INFO && (
            <>
              <CaseSharingInfo
                sx={{
                  marginBottom: 2,
                }}
              />
              <CaseCaseSetInfo
                caseDbCase={caseDbCase}
                sx={{
                  marginBottom: 2,
                }}
              />
              <CaseContent
                caseDbCase={caseDbCase}
                sx={{
                  marginBottom: 2,
                }}
              />
            </>
          )}
          {currentTab === CASE_INFO_DIALOG_TAB_NAME.EDIT && canEdit && (
            <CaseInfoForm
              caseDbCase={caseDbCase}
              caseRights={caseRightsQuery.data?.[0]}
              formId={valuesFormId}
              onFinish={onFinish}
              onIsSavingChange={onEpiCaseFormIsSavingChange}
            />
          )}
          {currentTab === CASE_INFO_DIALOG_TAB_NAME.EDIT && !canEdit && (
            <Typography variant={'body1'}>
              {t`You do not have permissions to edit this case.`}
            </Typography>
          )}
          {currentTab === CASE_INFO_DIALOG_TAB_NAME.SHARING && canShare && (
            <CaseSharingForm
              caseDbCase={caseDbCase}
              formId={dataCollectionsFormId}
              onFinish={onFinish}
              onIsSavingChange={onEpiCaseDataCollectionFormIsSavingChange}
            />
          )}
          {currentTab === CASE_INFO_DIALOG_TAB_NAME.SHARING && !canShare && (
            <Typography variant={'body1'}>
              {t`You do not have permissions to share this case.`}
            </Typography>
          )}
        </CaseAbacContextProvider>
      </ResponseHandler>
      <Confirmation
        body={t`Are you sure you want to delete the case?`}
        cancelLabel={t`Cancel`}
        confirmLabel={t`Delete`}
        onConfirm={onDeleteConfirmationConfirm}
        ref={deleteConfirmationRef}
        title={t`Delete case?`}
      />
    </>
  );
}, {
  fullWidth: true,
  maxWidth: 'lg',
  testId: 'CaseInfoDialog',
});
