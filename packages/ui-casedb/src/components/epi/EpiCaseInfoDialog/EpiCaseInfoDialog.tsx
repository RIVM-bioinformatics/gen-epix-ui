import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import ShareIcon from '@mui/icons-material/Share';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import {
  type ReactElement,
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  QueryClientManager,
  ResponseHandler,
  Spinner,
  TestIdUtil,
  useArray,
  useDeleteMutation,
  useItemQuery,
  useQueryMemo,
  withDialog,
} from '@gen-epix/ui';

import type { CaseAbacContext } from '../../../context/caseAbac';
import { CaseAbacContextProvider } from '../../../context/caseAbac';
import { useCaseRightsQuery } from '../../../dataHooks/useCaseRightsQuery';
import {
  useDataCollectionOptionsQuery,
  useDataCollectionsMapQuery,
  useDataCollectionsQuery,
} from '../../../dataHooks/useDataCollectionsQuery';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { CASEDB_QUERY_KEY } from '../../../data/query';

import { EpiCaseCaseSetInfo } from './EpiCaseCaseSetInfo';
import { EpiCaseForm } from './EpiCaseForm';
import { EpiReadOnlyCaseContent } from './EpiReadOnlyCaseContent';
import { EpiCaseContent } from './EpiCaseContent';
import { EpiCaseSharingInfo } from './EpiCaseSharingInfo';
import { EpiCaseSharingForm } from './EpiCaseSharingForm';


export interface EpiCaseInfoDialogOpenProps {
  caseId: string;
  caseTypeId: string;
}

export interface EpiCaseInfoDialogProps extends WithDialogRenderProps<EpiCaseInfoDialogOpenProps> {
  //
}

export type EpiCaseInfoDialogRefMethods = WithDialogRefMethods<EpiCaseInfoDialogProps, EpiCaseInfoDialogOpenProps>;

