import type { ReactElement } from 'react';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import ShareIcon from '@mui/icons-material/Share';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import type {
  CaseDbCaseSet,
  CaseDbTypedUuidSetFilter,
} from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';


import { EpiCaseSetDescription } from './EpiCaseSetDescription';
import { EpiCaseSetSharingForm } from './EpiCaseSetSharingForm';
import { EpiCaseSetSharingInfo } from './EpiCaseSetSharingInfo';
import { EpiCaseSetForm } from './EpiCaseSetForm';
import { EpiCaseSetContent } from './EpiCaseSetContent';
import { WithDialogRenderProps, WithDialogRefMethods, withDialog, ConfirmationRefMethods, useArray, useDeleteMutation, QueryManager, QUERY_KEY, useItemQuery, useQueryMemo, RouterManager, DialogAction, TestIdUtil, Spinner, ResponseHandler, Confirmation } from '@gen-epix/ui';
import { CaseAbacContext, CaseAbacContextProvider } from '../../../context/caseAbac';
import { useCaseSetRightsQuery } from '../../../dataHooks/useCaseSetRightsQuery';
import { useDataCollectionsQuery, useDataCollectionsMapQuery, useDataCollectionOptionsQuery } from '../../../dataHooks/useDataCollectionsQuery';
import { CaseSetUtil } from '../../../utils/CaseSetUtil';


export interface EpiCaseSetInfoDialogOpenProps {
  readonly caseSetId: string;
  readonly caseTypeId: string;
}

export interface EpiCaseSetInfoDialogProps extends WithDialogRenderProps<EpiCaseSetInfoDialogOpenProps> {
  readonly showNavigationButton?: boolean;
}

export type EpiCaseSetInfoDialogRefMethods = WithDialogRefMethods<EpiCaseSetInfoDialogProps, EpiCaseSetInfoDialogOpenProps>;

