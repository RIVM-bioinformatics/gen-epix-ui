import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useStore } from 'zustand';
import {
  Tooltip,
  Box,
  useTheme,
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import AddIcon from '@mui/icons-material/Add';
import omit from 'lodash/omit';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/shallow';

import { EpiUploadStoreContext } from '../../../stores/epiUploadStore';
import { EpiCompletCaseTypeLoader } from '../EpiCompletCaseTypeLoader';
import type {
  CaseForUpload,
  CaseDataIssue,
} from '../../../api';
import {
  CaseApi,
  OnExistsUploadAction,
  DataIssueType,
} from '../../../api';
import { useArray } from '../../../hooks/useArray';
import { useInitializeTableStore } from '../../../hooks/useInitializeTableStore';
import { useQueryMemo } from '../../../hooks/useQueryMemo';
import type { CaseUploadResultWithGeneratedId } from '../../../models/epi';
import type {
  TableRowParams,
  TableColumn,
} from '../../../models/table';
import {
  createTableStore,
  TableStoreContextProvider,
} from '../../../stores/tableStore';
import { EpiCaseUtil } from '../../../utils/EpiCaseUtil';
import { TableUtil } from '../../../utils/TableUtil';
import { ResponseHandler } from '../../ui/ResponseHandler';
import {
  Table,
  TableMenu,
} from '../../ui/Table';
import { EpiUploadUtil } from '../../../utils/EpiUploadUtil';

import { EpiUploadNavigation } from './EpiUploadNavigation';

export const EpiUploadValidateInner = () => {
  const theme = useTheme();
  const [t] = useTranslation();

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
      generated_id: vc.id || index.toString(),
    }));
  }, [caseUploadValidationResultQuery?.data?.cases]);

  const loadables = useArray([
    caseUploadValidationResultQuery,
  ]);

  const tableStore = useMemo(() => createTableStore<CaseUploadResultWithGeneratedId>({
    idSelectorCallback: (row) => row.generated_id,
  }), []);

  const setSelectedIds = useStore(tableStore, useShallow((state) => state.setSelectedIds));
  const selectedIds = useStore(tableStore, (state) => state.selectedIds);

  useEffect(() => {
    const newSelectedIds = rowsWithGeneratedId.filter(validatedCase => {
      return !validatedCase.data_issues.some(issue => issue.data_issue_type === DataIssueType.INVALID || issue.data_issue_type === DataIssueType.UNAUTHORIZED);
    }).map(vc => vc.generated_id);
    setSelectedIds(newSelectedIds);
  }, [rowsWithGeneratedId, setSelectedIds]);

  const dataRulePriority: DataIssueType[] = useMemo(() => [
    DataIssueType.UNAUTHORIZED,
    DataIssueType.INVALID,
    DataIssueType.CONFLICT,
    DataIssueType.MISSING,
    DataIssueType.DERIVED,
    DataIssueType.TRANSFORMED,
  ], []);

  const errorIssueTypes: DataIssueType[] = useMemo(() => [
    DataIssueType.UNAUTHORIZED,
    DataIssueType.INVALID,
  ], []);

  const warningIssueTypes: DataIssueType[] = useMemo(() => [
    DataIssueType.MISSING,
    DataIssueType.CONFLICT,
  ], []);

  const getIssueTooltipContent = useCallback((issues: CaseDataIssue[]) => {
    const messages: { message: string; key: string }[] = [];
    issues.forEach((issue) => {
      const issueMessage = issue.message.replace(issue.original_value, '"{{originalValue}}"');
      const translatedMessage = t(issueMessage, { originalValue: issue.original_value });
      const columnLabel = completeCaseType.case_type_cols[issue.case_type_col_id].label;
      const message = t('{{columnLabel}}: {{issue}}', { columnLabel, issue: translatedMessage });
      messages.push({ message, key: `${issue.case_type_col_id}-${issue.data_issue_type}-${issue.code}` });
    });
    return (
      <>
        {messages.map(({ message, key }, index) => (
          <Box
            key={key}
            sx={{ marginTop: index > 0 ? 1 : 0 }}
          >
            {message}
          </Box>
        ))}
      </>
    );
  }, [completeCaseType.case_type_cols, t]);

  const getFilteredIssueTypes = useCallback((id: string, issues: CaseDataIssue[], value: string) => {
    return issues.filter((issue) => {
      if (issue.case_type_col_id !== id) {
        return false;
      }
      if (issue.data_issue_type === DataIssueType.TRANSFORMED && issue.original_value === value) {
        return false;
      }
      return true;
    }).sort((a, b) => dataRulePriority.indexOf(a.data_issue_type) - dataRulePriority.indexOf(b.data_issue_type));
  }, [dataRulePriority]);

  const renderHasIssueHeader = useCallback(() => {
    return (
      <Tooltip
        arrow
        title={t('Indicates if there are any issues with the case')}
      >
        <ErrorOutlineIcon
          fontSize={'small'}
        />
      </Tooltip>
    );
  }, [t]);

  const renderHasIssueCell = useCallback(({ row }: TableRowParams<CaseUploadResultWithGeneratedId>) => {
    const errorIssues = row.data_issues.filter(i => i.data_issue_type === DataIssueType.INVALID || i.data_issue_type === DataIssueType.UNAUTHORIZED);
    if (errorIssues.length > 0) {
      return (
        <Tooltip
          arrow
          title={getIssueTooltipContent(errorIssues)}
        >
          <ErrorOutlineIcon
            fontSize={'small'}
            sx={{
              color: theme.palette.error.main,
              marginTop: '5px',
            }}
          />
        </Tooltip>
      );
    }
  }, [getIssueTooltipContent, theme.palette.error.main]);

  const renderIsNewHeader = useCallback(() => {
    return (
      <Tooltip
        arrow
        title={t('Indicates if case is new (will be created)')}
      >
        <AddIcon
          fontSize={'small'}
        />
      </Tooltip>
    );
  }, [t]);

  const renderIsNewCell = useCallback(({ row }: TableRowParams<CaseUploadResultWithGeneratedId>) => {
    return row.id ? null : (
      <AddIcon
        fontSize={'small'}
        sx={{
          position: 'absolute',
          marginTop: '5px',
        }}
      />
    );
  }, []);

  const renderCell = useCallback(({ id, row }: TableRowParams<CaseUploadResultWithGeneratedId>) => {
    const rowValue = EpiCaseUtil.getRowValue(row.validated_content, completeCaseType.case_type_cols[id], completeCaseType);
    const value = rowValue.long;
    const issues = getFilteredIssueTypes(id, row.data_issues, value);

    if (issues.length === 0) {
      return (
        <>
          {value}
        </>
      );
    }

    let iconColor: string = theme.palette.info.main;
    if (errorIssueTypes.includes(issues[0].data_issue_type)) {
      iconColor = theme.palette.error.main;
    } else if (warningIssueTypes.includes(issues[0].data_issue_type)) {
      iconColor = theme.palette.warning.main;
    }

    const originalValue = issues.find(x => x.original_value)?.original_value || '';
    const shouldShowOriginalValue = originalValue && value && originalValue !== value;

    const content = (
      <>
        {shouldShowOriginalValue && (
          <>
            <s>
              {originalValue}
            </s>
            {'\u00A0'}
          </>
        )}
        {value && (
          <>
            {value}
          </>
        )}
      </>
    );


    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Box
          sx={{
            width: theme.spacing(2),
            height: theme.spacing(2),
            minWidth: theme.spacing(2),
            minHeight: theme.spacing(2),
            marginRight: theme.spacing(1),
            position: 'relative',
          }}
        >
          <Tooltip
            arrow
            title={getIssueTooltipContent(issues)}
          >
            <ErrorOutlineIcon
              fontSize={'small'}
              sx={{
                color: iconColor,
                position: 'absolute',
                marginTop: '-2px',
              }}
            />
          </Tooltip>
        </Box>
        <Box
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {content}
        </Box>
      </Box>
    );
  }, [completeCaseType, errorIssueTypes, getFilteredIssueTypes, getIssueTooltipContent, theme, warningIssueTypes]);

  const tableColumns = useMemo<TableColumn<CaseUploadResultWithGeneratedId>[]>(() => {
    const validatedCases = caseUploadValidationResultQuery?.data?.cases;

    const tableCols: TableColumn<CaseUploadResultWithGeneratedId>[] = [];
    if (!validatedCases?.length) {
      return tableCols;
    }
    tableCols.push(TableUtil.createReadableIndexColumn());
    tableCols.push(TableUtil.createSelectableColumn());
    tableCols.push({
      id: 'gen-epix-ui-issue',
      type: 'text',
      isInitiallyVisible: true,
      isStatic: true,
      frozen: true,
      resizable: false,
      disableEllipsis: true,
      widthPx: 38,
      valueGetter: () => '',
      renderCell: renderHasIssueCell,
      renderHeader: renderHasIssueHeader,
      hideInFilter: true,
      headerName: '',
    });
    tableCols.push({
      id: 'gen-epix-ui-id',
      type: 'text',
      isInitiallyVisible: true,
      isStatic: true,
      frozen: true,
      resizable: false,
      disableEllipsis: true,
      widthPx: 38,
      valueGetter: () => '',
      renderCell: renderIsNewCell,
      renderHeader: renderIsNewHeader,
      hideInFilter: true,
      headerName: '',
    });

    const uniqueCaseTypeColIds: Set<string> = new Set();
    validatedCases.forEach((validatedCase) => {
      Object.keys(validatedCase.validated_content || {}).forEach((colId) => uniqueCaseTypeColIds.add(colId));
      validatedCase.data_issues.forEach((issue) => uniqueCaseTypeColIds.add(issue.case_type_col_id));
    });

    completeCaseType.ordered_case_type_col_ids.forEach((caseTypeColId) => {
      if (!uniqueCaseTypeColIds.has(caseTypeColId)) {
        return;
      }
      const caseTypeCol = completeCaseType.case_type_cols[caseTypeColId];

      const issuesForCaseTypeColumn = validatedCases.flatMap(vc => vc.data_issues.filter((i) => i.case_type_col_id === caseTypeCol.id));
      const isInitiallyVisible = issuesForCaseTypeColumn.length === 0 || issuesForCaseTypeColumn.some(i => i.data_issue_type !== DataIssueType.DERIVED);

      if (caseTypeCol) {
        tableCols.push({
          type: 'text',
          isInitiallyVisible,
          hideInFilter: true,
          id: caseTypeCol.id,
          headerName: caseTypeCol.code,
          widthPx: 250,
          renderCell,
          cellTitleGetter: (params) => {
            const issue = params.row.data_issues.find((i) => i.case_type_col_id === caseTypeCol.id);
            if (!issue) {
              const originalValue = rawData.slice(1)[params.rowIndex][mappedColumns.find(mc => mc.caseTypeCol?.id === caseTypeCol.id)?.originalIndex || -1];
              return t('{{value}} (original value: "{{originalValue}}")', {
                value: EpiCaseUtil.getRowValue(params.row.validated_content, caseTypeCol, completeCaseType).short,
                originalValue,
              });
            }
            return '';
          },
          valueGetter: (params) => EpiCaseUtil.getRowValue(params.row.validated_content, caseTypeCol, completeCaseType).short,
        } satisfies TableColumn<CaseUploadResultWithGeneratedId>);
      }
    });

    if (validatedCases.some(vc => vc.id)) {
      tableCols.push({
        type: 'text',
        isInitiallyVisible: true,
        hideInFilter: true,
        id: 'case_id',
        headerName: t('case_id'),
        valueGetter: (params) => params.row.id || '',
        widthPx: 250,
      } satisfies TableColumn<CaseUploadResultWithGeneratedId>);
    }

    return tableCols;
  }, [caseUploadValidationResultQuery?.data?.cases, renderHasIssueCell, renderHasIssueHeader, renderIsNewCell, renderIsNewHeader, completeCaseType, renderCell, rawData, mappedColumns, t]);

  useInitializeTableStore<CaseUploadResultWithGeneratedId>({ store: tableStore, columns: tableColumns, rows: rowsWithGeneratedId, createFiltersFromColumns: true });

  const onProceedButtonClick = useCallback(async () => {
    const validatedCases = rowsWithGeneratedId.filter(r => selectedIds.includes(r.generated_id)).map(r => omit(r, 'generated_id'));
    setValidatedCases(validatedCases);
    await goToNextStep();
  }, [goToNextStep, rowsWithGeneratedId, selectedIds, setValidatedCases]);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'grid',
        gridTemplateRows: 'max-content auto max-content',
      }}
    >
      <ResponseHandler
        inlineSpinner
        loadables={loadables}
        loadingMessage={t('Validating cases')}
        takingLongerTimeoutMs={10000}
      >
        <TableStoreContextProvider store={tableStore}>
          <Box>
            <TableMenu
              ContainerProps={{
                sx: {
                  display: 'inline-block',
                  float: 'right',
                },
              }}
            />
          </Box>
          <Table
            font={theme['gen-epix'].lineList.font}
          />
          <EpiUploadNavigation
            proceedLabel={t('Continue')}
            proceedDisabled={selectedIds.length === 0}
            onGoBackButtonClick={goToPreviousStep}
            onProceedButtonClick={onProceedButtonClick}
          />
        </TableStoreContextProvider>
      </ResponseHandler>
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
