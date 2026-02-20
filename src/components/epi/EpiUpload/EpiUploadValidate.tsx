import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useStore } from 'zustand';
import {
  Alert,
  AlertTitle,
  Box,
} from '@mui/material';
import omit from 'lodash/omit';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/shallow';

import { EpiUploadStoreContext } from '../../../stores/epiUploadStore';
import { EpiCompletCaseTypeLoader } from '../EpiCompletCaseTypeLoader';
import type { CaseForUpload } from '../../../api';
import {
  CaseApi,
  DataIssueType,
  OnExistsUploadAction,
} from '../../../api';
import { useArray } from '../../../hooks/useArray';
import { useQueryMemo } from '../../../hooks/useQueryMemo';
import type { CaseUploadResultWithGeneratedId } from '../../../models/epi';
import {
  createTableStore,
  TableStoreContextProvider,
} from '../../../stores/tableStore';
import { ResponseHandler } from '../../ui/ResponseHandler';
import { EpiUploadUtil } from '../../../utils/EpiUploadUtil';

import { EpiUploadCaseResultTable } from './EpiUploadCaseResultTable';
import { EpiUploadValidateNavigation } from './EpiUploadValidateNavigation';

export const EpiUploadValidateInner = () => {
  const { t } = useTranslation();

  const store = useContext(EpiUploadStoreContext);
  const goToNextStep = useStore(store, (state) => state.goToNextStep);
  const goToPreviousStep = useStore(store, (state) => state.goToPreviousStep);
  const mappedColumns = useStore(store, (state) => state.mappedColumns);
  const completeCaseType = useStore(store, (state) => state.completeCaseType);
  const setValidatedCases = useStore(store, (state) => state.setValidatedCases);
  const caseTypeId = useStore(store, (state) => state.caseTypeId);
  const createdInDataCollectionId = useStore(store, (state) => state.createdInDataCollectionId);
  const rawData = useStore(store, (state) => state.rawData);
  const validateCasesQueryKey = useStore(store, (state) => state.validateCasesQueryKey);
  const [exceedsMaxNumCases, setExceedsMaxNumCases] = useState(false);

  const casesForVerification = useMemo<CaseForUpload[]>(() => {
    return EpiUploadUtil.getCasesForVerification({
      rawData,
      mappedColumns,
      caseTypeId,
      createdInDataCollectionId,
    });
  }, [caseTypeId, createdInDataCollectionId, mappedColumns, rawData]);

  const caseUploadValidationResultQuery = useQueryMemo({
    queryKey: validateCasesQueryKey,
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.uploadCases({
        case_type_id: caseTypeId,
        created_in_data_collection_id: createdInDataCollectionId,
        verify_only: true,
        on_exists: OnExistsUploadAction.UPDATE,
        case_batch: {
          cases: casesForVerification,
        },
      }, { signal });
      return response.data;
    },
    enabled: mappedColumns.length > 0 && casesForVerification.length > 0,
    gcTime: Infinity,
    staleTime: Infinity,
  });

  const rowsWithGeneratedId = useMemo<CaseUploadResultWithGeneratedId[]>(() => {
    return (caseUploadValidationResultQuery?.data?.cases || []).map((vc, index) => ({
      ...vc,
      generatedId: vc.id || index.toString(),
    }));
  }, [caseUploadValidationResultQuery?.data?.cases]);

  const loadables = useArray([
    caseUploadValidationResultQuery,
  ]);

  const tableStore = useMemo(() => createTableStore<CaseUploadResultWithGeneratedId>({
    idSelectorCallback: (row) => row.generatedId,
  }), []);

  const selectedIdsRef = useRef<string[]>([]);

  // const selectedIds = useStore(tableStore, (state) => state.selectedIds);
  const setSelectedIds = useStore(tableStore, useShallow((state) => state.setSelectedIds));


  useEffect(() => {
    const unsubscribe = tableStore.subscribe((state, prevState) => {
      if (state.selectedIds === prevState.selectedIds) {
        return;
      }
      selectedIdsRef.current = state.selectedIds;
      const newExceedsMaxNumCases = state.selectedIds.length > completeCaseType.create_max_n_cases;
      setExceedsMaxNumCases(newExceedsMaxNumCases);
    });

    return () => {
      unsubscribe();
    };
  }, [completeCaseType.create_max_n_cases, tableStore]);

  useEffect(() => {
    const newSelectedIds = rowsWithGeneratedId.filter(validatedCase => {
      return !validatedCase.data_issues.some(issue => issue.data_issue_type === DataIssueType.INVALID || issue.data_issue_type === DataIssueType.UNAUTHORIZED);
    }).map(vc => vc.generatedId);
    setSelectedIds(newSelectedIds);
  }, [rowsWithGeneratedId, setSelectedIds]);

  const onProceedButtonClick = useCallback(async () => {
    const validatedCases = rowsWithGeneratedId.filter(r => selectedIdsRef.current.includes(r.generatedId)).map(r => omit(r, 'generatedId'));
    setValidatedCases(validatedCases);
    await goToNextStep();
  }, [goToNextStep, rowsWithGeneratedId, selectedIdsRef, setValidatedCases]);


  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'grid',
        gridTemplateRows: `${exceedsMaxNumCases ? 'max-content' : ''} max-content auto max-content`,
      }}
    >
      <TableStoreContextProvider store={tableStore}>
        <ResponseHandler
          inlineSpinner
          loadables={loadables}
          loadingMessage={t('Validating cases')}
          takingLongerTimeoutMs={10000}
        >
          {exceedsMaxNumCases && (
            <Box marginY={2}>
              <Alert severity={'error'}>
                <AlertTitle>
                  {t('You have exceeded the maximum number of {{maxCases}} cases for this case type. Please reduce the number of selected cases before proceeding.', {
                    maxCases: completeCaseType.create_max_n_cases,
                  })}
                </AlertTitle>
              </Alert>
            </Box>
          )}
          <EpiUploadCaseResultTable
            completeCaseType={completeCaseType}
            rowsWithGeneratedId={rowsWithGeneratedId}
            validatedCases={caseUploadValidationResultQuery?.data?.cases || []}
            rawData={rawData}
            mappedColumns={mappedColumns}
            tableStore={tableStore}
          />
          <EpiUploadValidateNavigation
            onGoBackButtonClick={goToPreviousStep}
            onProceedButtonClick={onProceedButtonClick}
          />
        </ResponseHandler>
      </TableStoreContextProvider>
    </Box>
  );
};

export const EpiUploadValidate = () => {
  const store = useContext(EpiUploadStoreContext);
  const completeCaseType = useStore(store, (state) => state.completeCaseType);

  const [isCompleteCaseTypeLoaded, setIsCompleteCaseTypeLoaded] = useState<boolean>(false);

  const onCompleteCaseTypeLoaded = useCallback(() => {
    setIsCompleteCaseTypeLoaded(true);
  }, []);

  return (
    <EpiCompletCaseTypeLoader
      caseTypeId={completeCaseType.id}
      onCompleteCaseTypeLoaded={onCompleteCaseTypeLoaded}
    >
      {isCompleteCaseTypeLoaded && (
        <EpiUploadValidateInner />
      )}
    </EpiCompletCaseTypeLoader>
  );
};