export const EpiCaseSetInfoDialog = withDialog<EpiCaseSetInfoDialogProps, EpiCaseSetInfoDialogOpenProps>((
  {
    onActionsChange,
    onClose,
    onPermalinkChange,
    onTitleChange,
    openProps,
    showNavigationButton,
  }: EpiCaseSetInfoDialogProps,
): ReactElement => {
  const { t } = useTranslation();
  const caseSetIds = useMemo(() => [openProps.caseSetId], [openProps.caseSetId]);
  const caseSetRightsQuery = useCaseSetRightsQuery(caseSetIds);
  const dataCollectionsQuery = useDataCollectionsQuery();
  const dataCollectionsMapQuery = useDataCollectionsMapQuery();
  const dataCollectionOptionsQuery = useDataCollectionOptionsQuery();
  const [isEditingCaseSetContent, setIsEditingCaseSetContent] = useState(false);
  const [isEditingDataCollections, setIsEditingDataCollections] = useState(false);
  const [isEpiCaseSetFormSaving, setIsEpiCaseSetFormSaving] = useState(false);
  const [isEpiCaseSetDataCollectionFormSaving, setIsEpiCaseSetDataCollectionFormSaving] = useState(false);
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const deleteConfirmationRef = useRef<ConfirmationRefMethods>(null);
  const valuesFormId = useId();
  const dataCollectionsFormId = useId();
  const loadables = useArray([caseSetRightsQuery, dataCollectionsQuery, dataCollectionsMapQuery, dataCollectionOptionsQuery]);


  const onDeleteSuccess = useCallback(() => {
    onClose();
  }, [onClose]);

  const onDeleteError = useCallback(() => {
    onClose();
  }, [onClose]);

  const { isMutating: isDeleteMutating, mutate: deleteMutate } = useDeleteMutation<CaseDbCaseSet>({
    associationQueryKeys: QueryManager.getInstance().getQueryKeyDependencies([QUERY_KEY.CASE_SETS], true),
    getErrorNotificationMessage: (data) => t('Unable to remove event: {{name}}.', { name: data.name }),
    getProgressNotificationMessage: (data) => t('Deleting event: {{name}}...', { name: data.name }),
    getSuccessNotificationMessage: (data) => t('Event: {{name}}, has been removed.', { name: data.name }),
    onError: onDeleteError,
    onSuccess: onDeleteSuccess,
    queryFn: async (item: CaseDbCaseSet) => {
      return await CaseDbCaseApi.getInstance().caseSetsDeleteOne(item.id);
    },
    resourceQueryKey: QueryManager.getInstance().getGenericKey(QUERY_KEY.CASE_SETS),
  });

  const { data: caseSet, error: caseSetError, isLoading: isCaseSetLoading } = useItemQuery<CaseDbCaseSet>({
    baseQueryKey: QUERY_KEY.CASE_SETS,
    itemId: openProps.caseSetId,
    useQueryOptions: {
      enabled: !isDeleteMutating,
      queryFn: async ({ signal }) => {
        const response = await CaseDbCaseApi.getInstance().caseSetsGetOne(openProps.caseSetId, { signal });
        return response.data;
      },
    },
  });

  const caseSetDataCollectionLinksFilter = useMemo<CaseDbTypedUuidSetFilter>(() => ({
    invert: false,
    key: 'case_set_id',
    members: [caseSet?.id],
    type: 'UUID_SET',
  }), [caseSet?.id]);
  const { data: caseSetDataCollectionLinks, error: caseSetDataCollectionLinksError, isLoading: isSetCaseDataCollectionLinksLoading } = useQueryMemo({
    enabled: !!caseSet && !isDeleteMutating,
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().caseSetDataCollectionLinksPostQuery(caseSetDataCollectionLinksFilter, { signal });
      return response.data;
    },
    queryKey: QueryManager.getInstance().getGenericKey(QUERY_KEY.CASE_SET_DATA_COLLECTION_LINKS, caseSetDataCollectionLinksFilter),
  });

  const canEdit = useMemo(() => {
    return !!caseSetRightsQuery.data && caseSetRightsQuery.data.some((right) => right.is_full_access || right.write_case_set);
  }, [caseSetRightsQuery.data]);

  const canShare = useMemo(() => {
    return !!caseSetRightsQuery.data && caseSetRightsQuery.data.some((right) => right.is_full_access || right.remove_data_collection_ids.length || right.add_data_collection_ids.length);
  }, [caseSetRightsQuery.data]);

  const canDelete = useCallback(() => {
    return !!caseSetRightsQuery.data && caseSetRightsQuery.data.some((right) => right.is_full_access || right.can_delete);
  }, [caseSetRightsQuery]);

  const onEditCaseContentButtonClick = useCallback(() => {
    setIsEditingCaseSetContent(true);
  }, []);

  const onEditDataCollectionsButtonClick = useCallback(() => {
    setIsEditingDataCollections(true);
  }, []);

  const onGoBackButtonClick = useCallback(() => {
    setIsEditingCaseSetContent(false);
    setIsEditingDataCollections(false);
  }, []);

  const onFinish = useCallback(() => {
    setIsEpiCaseSetFormSaving(false);
    setIsEpiCaseSetDataCollectionFormSaving(false);
    setIsRefreshingData(true);
    setIsEditingCaseSetContent(false);
    setIsEditingDataCollections(false);
    setIsRefreshingData(false);
  }, []);

  const onEpiCaseSetFormIsSavingChange = useCallback((isSaving: boolean) => {
    setIsEpiCaseSetFormSaving(isSaving);
  }, []);

  const onEpiCaseSetDataCollectionFormIsSavingChange = useCallback((isSaving: boolean) => {
    setIsEpiCaseSetDataCollectionFormSaving(isSaving);
  }, []);

  const onDeleteEventButtonClick = useCallback(() => {
    deleteConfirmationRef.current.open();
  }, []);

  const onDeleteConfirmationConfirm = useCallback(() => {
    deleteMutate(caseSet);
  }, [caseSet, deleteMutate]);

  const isSaving = isEpiCaseSetFormSaving || isEpiCaseSetDataCollectionFormSaving;

  const onGotoEventButtonClick = useCallback(async () => {
    await RouterManager.getInstance().router.navigate(CaseSetUtil.createCaseSetLink(caseSet));
  }, [caseSet]);

  useEffect(() => {
    if (caseSet) {
      onPermalinkChange(CaseSetUtil.createCaseSetLink(caseSet, true));
    }
  }, [caseSet, onPermalinkChange]);

  useEffect(() => {
    if (!caseSet) {
      onTitleChange(t`Loading`);
    } else if (isEditingCaseSetContent) {
      onTitleChange(t('{{name}} - Edit', { name: caseSet.name }));
    } else if (isEditingDataCollections) {
      onTitleChange(t('{{name}} - Share', { name: caseSet.name }));
    } else {
      onTitleChange(caseSet?.name);
    }
  }, [isEditingDataCollections, isEditingCaseSetContent, onTitleChange, t, caseSet]);

  useEffect(() => {
    const actions: DialogAction[] = [];

    if (isEditingCaseSetContent || isEditingDataCollections) {
      actions.push({
        ...TestIdUtil.createAttributes('EpiCaseSetInfoDialog-goBackButton'),
        color: 'primary',
        disabled: isSaving,
        label: t`Go back`,
        onClick: onGoBackButtonClick,
        startIcon: <ArrowLeftIcon />,
        variant: 'outlined',
      });
    }

    if (isEditingCaseSetContent) {
      actions.push(
        {
          ...TestIdUtil.createAttributes('EpiCaseSetInfoDialog-saveButton'),
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
          ...TestIdUtil.createAttributes('EpiCaseSetInfoDialog-saveButton'),
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
        {
          ...TestIdUtil.createAttributes('EpiCaseSetInfoDialog-editDataCollectionsButton'),
          color: 'primary',
          disabled: !canShare,
          label: t`Share`,
          onClick: onEditDataCollectionsButtonClick,
          startIcon: <ShareIcon />,
          variant: 'outlined',
        },
        {
          ...TestIdUtil.createAttributes('EpiCaseSetInfoDialog-editCaseContentButton'),
          color: 'primary',
          disabled: !canEdit,
          label: t`Edit`,
          onClick: onEditCaseContentButtonClick,
          startIcon: <EditIcon />,
          variant: 'outlined',
        },
      );

      if (showNavigationButton) {
        actions.push(
          {
            ...TestIdUtil.createAttributes('EpiCaseSetInfoDialog-goToEvent'),
            autoFocus: true,
            color: 'secondary',
            label: t`Go to event`,
            onClick: onGotoEventButtonClick,
            variant: 'contained',
          },
        );
      }
    }


    onActionsChange(actions);
  }, [onActionsChange, showNavigationButton, onClose, onGotoEventButtonClick, t, caseSet, isEditingCaseSetContent, isEditingDataCollections, onGoBackButtonClick, isSaving, valuesFormId, dataCollectionsFormId, onEditDataCollectionsButtonClick, onEditCaseContentButtonClick, onDeleteEventButtonClick, canEdit, canShare, canDelete]);

  const caseAbacContextValue = useMemo<CaseAbacContext>(() => {
    return {
      createdInDataCollection: caseSet ? dataCollectionsMapQuery.map.get(caseSet?.created_in_data_collection_id) : undefined,
      itemDataCollectionLinks: [caseSetDataCollectionLinks],
      rights: caseSetRightsQuery.data,
      userDataCollectionOptions: dataCollectionOptionsQuery.options,
      userDataCollections: dataCollectionsQuery.data,
      userDataCollectionsMap: dataCollectionsMapQuery.map,
    };
  }, [caseSet, caseSetDataCollectionLinks, caseSetRightsQuery.data, dataCollectionOptionsQuery.options, dataCollectionsMapQuery.map, dataCollectionsQuery.data]);

  if (isRefreshingData || isDeleteMutating) {
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
        error={caseSetError || caseSetDataCollectionLinksError}
        inlineSpinner
        isLoading={isCaseSetLoading || isSetCaseDataCollectionLinksLoading}
        loadables={loadables}
        shouldHideActionButtons
      >
        <CaseAbacContextProvider caseAbac={caseAbacContextValue}>
          {!isEditingCaseSetContent && !isEditingDataCollections && (
            <>
              <EpiCaseSetContent
                caseSet={caseSet}
                sx={{
                  marginBottom: 2,
                }}
              />
              <EpiCaseSetSharingInfo
                sx={{
                  marginBottom: 2,
                }}
              />
              <EpiCaseSetDescription
                caseSet={caseSet}
                sx={{
                  marginBottom: 2,
                }}
              />
            </>
          )}
          {isEditingCaseSetContent && (
            <EpiCaseSetForm
              caseSet={caseSet}
              formId={valuesFormId}
              onFinish={onFinish}
              onIsSavingChange={onEpiCaseSetFormIsSavingChange}
            />
          )}
          {isEditingDataCollections && (
            <EpiCaseSetSharingForm
              caseSet={caseSet}
              caseTypeId={openProps.caseTypeId}
              formId={dataCollectionsFormId}
              onFinish={onFinish}
              onIsSavingChange={onEpiCaseSetDataCollectionFormIsSavingChange}
            />
          )}
        </CaseAbacContextProvider>
      </ResponseHandler>
      <Confirmation
        body={t`Are you sure you want to delete the event?`}
        cancelLabel={t`Cancel`}
        confirmLabel={t`Delete`}
        onConfirm={onDeleteConfirmationConfirm}
        ref={deleteConfirmationRef}
        title={t`Delete event?`}
      />

    </>
  );
}, {
  fullWidth: true,
  maxWidth: 'lg',
  testId: 'EpiCaseSetInfoDialog',
  titleVariant: 'h2',
});
