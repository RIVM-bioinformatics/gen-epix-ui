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
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/shallow';
import type {
  CaseDbCase,
  CaseDbCaseDataIssue,
  CaseDbCol,
} from '@gen-epix/api-casedb';
import {
  CaseDbCaseApi,
  CaseDbDataIssueType,
  CaseDbEtlStatus,
  CaseDbUploadAction,
} from '@gen-epix/api-casedb';
import type { TableRowAndColumnParams } from '@gen-epix/ui';
import {
  createTableStore,
  ObjectUtil,
  QueryClientManager,
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
  const casesForVerification = useStore(store, (state) => state.casesForUpload);
  const createdInDataCollectionId = useStore(store, (state) => state.createdInDataCollectionId);
  const rawData = useStore(store, (state) => state.rawData);
  const validateCasesQueryKey = useStore(store, (state) => state.validateCasesQueryKey);
  const [exceedsMaxNumCases, setExceedsMaxNumCases] = useState(false);
  const selectedIdsRef = useRef<string[]>([]);

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
    select: (data) => data.cases.map((vc, index) => ({
      ...vc,
      generatedId: vc.id || index.toString(),
    })),
    staleTime: Infinity,
  });


  const loadables = useArray([
    caseUploadValidationResultQuery,
  ]);

  const tableStore = useMemo(() => createTableStore<CaseUploadResultWithGeneratedId>({
    idSelectorCallback: (row) => row.generatedId,
  }), []);
  const setSelectedIds = useStore(tableStore, useShallow((state) => state.setSelectedIds));

  const onCaseContentEditSubmit = useCallback(async (caseId: string, content: CaseDbCase['content']) => {
    const originalCaseUploadResult = caseUploadValidationResultQuery.data.find(r => r.generatedId === caseId);
    const singleCaseValidationResult = (await CaseDbCaseApi.getInstance().uploadCases(ObjectUtil.deepRemoveEmptyStrings({
      case_batch: {
        cases: [
          {
            case: {
              case_type_id: completeCaseType.id,
              content,
              created_in_data_collection_id: createdInDataCollectionId,
              id: originalCaseUploadResult.id,
            },
          },
        ],
      },
      case_type_id: caseTypeId,
      created_in_data_collection_id: createdInDataCollectionId,
      on_exists: CaseDbUploadAction.UPDATE,
      verify_only: true,
    }))).data;

    QueryClientManager.getInstance().queryClient.setQueryData(validateCasesQueryKey, {
      cases: caseUploadValidationResultQuery.data.map(row => {
        if (row.generatedId === caseId) {
          return {
            ...singleCaseValidationResult.cases[0],
            generatedId: row.generatedId,
          };
        }
        return row;
      }),
    });

    if (singleCaseValidationResult.status !== CaseDbEtlStatus.SKIPPED && singleCaseValidationResult.status !== CaseDbEtlStatus.SUCCESS && singleCaseValidationResult.status !== CaseDbEtlStatus.UPDATED) {
      if (!selectedIdsRef.current.includes(originalCaseUploadResult.generatedId)) {
        selectedIdsRef.current.push(originalCaseUploadResult.generatedId);
      }
      if (!tableStore.getState().selectedIds.includes(originalCaseUploadResult.generatedId)) {
        setSelectedIds([...tableStore.getState().selectedIds, originalCaseUploadResult.generatedId]);
      }
    }
  }, [caseTypeId, caseUploadValidationResultQuery.data, completeCaseType.id, createdInDataCollectionId, setSelectedIds, tableStore, validateCasesQueryKey]);

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
    const newSelectedIds = (caseUploadValidationResultQuery.data ?? []).filter(validatedCase => {
      return !validatedCase.data_issues.some(issue => issue.data_issue_type === CaseDbDataIssueType.INVALID || issue.data_issue_type === CaseDbDataIssueType.UNAUTHORIZED);
    }).map(vc => vc.generatedId);
    setSelectedIds(newSelectedIds);
  }, [caseUploadValidationResultQuery.data, setSelectedIds]);

  const onProceedButtonClick = useCallback(async () => {
    store.setState((state) => ({
      ...state,
      selectedGeneratedIdsForUpload: selectedIdsRef.current,
      validatedCasesWithGeneratedId: caseUploadValidationResultQuery.data,
    }));

    await goToNextStep();
  }, [goToNextStep, caseUploadValidationResultQuery.data, store]);

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
            caseUploadResults={caseUploadValidationResultQuery.data || []}
            completeCaseType={completeCaseType}
            getOriginalCellValue={getOriginalCellValue}
            onCaseContentEditSubmit={onCaseContentEditSubmit}
            tableStore={tableStore}
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
