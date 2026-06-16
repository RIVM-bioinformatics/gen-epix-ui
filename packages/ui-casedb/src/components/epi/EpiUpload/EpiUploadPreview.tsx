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
  CaseDbCaseUploadResult,
  CaseDbCol,
} from '@gen-epix/api-casedb';
import {
  CaseDbCaseApi,
  CaseDbDataIssueType,
  CaseDbEtlStatus,
  CaseDbUploadAction,
} from '@gen-epix/api-casedb';
import type {
  ConfirmationRefMethods,
  TableRowAndColumnParams,
} from '@gen-epix/ui';
import {
  BackdropSpinner,
  Confirmation,
  createTableStore,
  ObjectUtil,
  QueryClientManager,
  ResponseHandler,
  TableStoreContextProvider,
  useArray,
  useQueryMemo,
} from '@gen-epix/ui';

import { EpiUploadStoreContext } from '../../../stores/epiUploadStore';
import { withEpiCompleteCaseTypeLoader } from '../EpiCompletCaseTypeLoader/withEpiCompleteCaseTypeLoader';
import { CaseUtil } from '../../../utils/CaseUtil';

import { EpiUploadCaseResultTable } from './EpiUploadCaseResultTable';
import { EpiUploadPreviewNavigation } from './EpiUploadPreviewNavigation';

export type EpiUploadPreviewProps = {
  readonly caseTypeId: string;
};

