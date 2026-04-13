import {
  Alert,
  AlertTitle,
  Box,
} from '@mui/material';
import {
  type ReactElement,
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import {
  FormProvider,
  useForm,
  useWatch,
} from 'react-hook-form';
import { useShallow } from 'zustand/shallow';

import {
  withDialog,
  type WithDialogRefMethods,
  type WithDialogRenderProps,
} from '../../../hoc/withDialog';
import { EpiCasesAlreadyInCaseSetWarning } from '../EpiCasesAlreadyInCaseSetWarning';
import type {
  Case,
  CaseSet,
  CaseSetMember,
  TypedUuidSetFilter,
} from '../../../api';
import { CaseApi } from '../../../api';
import { useDataCollectionsMapQuery } from '../../../dataHooks/useDataCollectionsQuery';
import { useEditMutation } from '../../../hooks/useEditMutation';
import { QUERY_KEY } from '../../../models/query';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { CaseUtil } from '../../../utils/CaseUtil';
import { FormUtil } from '../../../utils/FormUtil';
import { QueryUtil } from '../../../utils/QueryUtil';
import { TestIdUtil } from '../../../utils/TestIdUtil';
import { ResponseHandler } from '../../ui/ResponseHandler';
import {
  useCaseSetOptionsQuery,
  useCaseSetsMapQuery,
} from '../../../dataHooks/useCaseSetsQuery';
import type { DialogAction } from '../../ui/Dialog';
import { Autocomplete } from '../../form/fields/Autocomplete';
import { Select } from '../../form/fields/Select';
import { useArray } from '../../../hooks/useArray';
import { useQueryMemo } from '../../../hooks/useQueryMemo';
import { DataUtil } from '../../../utils/DataUtil';

import { EpiAddCasesToEventDialogSuccessNotificationMessage } from './EpiAddCasesToEventDialogSuccessNotificationMessage';


export interface EpiAddCasesToEventDialogOpenProps {
  currentCaseSet: CaseSet;
  rows: Case[];
}

export interface EpiAddCasesToEventDialogProps extends WithDialogRenderProps<EpiAddCasesToEventDialogOpenProps> {
  //
}

export type EpiAddCasesToEventDialogRefMethods = WithDialogRefMethods<EpiAddCasesToEventDialogProps, EpiAddCasesToEventDialogOpenProps>;

type FormFields = {
  caseSetId: string;
  shouldApplySharingToCases: boolean;
};

export const EpiAddCasesToEventDialog = withDialog<EpiAddCasesToEventDialogProps, EpiAddCasesToEventDialogOpenProps>((
  {
    onActionsChange,
    onClose,
    onTitleChange,
    openProps,
  }: EpiAddCasesToEventDialogProps,
): ReactElement => {
  const { t } = useTranslation();

  const dataCollectionsMapQuery = useDataCollectionsMapQuery();
  const caseSetOptionsQuery = useCaseSetOptionsQuery();
  const caseSetsMapQuery = useCaseSetsMapQuery();
  const epiDashboardStore = use(EpiDashboardStoreContext);
  const fetchData = useStore(epiDashboardStore, (state) => state.fetchData);
  const completeCaseType = useStore(epiDashboardStore, (state) => state.completeCaseType);
  const similarCaseIds = useStore(epiDashboardStore, useShallow((state) => state.findSimilarCasesResults?.flatMap(result => result.similarCaseIds) ?? []));
  const formId = useId();
  const similarCaseIdsInRows = useMemo(() => {
    return openProps.rows.map(row => row.id).filter(id => similarCaseIds.includes(id));
  }, [openProps.rows, similarCaseIds]);

  const filteredCaseSetOptions = useMemo(() => (caseSetOptionsQuery.options ?? []).filter(option => {
    const caseSet = caseSetsMapQuery.map.get(option.value);

    if (caseSet.case_type_id !== completeCaseType.id) {
      return false;
    }

    if (similarCaseIdsInRows.length === 0 && caseSet?.id === openProps.currentCaseSet?.id) {
      return false;
    }

    return true;
  }).map(option => {
    return {
      ...option,
      label: option.value === openProps.currentCaseSet?.id ? t('{{eventName}} (currently shown event)', { eventName: option.label }) : option.label,
    };
  }), [caseSetOptionsQuery.options, caseSetsMapQuery.map, completeCaseType.id, openProps.currentCaseSet?.id, similarCaseIdsInRows.length, t]);

  const initialSetSetId = useMemo(() => {
    if (filteredCaseSetOptions.length === 1) {
      return filteredCaseSetOptions[0].value;
    }
    if (similarCaseIdsInRows.length > 0 && openProps.currentCaseSet?.id) {
      return openProps.currentCaseSet?.id;
    }
    return null;
  }, [filteredCaseSetOptions, openProps.currentCaseSet?.id, similarCaseIdsInRows.length]);

  const formMethods = useForm<FormFields>({
    values: {
      caseSetId: initialSetSetId,
      shouldApplySharingToCases: true,
    },
  });

  const { control } = formMethods;
  const { caseSetId, shouldApplySharingToCases } = useWatch({ control });

  const caseSetMembersFilter = useMemo<TypedUuidSetFilter>(() => ({
    invert: false,
    key: 'case_set_id',
    members: [caseSetId],
    type: 'UUID_SET',
  }), [caseSetId]);
  const { data: caseSetMembers, error: caseSetMembersError, isLoading: isCaseSetMembersLoading } = useQueryMemo({
    enabled: !!caseSetId,
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.caseSetMembersPostQuery(caseSetMembersFilter, { signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SET_MEMBERS, caseSetMembersFilter),
  });

  const caseSetDataCollectionLinksFilter = useMemo<TypedUuidSetFilter>(() => ({
    invert: false,
    key: 'case_set_id',
    members: [caseSetId],
    type: 'UUID_SET',
  }), [caseSetId]);
  const { data: caseSetDataCollectionLinks, error: caseSetDataCollectionLinksError, isLoading: isCaseSetDataCollectionLinksLoading } = useQueryMemo({
    enabled: !!caseSetId,
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.caseSetDataCollectionLinksPostQuery(caseSetDataCollectionLinksFilter, { signal });
      return response.data;
    },
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SET_DATA_COLLECTION_LINKS, caseSetDataCollectionLinksFilter),
  });

  const caseSetDataCollections = useMemo(() => {
    return caseSetDataCollectionLinks?.map(link => dataCollectionsMapQuery.map.get(link.data_collection_id)).filter(x => !!x);
  }, [caseSetDataCollectionLinks, dataCollectionsMapQuery.map]);

  const caseIdsToAdd = useMemo(() => {
    return openProps.rows.map(row => row.id).filter(caseId => !(caseSetMembers ?? []).map(x => x.case_id).includes(caseId));
  }, [caseSetMembers, openProps.rows]);

  const onSuccess = useCallback(async () => {
    if (shouldApplySharingToCases) {
      await CaseUtil.applyDataCollectionLinks({
        caseIds: openProps.rows ? openProps.rows.map(row => row.id) : undefined,
        caseSetDataCollectionIds: caseSetDataCollectionLinks?.map(link => link.data_collection_id),
        caseSetId,
        caseTypeId: completeCaseType.id,
      });
    }
    await fetchData();
    onClose();
  }, [caseSetDataCollectionLinks, caseSetId, completeCaseType.id, fetchData, onClose, openProps.rows, shouldApplySharingToCases]);

  const onError = useCallback(async () => {
    await fetchData();
    onClose();
  }, [fetchData, onClose]);

  const { isMutating: isMutatingItems, mutate: mutateItems } = useEditMutation<CaseSetMember[]>({
    associationQueryKeys: QueryUtil.getQueryKeyDependencies([QUERY_KEY.CASE_SET_MEMBERS], true),
    getErrorNotificationMessage: () => t('Failed add case(s) to {{caseSetName}}', { caseSetName: caseSetsMapQuery.map.get(caseSetId).name }),
    getProgressNotificationMessage: () => t('Adding case(s) to {{caseSetName}}', { caseSetName: caseSetsMapQuery.map.get(caseSetId).name }),
    getSuccessNotificationMessage: () => (
      <EpiAddCasesToEventDialogSuccessNotificationMessage
        caseSet={caseSetsMapQuery.map.get(caseSetId)}
        numAddedCases={caseIdsToAdd.length}
      />
    ),
    onError,
    onSuccess,
    queryFn: async (items: CaseSetMember[]) => {
      await CaseApi.instance.caseSetMembersPostSome(items);
      return items;
    },
  });

  const onConfirmButtonClick = useCallback((() => {
    mutateItems(caseIdsToAdd.map(caseId => ({
      case_id: caseId,
      case_set_id: caseSetId,
    } satisfies CaseSetMember)));
  }), [caseIdsToAdd, caseSetId, mutateItems]);

  const onCancelButtonClick = useCallback((() => {
    onClose();
  }), [onClose]);

  useEffect(() => {
    const caseSet = caseSetId ? caseSetsMapQuery.map.get(caseSetId) : null;
    if (caseSet) {
      onTitleChange(t('Add {{numCases}} selected case(s) to {{eventName}}', { eventName: DataUtil.getCaseSetName(caseSet), numCases: openProps.rows.length }));
      return;
    }
    onTitleChange(t('Add {{numCases}} selected case(s) to an existing event', { numCases: openProps.rows.length }));
  }, [caseSetId, caseSetsMapQuery.map, completeCaseType.name, onTitleChange, openProps.rows.length, t]);

  useEffect(() => {
    const actions: DialogAction[] = [];
    actions.push(
      {
        ...TestIdUtil.createAttributes('EpiAddCasesToEventDialog-confirmButton'),
        autoFocus: true,
        color: 'secondary',
        disabled: (caseSetId && isCaseSetMembersLoading) || !caseSetId || isMutatingItems || caseIdsToAdd.length < 1,
        form: formId,
        label: t`Confirm`,
        loading: (caseSetId && isCaseSetMembersLoading) || isMutatingItems || isCaseSetDataCollectionLinksLoading,
        onClick: onConfirmButtonClick,
        type: 'submit',
        variant: 'contained',
      },
    );
    onActionsChange(actions);
  }, [caseSetId, formId, isMutatingItems, isCaseSetMembersLoading, onActionsChange, onCancelButtonClick, onConfirmButtonClick, t, caseIdsToAdd.length, isCaseSetDataCollectionLinksLoading]);

  const loadables = useArray([caseSetOptionsQuery, caseSetsMapQuery, dataCollectionsMapQuery]);

  const booleanOptions = useMemo(() => FormUtil.createBooleanOptions(t), [t]);

  const onSubmit = useCallback(() => {
    // noop, as the mutation is triggered by a button outside of the form
  }, []);

  return (
    <ResponseHandler
      isLoading={isMutatingItems}
      loadables={loadables}
    >
      <FormProvider {...formMethods}>
        <form
          autoComplete={'off'}
          onSubmit={onSubmit}
        >
          <Box>
            <Box
              sx={{
                marginY: 1,
              }}
            >
              <Autocomplete
                label={t`Select event`}
                name={'caseSetId'}
                options={filteredCaseSetOptions}
                warningMessage={filteredCaseSetOptions?.length === 0 ? t`No events of the same case type available` : undefined}
              />
            </Box>
            <Box
              sx={{
                marginY: 1,
              }}
            >
              <Select
                disabled={caseSetDataCollectionLinks?.length === 0}
                label={t`Should the selected cases be given the same access rights as the selected event?`}
                loading={caseSetDataCollectionLinks?.length && isCaseSetDataCollectionLinksLoading}
                name={'shouldApplySharingToCases'}
                options={booleanOptions}
                warningMessage={caseSetDataCollectionLinks?.length === 0 ? t`No data collections to add` : undefined}
              />
            </Box>
          </Box>
          {caseSetId && (
            <Box
              sx={{
                marginY: 2,
              }}
            >
              <ResponseHandler
                error={caseSetMembersError || caseSetDataCollectionLinksError}
                inlineSpinner
                isLoading={isCaseSetMembersLoading}
                shouldHideActionButtons
              >
                {caseSetDataCollections?.length > 0 && (
                  <Box
                    sx={{
                      marginY: 2,
                    }}
                  >
                    <Alert severity={'info'}>
                      <AlertTitle>
                        {t('The selected event is shared in the following data collection(s):')}
                      </AlertTitle>
                      {caseSetDataCollections.map(dataCollection => (
                        <Box key={dataCollection.id}>
                          {dataCollection.name}
                        </Box>
                      ))}
                    </Alert>
                  </Box>
                )}
                {caseIdsToAdd.length > 0 && (
                  <Box
                    sx={{
                      marginY: 2,
                    }}
                  >
                    <Alert severity={'info'}>
                      <AlertTitle>
                        {t('{{numCasesToAdd}} selected case(s) will be added to selected the event.', { numCasesToAdd: caseIdsToAdd.length })}
                        {openProps.rows.length !== caseIdsToAdd.length && (
                          <Box>
                            {t('{{numCasesAlreadyInEvent}} selected case(s) are already part of the selected event.', { numCasesAlreadyInEvent: openProps.rows.length - caseIdsToAdd.length })}
                          </Box>
                        )}
                      </AlertTitle>
                    </Alert>
                  </Box>
                )}
                {caseIdsToAdd.length === 0 && (
                  <Box
                    sx={{
                      marginY: 2,
                    }}
                  >
                    <Alert severity={'error'}>
                      <AlertTitle>
                        {t('All selected case(s) are already part of the selected event.')}
                      </AlertTitle>
                    </Alert>
                  </Box>
                )}
                {caseIdsToAdd.length > 0 && (
                  <Box
                    sx={{
                      marginY: 2,
                    }}
                  >
                    <EpiCasesAlreadyInCaseSetWarning
                      cases={openProps.rows.filter(row => caseIdsToAdd.includes(row.id))}
                    />
                  </Box>
                )}
              </ResponseHandler>
            </Box>
          )}
        </form>
      </FormProvider>
    </ResponseHandler>
  );
}, {
  defaultTitle: '',
  fullWidth: true,
  maxWidth: 'md',
  testId: 'EpiAddCasesToEventDialog',
});