export const EpiCaseInfoDialog = withDialog<EpiCaseInfoDialogProps, EpiCaseInfoDialogOpenProps>((
  {
    onActionsChange,
    onClose,
    onTitleChange,
    openProps,
  }: EpiCaseInfoDialogProps,
): ReactElement => {
  const { t } = useTranslation();
  const caseIds = useMemo(() => [openProps.caseId], [openProps.caseId]);
  const caseRightsQuery = useCaseRightsQuery(caseIds, openProps.caseTypeId);
  const dataCollectionsQuery = useDataCollectionsQuery();
  const dataCollectionsMapQuery = useDataCollectionsMapQuery();
  const dataCollectionOptionsQuery = useDataCollectionOptionsQuery();

  const epiDashboardStore = use(EpiDashboardStoreContext);
  const fetchData = useStore(epiDashboardStore, useShallow((state) => state.fetchData));
  const [isEditingCaseContent, setIsEditingCaseContent] = useState(false);
  const [isEditingDataCollections, setIsEditingDataCollections] = useState(false);
  const [isEpiCaseFormSaving, setIsEpiCaseFormSaving] = useState(false);
  const [isEpiCaseDataCollectionFormSaving, setIsEpiCaseDataCollectionFormSaving] = useState(false);
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const deleteConfirmationRef = useRef<ConfirmationRefMethods>(null);
  const valuesFormId = useId();
  const dataCollectionsFormId = useId();
  const loadables = useArray([caseRightsQuery, dataCollectionsQuery, dataCollectionsMapQuery, dataCollectionOptionsQuery]);

  const onDeleteSuccess = useCallback(() => {
    onClose();
  }, [onClose]);

  const onDeleteError = useCallback(() => {
    onClose();
  }, [onClose]);

  const { isMutating: isDeleteMutating, mutate: deleteMutate } = useDeleteMutation<CaseDbCase>({
    associationQueryKeys: QueryClientManager.getInstance().getQueryKeyDependencies([CASEDB_QUERY_KEY.CASES], true),
    getErrorNotificationMessage: (data) => t('Unable to remove case: {{id}}.', { name: data.id }),
    getProgressNotificationMessage: (data) => t('Deleting case: {{id}}...', { name: data.id }),
    getSuccessNotificationMessage: (data) => t('Case: {{id}}, has been removed.', { name: data.id }),
    onError: onDeleteError,
    onSuccess: onDeleteSuccess,
    queryFn: async (item: CaseDbCase) => {
      return await CaseDbCaseApi.getInstance().casesDeleteOne(item.id);
    },
    resourceQueryKey: QueryClientManager.getInstance().getGenericKey(CASEDB_QUERY_KEY.CASES),
  });

  const { data: epiCase, error: epiCaseError, isLoading: epiCaseIsLoading } = useItemQuery<CaseDbCase>({
    baseQueryKey: CASEDB_QUERY_KEY.CASES_LAZY,
    itemId: openProps.caseId,
    useQueryOptions: {
      enabled: !isDeleteMutating,
      queryFn: async ({ signal }) => {
        const response = await CaseDbCaseApi.getInstance().casesGetOne(openProps.caseId, { signal });
        return response.data;
      },
    },
  });

  const caseDataCollectionLinksFilter = useMemo<CaseDbTypedUuidSetFilter>(() => ({
    invert: false,
    key: 'case_id',
    members: [epiCase?.id],
    type: 'UUID_SET',
  }), [epiCase?.id]);
  const { data: caseDataCollectionLinks, error: caseDataCollectionLinksError, isLoading: isCaseDataCollectionLinksLoading } = useQueryMemo({
    enabled: !!epiCase,
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().caseDataCollectionLinksPostQuery(caseDataCollectionLinksFilter, { signal });
      return response.data;
    },
    queryKey: QueryClientManager.getInstance().getGenericKey(CASEDB_QUERY_KEY.CASE_DATA_COLLECTION_LINKS, caseDataCollectionLinksFilter),
  });


  const canEdit = useMemo(() => {
    return !!caseRightsQuery.data && caseRightsQuery.data.some((right) => right.is_full_access || right.write_col_ids.length);
  }, [caseRightsQuery.data]);

  const canShare = useMemo(() => {
    return !!caseRightsQuery.data && caseRightsQuery.data.some((right) => right.is_full_access || right.remove_data_collection_ids.length || right.add_data_collection_ids.length);
  }, [caseRightsQuery.data]);

  const canDelete = useCallback(() => {
    return !!caseRightsQuery.data && caseRightsQuery.data.some((right) => right.is_full_access || right.can_delete);
  }, [caseRightsQuery]);

  const onEditButtonClick = useCallback(() => {
    setIsEditingCaseContent(true);
  }, []);

  const onShareButtonClick = useCallback(() => {
    setIsEditingDataCollections(true);
  }, []);

  const onGoBackButtonClick = useCallback(() => {
    setIsEditingCaseContent(false);
    setIsEditingDataCollections(false);
  }, []);

  const onFinish = useCallback(() => {
    const perform = async () => {
      setIsEpiCaseFormSaving(false);
      setIsEpiCaseDataCollectionFormSaving(false);
      setIsRefreshingData(true);
      setIsEditingCaseContent(false);
      setIsEditingDataCollections(false);
      await fetchData();
      setIsRefreshingData(false);
    };
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    perform();
  }, [fetchData]);


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
    deleteMutate(epiCase);
  }, [epiCase, deleteMutate]);

  const isSaving = isEpiCaseFormSaving || isEpiCaseDataCollectionFormSaving;

  useEffect(() => {
    if (isEditingCaseContent) {
      onTitleChange(t`Case information - Edit`);
    } else if (isEditingDataCollections) {
      onTitleChange(t`Case information - Share`);
    } else {
      onTitleChange(t`Case information`);
    }
  }, [isEditingDataCollections, isEditingCaseContent, onTitleChange, t]);

  useEffect(() => {
    const actions: DialogAction[] = [];

    if (isEditingCaseContent || isEditingDataCollections) {
      actions.push({
        ...TestIdUtil.createAttributes('EpiCaseInfoDialog-goBackButton'),
        color: 'primary',
        disabled: isSaving,
        label: t`Go back`,
        onClick: onGoBackButtonClick,
        startIcon: <ArrowLeftIcon />,
        variant: 'outlined',
      });
    }

    if (isEditingCaseContent) {
      actions.push(
        {
          ...TestIdUtil.createAttributes('EpiCaseInfoDialog-saveButton'),
          color: 'secondary',
          disabled: isSaving,
          form: valuesFormId,
          label: t`Save`,
          startIcon: <SaveIcon />,
          type: 'submit',
          variant: 'contained',
        },
      );
    } else if (isEditingDataCollections) {
      actions.push(
        {
          ...TestIdUtil.createAttributes('EpiCaseInfoDialog-saveButton'),
          color: 'secondary',
          disabled: isSaving,
          form: dataCollectionsFormId,
          label: t`Save`,
          startIcon: <SaveIcon />,
          type: 'submit',
          variant: 'contained',
        },
      );
    } else {
      actions.push(
        {
          ...TestIdUtil.createAttributes('EpiCaseSetInfoDialog-deleteButton'),
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
          ...TestIdUtil.createAttributes('EpiCaseInfoDialog-editDataCollectionsButton'),
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
          ...TestIdUtil.createAttributes('EpiCaseInfoDialog-editCaseContentButton'),
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
  }, [onActionsChange, onEditButtonClick, t, isEditingCaseContent, onGoBackButtonClick, onShareButtonClick, isEditingDataCollections, valuesFormId, dataCollectionsFormId, onClose, isSaving, canShare, onDeleteEventButtonClick, canDelete, canEdit]);

  const caseAbacContextValue = useMemo<CaseAbacContext>(() => {
    return {
      createdInDataCollection: epiCase ? dataCollectionsMapQuery.map.get(epiCase.created_in_data_collection_id) : undefined,
      itemDataCollectionLinks: [caseDataCollectionLinks],
      rights: caseRightsQuery.data,
      userDataCollectionOptions: dataCollectionOptionsQuery.options,
      userDataCollections: dataCollectionsQuery.data,
      userDataCollectionsMap: dataCollectionsMapQuery.map,
    };
  }, [dataCollectionsQuery.data, dataCollectionsMapQuery.map, dataCollectionOptionsQuery.options, caseDataCollectionLinks, caseRightsQuery.data, epiCase]);

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
        error={epiCaseError || caseDataCollectionLinksError}
        inlineSpinner
        isLoading={epiCaseIsLoading || isCaseDataCollectionLinksLoading}
        loadables={loadables}
        shouldHideActionButtons
      >
        <CaseAbacContextProvider caseAbac={caseAbacContextValue}>
          <EpiReadOnlyCaseContent
            epiCase={epiCase}
            sx={{
              marginBottom: 2,
            }}
          />
          {!isEditingCaseContent && !isEditingDataCollections && (
            <>
              <EpiCaseSharingInfo
                sx={{
                  marginBottom: 2,
                }}
              />
              <EpiCaseCaseSetInfo
                epiCase={epiCase}
                sx={{
                  marginBottom: 2,
                }}
              />
              <EpiCaseContent
                epiCase={epiCase}
                sx={{
                  marginBottom: 2,
                }}
              />
            </>
          )}
          {isEditingCaseContent && (
            <EpiCaseForm
              epiCase={epiCase}
              formId={valuesFormId}
              onFinish={onFinish}
              onIsSavingChange={onEpiCaseFormIsSavingChange}
            />
          )}
          {isEditingDataCollections && (
            <EpiCaseSharingForm
              epiCase={epiCase}
              formId={dataCollectionsFormId}
              onFinish={onFinish}
              onIsSavingChange={onEpiCaseDataCollectionFormIsSavingChange}
            />
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
  testId: 'EpiCaseInfoDialog',
});