export const EpiUploadPreview = withEpiCompleteCaseTypeLoader<EpiUploadPreviewProps>(({ caseTypeId }) => {
  const { t } = useTranslation();

  const store = use(EpiUploadStoreContext);
  const goToNextStep = useStore(store, (state) => state.goToNextStep);
  const goToPreviousStep = useStore(store, (state) => state.goToPreviousStep);
  const completeCaseType = useStore(store, (state) => state.completeCaseType);
  const casesForVerificationFromSourceData = useStore(store, (state) => state.casesForVerificationFromSourceData);
  const createdInDataCollectionId = useStore(store, (state) => state.createdInDataCollectionId);
  const validateCasesQueryKey = useStore(store, (state) => state.validateCasesQueryKey);
  const caseRightsColMap = useStore(store, (state) => state.caseRightsColMap);
  const [exceedsMaxNumCases, setExceedsMaxNumCases] = useState(false);
  const [isRevalidatingCases, setIsRevalidatingCases] = useState(false);
  const [revalidationError, setRevalidationError] = useState<Error | null>(null);
  const selectedIdsRef = useRef<string[]>([]);
  const continueWithoutFixingConfirmationRef = useRef<ConfirmationRefMethods>(null);
  const continueWithoutSelectingAllCasesRef = useRef<ConfirmationRefMethods>(null);

  const getOriginalCellValue = useCallback((col: CaseDbCol, params: TableRowAndColumnParams<CaseDbCaseUploadResult, null>, _issue: CaseDbCaseDataIssue): string => {
    return casesForVerificationFromSourceData[params.rowIndex]?.case?.content[col.id] ?? '';
  }, [casesForVerificationFromSourceData]);

  const caseUploadValidationResultQuery = useQueryMemo({
    enabled: casesForVerificationFromSourceData.length > 0,
    gcTime: Infinity,
    queryFn: async ({ signal }) => {
      const response = (await CaseDbCaseApi.getInstance().uploadCases(ObjectUtil.deepNullifyEmptyStrings({
        case_batch: {
          cases: casesForVerificationFromSourceData,
        },
        case_type_id: caseTypeId,
        created_in_data_collection_id: createdInDataCollectionId,
        on_exists: CaseDbUploadAction.UPDATE,
        verify_only: true,
      }), { signal })).data;
      return response;
    },
    queryKey: validateCasesQueryKey,
    select: (data) => data.cases.map((caseUploadResult, index) => ({
      ...caseUploadResult,
      id: casesForVerificationFromSourceData[index].id,
    })),
    staleTime: Infinity,
  });


  const loadables = useArray([
    caseUploadValidationResultQuery,
  ]);

  const tableStore = useMemo(() => createTableStore<CaseDbCaseUploadResult>({
    idSelectorCallback: (row) => row.id,
  }), []);
  const setSelectedIds = useStore(tableStore, useShallow((state) => state.setSelectedIds));

  const revalidateCases = useCallback(async (casesToValidate: Array<{ content: CaseDbCase['content']; row: CaseDbCaseUploadResult }>) => {
    setIsRevalidatingCases(true);
    try {
      const batchValidationResult = (await CaseDbCaseApi.getInstance().uploadCases(ObjectUtil.deepNullifyEmptyStrings({
        case_batch: {
          cases: casesToValidate.map(({ content, row }, index) => {
            const caseFromSourceData = casesForVerificationFromSourceData.find(c => c.id === row.id);
            return {
              case: {
                case_type_id: completeCaseType.id,
                content: Object.fromEntries(
                  Object.entries(content).map(([colId]) => {
                    const col = completeCaseType.cols[colId];
                    if (!col) {
                      return [colId, content[colId]];
                    }
                    const rowValue = CaseUtil.getRowValue(content, col, completeCaseType);
                    return [colId, rowValue.isMissing ? '' : rowValue.long];
                  }),
                ),
                created_in_data_collection_id: caseFromSourceData?.case?.created_in_data_collection_id ?? createdInDataCollectionId,
                id: row.id ?? casesForVerificationFromSourceData[index].id,
              },
            };
          }),
        },
        case_type_id: caseTypeId,
        created_in_data_collection_id: createdInDataCollectionId,
        on_exists: CaseDbUploadAction.UPDATE,
        verify_only: true,
      }))).data;

      const resultById = new Map(
        casesToValidate.map(({ row }, index) => [row.id, batchValidationResult.cases[index]]),
      );

      QueryClientManager.getInstance().queryClient.setQueryData(validateCasesQueryKey, {
        cases: caseUploadValidationResultQuery.data.map(row => {
          const newResult = resultById.get(row.id);
          if (newResult) {
            return { ...newResult, id: row.id };
          }
          return row;
        }),
      });

      const newlyFailedIds: string[] = [];
      casesToValidate.forEach(({ row }, index) => {
        const newResult = batchValidationResult.cases[index];
        if (newResult.status !== CaseDbEtlStatus.SKIPPED && newResult.status !== CaseDbEtlStatus.SUCCESS && newResult.status !== CaseDbEtlStatus.UPDATED) {
          if (!selectedIdsRef.current.includes(row.id)) {
            selectedIdsRef.current.push(row.id);
            newlyFailedIds.push(row.id);
          }
        }
      });

      if (newlyFailedIds.length > 0) {
        const currentSelectedIds = tableStore.getState().selectedIds;
        const idsToAdd = newlyFailedIds.filter(id => !currentSelectedIds.includes(id));
        if (idsToAdd.length > 0) {
          setSelectedIds([...currentSelectedIds, ...idsToAdd]);
        }
      }
    } catch (error) {
      setRevalidationError(error as Error);
    } finally {
      setIsRevalidatingCases(false);
    }

  }, [caseTypeId, caseUploadValidationResultQuery.data, casesForVerificationFromSourceData, completeCaseType, createdInDataCollectionId, setSelectedIds, tableStore, validateCasesQueryKey]);

  const onColContentEditSubmit = useCallback(async (contentPerCaseId: { [caseId: string]: CaseDbCase['content'] }) => {
    const selectedIds = tableStore.getState().selectedIds;
    await revalidateCases(
      caseUploadValidationResultQuery.data
        .filter(row => selectedIds.includes(row.id))
        .map(row => ({
          content: { ...row.validated_content, ...contentPerCaseId[row.id] },
          row,
        })),
    );
  }, [caseUploadValidationResultQuery.data, revalidateCases, tableStore]);

  const onCaseContentEditSubmit = useCallback(async (caseId: string, content: CaseDbCase['content']) => {
    const originalCaseUploadResult = caseUploadValidationResultQuery.data.find(r => r.id === caseId);
    await revalidateCases([{ content, row: originalCaseUploadResult }]);
  }, [caseUploadValidationResultQuery.data, revalidateCases]);

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
    }).map(vc => vc.id);
    setSelectedIds(newSelectedIds);
  }, [caseUploadValidationResultQuery.data, setSelectedIds]);


  const onProceedWithoutFixingIssues = useCallback(async () => {
    const selectedIds = tableStore.getState().selectedIds;
    const validCases = caseUploadValidationResultQuery.data.filter(row => selectedIds.includes(row.id) && !row.data_issues.some(issue => issue.data_issue_type === CaseDbDataIssueType.INVALID));
    store.setState((state) => ({
      ...state,
      selectedIdsForUpload: validCases.map(c => c.id),
      validatedCases: caseUploadValidationResultQuery.data,
    }));
    await goToNextStep();
  }, [caseUploadValidationResultQuery.data, goToNextStep, store, tableStore]);

  const onProceed = useCallback(async () => {
    store.setState((state) => ({
      ...state,
      selectedIdsForUpload: selectedIdsRef.current,
      validatedCases: caseUploadValidationResultQuery.data,
    }));

    await goToNextStep();
  }, [goToNextStep, caseUploadValidationResultQuery.data, store]);

  const onProceedButtonClick = useCallback(async () => {
    if (caseUploadValidationResultQuery.data.some(row => tableStore.getState().selectedIds.includes(row.id) && (row.data_issues.some(issue => issue.data_issue_type === CaseDbDataIssueType.INVALID) || row.status === CaseDbEtlStatus.FAILED))) {
      continueWithoutFixingConfirmationRef.current?.open();
      return;
    }

    if (caseUploadValidationResultQuery.data.some(row => !tableStore.getState().selectedIds.includes(row.id) && !row.data_issues.some(issue => issue.data_issue_type === CaseDbDataIssueType.INVALID))) {
      continueWithoutSelectingAllCasesRef.current?.open();
      return;
    }

    await onProceed();
  }, [caseUploadValidationResultQuery.data, onProceed, tableStore]);

  const onGoBackButtonClick = useCallback(() => {
    goToPreviousStep();
  }, [goToPreviousStep]);

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
          error={revalidationError}
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
            caseRightsColMap={caseRightsColMap}
            caseUploadResults={caseUploadValidationResultQuery.data || []}
            completeCaseType={completeCaseType}
            getOriginalCellValue={getOriginalCellValue}
            onCaseContentEditSubmit={onCaseContentEditSubmit}
            onColContentEditSubmit={onColContentEditSubmit}
            tableStore={tableStore}
          />
          <EpiUploadPreviewNavigation
            onGoBackButtonClick={onGoBackButtonClick}
            onProceedButtonClick={onProceedButtonClick}
          />
        </ResponseHandler>
      </TableStoreContextProvider>
      <BackdropSpinner
        label={t('Revalidating cases')}
        open={isRevalidatingCases}
      />
      <Confirmation
        body={t`Some of the selected cases contain issues. If you proceed, these cases will be excluded. Are you sure you want to proceed without them?`}
        cancelLabel={t`Cancel`}
        confirmLabel={t`Proceed`}
        onConfirm={onProceedWithoutFixingIssues}
        ref={continueWithoutFixingConfirmationRef}
        title={t`Issues found with selected cases`}
      />
      <Confirmation
        body={t`Not all cases are selected. Do you want to proceed without them?`}
        cancelLabel={t`Cancel`}
        confirmLabel={t`Proceed`}
        onConfirm={onProceed}
        ref={continueWithoutSelectingAllCasesRef}
        title={t`Not all cases are selected.`}
      />
    </Box>
  );
});
