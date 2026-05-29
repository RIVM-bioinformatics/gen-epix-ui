import {
  use,
  useCallback,
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
import type {
  CaseDbCaseDataIssue,
  CaseDbCol,
} from '@gen-epix/api-casedb';
import {
  CaseDbCaseApi,
  CaseDbDataIssueType,
  CaseDbUploadAction,
} from '@gen-epix/api-casedb';
import type { TableRowAndColumnParams } from '@gen-epix/ui';
import {
  createTableStore,
  ResponseHandler,
  TableStoreContextProvider,
  useArray,
  useQueryMemo,
} from '@gen-epix/ui';

import { EpiUploadStoreContext } from '../../../stores/epiUploadStore';
import type { CaseUploadResultWithGeneratedId } from '../../../models/epi';
import { withEpiCompleteCaseTypeLoader } from '../EpiCompletCaseTypeLoader/withEpiCompleteCaseTypeLoader';

import { EpiUploadCaseResultTable } from './EpiUploadCaseResultTable';
import { EpiUploadValidateNavigation } from './EpiUploadValidateNavigation';

export type EpiUploadPreviewProps = {
  readonly caseTypeId: string;
};

export const EpiUploadPreview = withEpiCompleteCaseTypeLoader<EpiUploadPreviewProps>(({ caseTypeId }) => {
  const { t } = useTranslation();

  const store = use(EpiUploadStoreContext);
  const goToNextStep = useStore(store, (state) => state.goToNextStep);
  const goToPreviousStep = useStore(store, (state) => state.goToPreviousStep);
  const mappedColumns = useStore(store, (state) => state.mappedColumns);
  const completeCaseType = useStore(store, (state) => state.completeCaseType);
  const casesForVerification = useStore(store, (state) => state.casesForVerification);
  const casesForVerificationFromSourceData = useStore(store, (state) => state.casesForVerificationFromSourceData);
  const setValidatedCases = useStore(store, (state) => state.setValidatedCases);
  const createdInDataCollectionId = useStore(store, (state) => state.createdInDataCollectionId);
  const rawData = useStore(store, (state) => state.rawData);
  const validateCasesQueryKey = useStore(store, (state) => state.validateCasesQueryKey);
  const [exceedsMaxNumCases, setExceedsMaxNumCases] = useState(false);

  const caseUploadValidationResultQuery = useQueryMemo({
    enabled: mappedColumns.length > 0 && casesForVerification.length > 0,
    gcTime: Infinity,
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().uploadCases({
        case_batch: {
          cases: casesForVerification,
        },
        case_type_id: caseTypeId,
        created_in_data_collection_id: createdInDataCollectionId,
        on_exists: CaseDbUploadAction.UPDATE,
        verify_only: true,
      }, { signal });
      return response.data;
    },
    queryKey: validateCasesQueryKey,
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
      const newExceedsMaxNumCases = state.selectedIds.length > completeCaseType.props.create_max_n_cases;
      setExceedsMaxNumCases(newExceedsMaxNumCases);
    });

    return () => {
      unsubscribe();
    };
  }, [completeCaseType.props.create_max_n_cases, tableStore]);

  useEffect(() => {
    const newSelectedIds = rowsWithGeneratedId.filter(validatedCase => {
      return !validatedCase.data_issues.some(issue => issue.data_issue_type === CaseDbDataIssueType.INVALID || issue.data_issue_type === CaseDbDataIssueType.UNAUTHORIZED);
    }).map(vc => vc.generatedId);
    setSelectedIds(newSelectedIds);
  }, [rowsWithGeneratedId, setSelectedIds]);

  const onProceedButtonClick = useCallback(async () => {
    const validatedCases = rowsWithGeneratedId.filter(r => selectedIdsRef.current.includes(r.generatedId)).map(r => omit(r, 'generatedId'));
    setValidatedCases(validatedCases);
    await goToNextStep();
  }, [goToNextStep, rowsWithGeneratedId, selectedIdsRef, setValidatedCases]);

  const onGoBackButtonClick = useCallback(() => {
    goToPreviousStep();
  }, [goToPreviousStep]);

  const getOriginalCellValue = useCallback((col: CaseDbCol, params: TableRowAndColumnParams<CaseUploadResultWithGeneratedId, null>, _issue: CaseDbCaseDataIssue): string => {
    const originalValue = rawData.slice(1)[params.rowIndex][mappedColumns.find(mc => mc.col?.id === col.id)?.originalIndex || -1];
    return originalValue;
  }, [mappedColumns, rawData]);

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateRows: `${exceedsMaxNumCases ? 'max-content' : ''} max-content auto max-content`,
        height: '100%',
        position: 'relative',
        width: '100%',
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
            <Box
              sx={{
                marginY: 2,
              }}
            >
              <Alert severity={'error'}>
                <AlertTitle>
                  {t('You have exceeded the maximum number of {{maxCases}} cases for this case type. Please reduce the number of selected cases before proceeding.', {
                    maxCases: completeCaseType.props.create_max_n_cases,
                  })}
                </AlertTitle>
              </Alert>
            </Box>
          )}
          <EpiUploadCaseResultTable
            completeCaseType={completeCaseType}
            getOriginalCellValue={getOriginalCellValue}
            tableStore={tableStore}
            validatedCases={caseUploadValidationResultQuery?.data?.cases || []}
          />
          <EpiUploadValidateNavigation
            onGoBackButtonClick={onGoBackButtonClick}
            onProceedButtonClick={onProceedButtonClick}
          />
        </ResponseHandler>
      </TableStoreContextProvider>
    </Box>
  );
});
