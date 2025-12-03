import {
  Alert,
  AlertTitle,
  Box,
} from '@mui/material';
import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  type ReactElement,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import { useQuery } from '@tanstack/react-query';
import {
  FormProvider,
  useForm,
  useWatch,
} from 'react-hook-form';
import noop from 'lodash/noop';

import {
  withDialog,
  type WithDialogRefMethods,
  type WithDialogRenderProps,
} from '../../../hoc/withDialog';
import { EpiCasesAlreadyInCaseSetWarning } from '../EpiCasesAlreadyInCaseSetWarning';
import type {
  Case,
  CaseSet,
  TypedUuidSetFilter,
  CaseSetMember,
} from '../../../api';
import { CaseApi } from '../../../api';
import { useDataCollectionsMapQuery } from '../../../dataHooks/useDataCollectionsQuery';
import { useEditMutation } from '../../../hooks/useEditMutation';
import { QUERY_KEY } from '../../../models/query';
import { EpiStoreContext } from '../../../stores/epiStore';
import { EpiCaseUtil } from '../../../utils/EpiCaseUtil';
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

import { EpiAddCasesToEventDialogSuccessNotificationMessage } from './EpiAddCasesToEventDialogSuccessNotificationMessage';

export interface EpiAddCasesToEventDialogOpenProps {
  rows: Case[];
  currentCaseSet: CaseSet;
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
    openProps,
    onActionsChange,
    onTitleChange,
    onClose,
  }: EpiAddCasesToEventDialogProps,
): ReactElement => {
  const [t] = useTranslation();

  const dataCollectionsMapQuery = useDataCollectionsMapQuery();
  const caseSetOptionsQuery = useCaseSetOptionsQuery();
  const caseSetsMapQuery = useCaseSetsMapQuery();
  const epiStore = useContext(EpiStoreContext);
  const fetchData = useStore(epiStore, useShallow((state) => state.fetchData));
  const completeCaseType = useStore(epiStore, useShallow((state) => state.completeCaseType));
  const formId = useId();
  const filteredCaseSetOptions = useMemo(() => (caseSetOptionsQuery.options ?? []).filter(option => {
    if (openProps.currentCaseSet && option.value === openProps.currentCaseSet.id) {
      return false;
    }
    const caseSet = caseSetsMapQuery.map.get(option.value);
    if (caseSet.case_type_id !== completeCaseType.id) {
      return false;
    }

    return true;
  }), [caseSetOptionsQuery.options, caseSetsMapQuery.map, completeCaseType.id, openProps.currentCaseSet]);

  const formMethods = useForm<FormFields>({
    values: {
      caseSetId: filteredCaseSetOptions?.length === 1 ? filteredCaseSetOptions[0].value : null,
      shouldApplySharingToCases: true,
    },
  });

  const { control } = formMethods;
  const { caseSetId, shouldApplySharingToCases } = useWatch({ control });

  const caseSetMembersFilter = useMemo<TypedUuidSetFilter>(() => ({
    invert: false,
    key: 'case_set_id',
    type: 'UUID_SET',
    members: [caseSetId],
  }), [caseSetId]);
  const { isLoading: isCaseSetMembersLoading, error: caseSetMembersError, data: caseSetMembers } = useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SET_MEMBERS, caseSetMembersFilter),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.caseSetMembersPostQuery(caseSetMembersFilter, { signal });
      return response.data;
    },
    enabled: !!caseSetId,
  });

  const caseSetDataCollectionLinksFilter = useMemo<TypedUuidSetFilter>(() => ({
    invert: false,
    key: 'case_set_id',
    type: 'UUID_SET',
    members: [caseSetId],
  }), [caseSetId]);
  const { isLoading: isCaseSetDataCollectionLinksLoading, error: caseSetDataCollectionLinksError, data: caseSetDataCollectionLinks } = useQuery({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.CASE_SET_DATA_COLLECTION_LINKS, caseSetDataCollectionLinksFilter),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.caseSetDataCollectionLinksPostQuery(caseSetDataCollectionLinksFilter, { signal });
      return response.data;
    },
    enabled: !!caseSetId,
  });

  const caseSetDataCollections = useMemo(() => {
    return caseSetDataCollectionLinks?.map(link => dataCollectionsMapQuery.map.get(link.data_collection_id)).filter(x => !!x);
  }, [caseSetDataCollectionLinks, dataCollectionsMapQuery.map]);

  const caseIdsToAdd = useMemo(() => {
    return openProps.rows.map(row => row.id).filter(caseId => !(caseSetMembers ?? []).map(x => x.case_id).includes(caseId));
  }, [caseSetMembers, openProps.rows]);

  const onSuccess = useCallback(async () => {
    if (shouldApplySharingToCases) {
      await EpiCaseUtil.applyDataCollectionLinks({
        caseSetId,
        caseIds: openProps.rows ? openProps.rows.map(row => row.id) : undefined,
        caseSetDataCollectionIds: caseSetDataCollectionLinks?.map(link => link.data_collection_id),
      });
    }
    await fetchData();
    onClose();
  }, [caseSetDataCollectionLinks, caseSetId, fetchData, onClose, openProps.rows, shouldApplySharingToCases]);

  const onError = useCallback(async () => {
    await fetchData();
    onClose();
  }, [fetchData, onClose]);

  const { mutate: mutateItems, isMutating: isMutatingItems } = useEditMutation<CaseSetMember[]>({
    associationQueryKeys: QueryUtil.getQueryKeyDependencies([QUERY_KEY.CASE_SET_MEMBERS], true),
    queryFn: async (items: CaseSetMember[]) => {
      await CaseApi.instance.caseSetMembersPostSome(items);
      return items;
    },
    onSuccess,
    onError,
    getProgressNotificationMessage: () => t('Adding case(s) to {{caseSetName}}', { caseSetName: caseSetsMapQuery.map.get(caseSetId).name }),
    getSuccessNotificationMessage: () => (
      <EpiAddCasesToEventDialogSuccessNotificationMessage
        caseSet={caseSetsMapQuery.map.get(caseSetId)}
        numAddedCases={caseIdsToAdd.length}
      />
    ),
    getErrorNotificationMessage: () => t('Failed add case(s) to {{caseSetName}}', { caseSetName: caseSetsMapQuery.map.get(caseSetId).name }),
  });

  const onConfirmButtonClick = useCallback((() => {
    mutateItems(caseIdsToAdd.map(caseId => ({
      case_set_id: caseSetId,
      case_id: caseId,
    } satisfies CaseSetMember)));
  }), [caseIdsToAdd, caseSetId, mutateItems]);

  const onCancelButtonClick = useCallback((() => {
    onClose();
  }), [onClose]);

  useEffect(() => {
    onTitleChange(t('Add {{numCases}} selected case(s) to an existing event', { numCases: openProps.rows.length }));
  }, [completeCaseType.name, onTitleChange, openProps.rows.length, t]);

  useEffect(() => {
    const actions: DialogAction[] = [];
    actions.push(
      {
        ...TestIdUtil.createAttributes('EpiAddCasesToEventDialog-confirmButton'),
        color: 'secondary',
        autoFocus: true,
        variant: 'contained',
        onClick: onConfirmButtonClick,
        disabled: (caseSetId && isCaseSetMembersLoading) || !caseSetId || isMutatingItems || caseIdsToAdd.length < 1,
        loading: (caseSetId && isCaseSetMembersLoading) || isMutatingItems || isCaseSetDataCollectionLinksLoading,
        label: t`Confirm`,
        form: formId,
        type: 'submit',
      },
    );
    onActionsChange(actions);
  }, [caseSetId, formId, isMutatingItems, isCaseSetMembersLoading, onActionsChange, onCancelButtonClick, onConfirmButtonClick, t, caseIdsToAdd.length, isCaseSetDataCollectionLinksLoading]);

  const loadables = useArray([caseSetOptionsQuery, caseSetsMapQuery, dataCollectionsMapQuery]);

  const booleanOptions = useMemo(() => FormUtil.createBooleanOptions(t), [t]);

  return (
    <ResponseHandler
      isLoading={isMutatingItems}
      loadables={loadables}
    >
      <FormProvider {...formMethods}>
        <form
          autoComplete={'off'}
          onSubmit={noop}
        >
          <Box>
            <Box marginY={1}>
              <Autocomplete
                label={t`Select event`}
                name={'caseSetId'}
                options={filteredCaseSetOptions}
                warningMessage={filteredCaseSetOptions?.length === 0 ? t`No events of the same case type available` : undefined}
              />
            </Box>
            <Box marginY={1}>
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
            <Box marginY={2}>
              <ResponseHandler
                inlineSpinner
                shouldHideActionButtons
                error={caseSetMembersError || caseSetDataCollectionLinksError}
                isLoading={isCaseSetMembersLoading}
              >
                {caseSetDataCollections?.length > 0 && (
                  <Box marginY={2}>
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
                  <Box marginY={2}>
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
                  <Box marginY={2}>
                    <Alert severity={'error'}>
                      <AlertTitle>
                        {t(`All selected case(s) are already part of the selected event.`)}
                      </AlertTitle>
                    </Alert>
                  </Box>
                )}
                {caseIdsToAdd.length > 0 && (
                  <Box marginY={2}>
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
  testId: 'EpiAddCasesToEventDialog',
  maxWidth: 'md',
  fullWidth: true,
  defaultTitle: '',
});
