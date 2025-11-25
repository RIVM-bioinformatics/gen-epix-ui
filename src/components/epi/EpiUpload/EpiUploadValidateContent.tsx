import {
  Box,
  Tooltip,
  useTheme,
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import type { ReactElement } from 'react';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { format } from 'date-fns';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import omit from 'lodash/omit';
import { useTranslation } from 'react-i18next';
import difference from 'lodash/difference';

import type {
  Case,
  CaseDataIssue,
  CaseForCreateUpdate,
} from '../../../api';
import {
  CaseApi,
  CaseColDataRule,
} from '../../../api';
import { useQueryMemo } from '../../../hooks/useQueryMemo';
import { useArray } from '../../../hooks/useArray';
import { ResponseHandler } from '../../ui/ResponseHandler';
import {
  createTableStore,
  TableStoreContextProvider,
} from '../../../stores/tableStore';
import type {
  TableColumn,
  TableRowParams,
} from '../../../models/table';
import { useInitializeTableStore } from '../../../hooks/useInitializeTableStore';
import {
  Table,
  TableMenu,
} from '../../ui/Table';
import { DATE_FORMAT } from '../../../data/date';
import { TableUtil } from '../../../utils/TableUtil';
import { EpiCaseUtil } from '../../../utils/EpiCaseUtil';
import type { EpiValidatedCaseWithGeneratedId } from '../../../models/epiUpload';
import { EPI_UPLOAD_ACTION } from '../../../models/epiUpload';
import { EpiUploadStoreContext } from '../../../stores/epiUploadStore';

import { EpiUploadNavigation } from './EpiUploadNavigation';

export const EpiUploadValidateContent = () => {
  const theme = useTheme();
  const [t] = useTranslation();

  const store = useContext(EpiUploadStoreContext);
  const goToNextStep = useStore(store, (state) => state.goToNextStep);
  const goToPreviousStep = useStore(store, (state) => state.goToPreviousStep);
  const mappedColumns = useStore(store, (state) => state.mappedColumns);
  const completeCaseType = useStore(store, (state) => state.completeCaseType);
  const importAction = useStore(store, (state) => state.importAction);
  const setValidatedCases = useStore(store, (state) => state.setValidatedCases);
  const caseTypeId = useStore(store, (state) => state.caseTypeId);
  const createdInDataCollectionId = useStore(store, (state) => state.createdInDataCollectionId);
  const shareInDataCollectionIds = useStore(store, (state) => state.shareInDataCollectionIds);
  const rawData = useStore(store, (state) => state.rawData);
  const validateCasesQueryKey = useStore(store, (state) => state.validateCasesQueryKey);

  const inputCases = useMemo<CaseForCreateUpdate[]>(() => {
    return rawData.slice(1).map((row) => {
      const caseIdColumn = mappedColumns.find((mappedColumn) => mappedColumn.isCaseIdColumn)?.originalIndex;
      const caseDateColumn = mappedColumns.find((mappedColumn) => mappedColumn.isCaseDateColumn)?.originalIndex;

      const caseForCreateUpdate: CaseForCreateUpdate = {
        id: importAction === EPI_UPLOAD_ACTION.UPDATE && caseIdColumn !== undefined ? row[caseIdColumn] : undefined,
        case_date: caseDateColumn !== undefined ? row[caseDateColumn] : undefined,
        content: undefined,
      };
      const content: { [key: string]: string } = {};
      mappedColumns.forEach((mappedColumn) => {
        if (mappedColumn.caseTypeCol) {
          content[mappedColumn.caseTypeCol.id] = row[mappedColumn.originalIndex];
        }
      });
      return { ...caseForCreateUpdate, content };
    });
  }, [importAction, mappedColumns, rawData]);

  const validationQuery = useQueryMemo({
    queryKey: validateCasesQueryKey,
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.validateCases({
        case_type_id: caseTypeId,
        created_in_data_collection_id: createdInDataCollectionId,
        data_collection_ids: shareInDataCollectionIds,
        is_update: importAction === EPI_UPLOAD_ACTION.UPDATE,
        cases: inputCases,
      }, { signal });
      return response.data;
    },
    enabled: mappedColumns.length > 0 && inputCases.length > 0,
    gcTime: Infinity,
    staleTime: Infinity,
  });

  const rowsWithGeneratedId = useMemo<EpiValidatedCaseWithGeneratedId[]>(() => {
    return (validationQuery?.data?.validated_cases || []).map((vc, index) => ({
      ...vc,
      generated_id: vc.case.id || index.toString(),
    }));
  }, [validationQuery?.data?.validated_cases]);

  const loadables = useArray([
    validationQuery,
  ]);

  const tableStore = useMemo(() => createTableStore<EpiValidatedCaseWithGeneratedId>({
    idSelectorCallback: (row) => row.generated_id,
  }), []);

  const setSelectedIds = useStore(tableStore, useShallow((state) => state.setSelectedIds));
  const selectedIds = useStore(tableStore, (state) => state.selectedIds);

  useEffect(() => {
    const newSelectedIds = rowsWithGeneratedId.filter(validatedCase => {
      return !validatedCase.data_issues.some(issue => issue.data_rule === CaseColDataRule.INVALID || issue.data_rule === CaseColDataRule.UNAUTHORIZED);
    }).map(vc => vc.generated_id);
    setSelectedIds(newSelectedIds);
  }, [rowsWithGeneratedId, setSelectedIds]);

  const getIssueTooltipContent = useCallback((issues: CaseDataIssue[]) => {
    const messages: { message: string; key: string }[] = [];
    issues.forEach((issue) => {
      const issueMessage = issue.details.replace(issue.original_value, '"{{originalValue}}"');
      const translatedMessage = t(issueMessage, { originalValue: issue.original_value });
      const columnLabel = completeCaseType.case_type_cols[issue.case_type_col_id].label;
      const message = t('{{columnLabel}}: {{issue}}', { columnLabel, issue: translatedMessage });
      messages.push({ message, key: `${issue.case_type_col_id}-${issue.data_rule}` });
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

  const renderHasIssueCell = useCallback(({ row }: TableRowParams<EpiValidatedCaseWithGeneratedId>) => {
    const errorIssues = row.data_issues.filter(i => i.data_rule === CaseColDataRule.INVALID || i.data_rule === CaseColDataRule.UNAUTHORIZED);
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
              position: 'absolute',
              marginTop: '5px',
            }}
          />
        </Tooltip>
      );
    }
  }, [getIssueTooltipContent, theme.palette.error.main]);

  const dataRulePriority: CaseColDataRule[] = useMemo(() => [
    CaseColDataRule.UNAUTHORIZED,
    CaseColDataRule.INVALID,
    CaseColDataRule.CONFLICT,
    CaseColDataRule.MISSING,
    CaseColDataRule.DERIVED,
  ], []);

  const errorDataRules: CaseColDataRule[] = useMemo(() => [
    CaseColDataRule.UNAUTHORIZED,
    CaseColDataRule.INVALID,
  ], []);

  const renderCell = useCallback(({ id, row }: TableRowParams<EpiValidatedCaseWithGeneratedId>) => {
    const rowValue = EpiCaseUtil.getRowValue(row.case as Case, completeCaseType.case_type_cols[id], completeCaseType);
    const issues = row.data_issues.filter((i) => i.case_type_col_id === id).sort((a, b) => dataRulePriority.indexOf(a.data_rule) - dataRulePriority.indexOf(b.data_rule));

    if (issues.length === 0) {
      return (
        <>
          {rowValue.short}
        </>
      );
    }

    let color: string;

    switch (issues[0].data_rule) {
      case CaseColDataRule.MISSING:
      case CaseColDataRule.CONFLICT:
        color = theme.palette.warning.main;
        break;
      case CaseColDataRule.DERIVED:
        color = theme.palette.info.main;
        break;
      case CaseColDataRule.UNAUTHORIZED:
      case CaseColDataRule.INVALID:
      default:
        color = theme.palette.error.main;
        break;
    }

    let content: ReactElement;

    const hasError = difference(errorDataRules, issues.map(x => x.data_rule)).length >= 1;
    const originalValue = issues.find(x => x.original_value)?.original_value || '';

    if (hasError) {
      content = (
        <>
          {originalValue && (
            <s>
              {originalValue}
            </s>
          )}
          {originalValue && rowValue?.short && (
            <>
              {'\u00A0'}
            </>
          )}
          {rowValue?.short && (
            <>
              {rowValue?.short}
            </>
          )}
        </>
      );
    } else {
      content = (
        <>
          {rowValue?.isMissing ? issues[0].original_value : rowValue?.short}
        </>
      );
    }


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
                color,
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
  }, [completeCaseType, dataRulePriority, errorDataRules, getIssueTooltipContent, theme]);

  const tableColumns = useMemo<TableColumn<EpiValidatedCaseWithGeneratedId>[]>(() => {
    const validatedCases = validationQuery?.data?.validated_cases;

    const tableCols: TableColumn<EpiValidatedCaseWithGeneratedId>[] = [];
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
      hideInFilter: true,
      headerName: '',
    });

    if (importAction === EPI_UPLOAD_ACTION.UPDATE && validatedCases.some(vc => !!vc.case.id)) {
      tableCols.push({
        type: 'text',
        isInitiallyVisible: true,
        hideInFilter: true,
        id: 'case_id',
        headerName: t('case_id'),
        valueGetter: (params) => params.row.case.id || '',
        widthPx: 250,
      } satisfies TableColumn<EpiValidatedCaseWithGeneratedId>);
    }
    if (validatedCases.some(vc => !!vc.case.case_date)) {
      tableCols.push({
        type: 'text',
        isInitiallyVisible: true,
        hideInFilter: true,
        id: 'case_date',
        headerName: t('case_date'),
        valueGetter: (params) => {
          if (params.row.case.case_date) {
            return format(new Date(params.row.case.case_date), DATE_FORMAT.DATE);
          }
          return '';
        },
        widthPx: 250,
      } satisfies TableColumn<EpiValidatedCaseWithGeneratedId>);
    }


    // get union of caseTypeColIds from validationQuery.data.validated_cases
    const uniqueCaseTypeColIds: Set<string> = new Set();
    validatedCases.forEach((validatedCase) => {
      Object.keys(validatedCase.case.content || {}).forEach((colId) => uniqueCaseTypeColIds.add(colId));
      validatedCase.data_issues.forEach((issue) => uniqueCaseTypeColIds.add(issue.case_type_col_id));
    });

    completeCaseType.case_type_col_order.forEach((caseTypeColId) => {
      if (!uniqueCaseTypeColIds.has(caseTypeColId)) {
        return;
      }
      const caseTypeColumn = completeCaseType.case_type_cols[caseTypeColId];

      const issuesForCaseTypeColumn = validatedCases.flatMap(vc => vc.data_issues.filter((i) => i.case_type_col_id === caseTypeColumn.id));
      const isInitiallyVisible = issuesForCaseTypeColumn.length === 0 || issuesForCaseTypeColumn.some(i => i.data_rule !== CaseColDataRule.DERIVED);

      if (caseTypeColumn) {
        tableCols.push({
          type: 'text',
          isInitiallyVisible,
          hideInFilter: true,
          id: caseTypeColumn.id,
          headerName: caseTypeColumn.code,
          widthPx: 250,
          renderCell,
          cellTitleGetter: (params) => {
            const issue = params.row.data_issues.find((i) => i.case_type_col_id === caseTypeColumn.id);
            if (!issue) {
              const originalValue = rawData.slice(1)[params.rowIndex][mappedColumns.find(mc => mc.caseTypeCol?.id === caseTypeColumn.id)?.originalIndex || -1];
              return t('{{value}} (original value: "{{originalValue}}")', {
                value: EpiCaseUtil.getRowValue(params.row.case as Case, caseTypeColumn, completeCaseType).short,
                originalValue,
              });
            }
            return '';
          },
          valueGetter: (params) => EpiCaseUtil.getRowValue(params.row.case as Case, caseTypeColumn, completeCaseType).short,
        } satisfies TableColumn<EpiValidatedCaseWithGeneratedId>);
      }
    });

    return tableCols;
  }, [completeCaseType, importAction, mappedColumns, rawData, renderCell, renderHasIssueCell, t, validationQuery?.data?.validated_cases]);

  useInitializeTableStore<EpiValidatedCaseWithGeneratedId>({ store: tableStore, columns: tableColumns, rows: rowsWithGeneratedId, createFiltersFromColumns: true });

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
            font={theme.epi.lineList.font}
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
