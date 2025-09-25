import {
  Tooltip,
  useTheme,
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { Box } from '@mui/system';
import { t } from 'i18next';
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
} from 'react';
import { format } from 'date-fns';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import omit from 'lodash/omit';

import {
  type EpiUploadSelectFileResult,
  type EpiUploadMappedColumn,
  EPI_UPLOAD_ACTION,
} from '../../../models/epiUpload';
import type {
  Case,
  CaseDataIssue,
  CaseForCreateUpdate,
  CompleteCaseType,
  ValidatedCase,
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
import { Table } from '../../ui/Table';
import { DATE_FORMAT } from '../../../data/date';
import { TableUtil } from '../../../utils/TableUtil';
import { EpiCaseUtil } from '../../../utils/EpiCaseUtil';
import { StringUtil } from '../../../utils/StringUtil';
import { QueryUtil } from '../../../utils/QueryUtil';
import { QUERY_KEY } from '../../../models/query';

import { EpiUploadNavigation } from './EpiUploadNavigation';

export type EpiUploadValidateProps = {
  readonly selectFileResult: EpiUploadSelectFileResult;
  readonly mappedColumns: EpiUploadMappedColumn[];
  readonly onProceed: (validatedCases: ValidatedCase[]) => void;
  readonly onGoBack: () => void;
  readonly completeCaseType: CompleteCaseType;
  readonly caseTypeId: string;
};

type ValidatedCaseWithGeneratedId = ValidatedCase & { generated_id: string };

export const EpiUploadValidateContent = ({
  selectFileResult,
  mappedColumns,
  onProceed,
  onGoBack,
  completeCaseType,
}: EpiUploadValidateProps) => {
  const theme = useTheme();
  const queryId = useId();

  const inputCases = useMemo<CaseForCreateUpdate[]>(() => {
    return selectFileResult.rawData.slice(1).map((row) => {
      const caseIdColumn = mappedColumns.find((mappedColumn) => mappedColumn.isCaseIdColumn)?.originalIndex;
      const caseDateColumn = mappedColumns.find((mappedColumn) => mappedColumn.isCaseDateColumn)?.originalIndex;

      const caseForCreateUpdate: CaseForCreateUpdate = {
        id: caseIdColumn !== undefined ? row[caseIdColumn] : undefined,
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
  }, [mappedColumns, selectFileResult.rawData]);

  const validationQuery = useQueryMemo({
    queryKey: QueryUtil.getGenericKey(QUERY_KEY.VALIDATE_CASES, queryId),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.validateCases({
        case_type_id: selectFileResult.case_type_id,
        created_in_data_collection_id: selectFileResult.create_in_data_collection_id,
        data_collection_ids: selectFileResult.share_in_data_collection_ids,
        is_update: selectFileResult.import_action === EPI_UPLOAD_ACTION.UPDATE,
        cases: inputCases,
      }, { signal });
      return response.data;
    },
    enabled: mappedColumns.length > 0 && inputCases.length > 0,
    gcTime: 0,
    staleTime: 0,
  });

  const rowsWithGeneratedId = useMemo<ValidatedCaseWithGeneratedId[]>(() => {
    return (validationQuery?.data?.validated_cases || []).map((vc) => ({
      ...vc,
      generated_id: vc.case.id || StringUtil.createUuid(),
    }));
  }, [validationQuery?.data?.validated_cases]);

  const loadables = useArray([
    validationQuery,
  ]);

  const tableStore = useMemo(() => createTableStore<ValidatedCaseWithGeneratedId>({
    idSelectorCallback: (row) => row.generated_id,
  }), []);

  const setSelectedIds = useStore(tableStore, useShallow((state) => state.setSelectedIds));

  useEffect(() => {
    const newSelectedIds = rowsWithGeneratedId.filter(validatedCase => {
      return !validatedCase.data_issues.some(issue => issue.data_rule === CaseColDataRule.INVALID || issue.data_rule === CaseColDataRule.UNAUTHORIZED || issue.data_rule === CaseColDataRule.CONFLICT);
    }).map(vc => vc.generated_id);
    setSelectedIds(newSelectedIds);
  }, [rowsWithGeneratedId, setSelectedIds]);

  const getIssueTooltipContent = useCallback((issues: CaseDataIssue[]) => {
    const messages: { message: string; key: string }[] = [];
    issues.forEach((issue) => {
      const issueMessage = issue.details.replace(issue.original_value, '"{{originalValue}}"');
      const translatedMessage = t(issueMessage, { originalValue: issue.original_value });
      messages.push({ message: translatedMessage, key: issue.case_type_col_id });
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
  }, []);

  const renderHasIssueCell = useCallback(({ row }: TableRowParams<ValidatedCaseWithGeneratedId>) => {
    const errorIssues = row.data_issues.filter(i => i.data_rule === CaseColDataRule.INVALID || i.data_rule === CaseColDataRule.UNAUTHORIZED || i.data_rule === CaseColDataRule.CONFLICT);
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

  const renderCell = useCallback(({ id, row }: TableRowParams<ValidatedCaseWithGeneratedId>) => {
    const rowValue = EpiCaseUtil.getRowValue(row.case as Case, completeCaseType.case_type_cols[id], completeCaseType);
    const issue = row.data_issues.find((i) => i.case_type_col_id === id);

    if (issue) {
      let color: string;
      switch (issue.data_rule) {
        case CaseColDataRule.MISSING:
          color = theme.palette.warning.main;
          break;
        case CaseColDataRule.DERIVED:
          color = theme.palette.info.main;
          break;
        case CaseColDataRule.CONFLICT:
        case CaseColDataRule.UNAUTHORIZED:
        case CaseColDataRule.INVALID:
        default:
          color = theme.palette.error.main;
          break;
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
              title={getIssueTooltipContent([issue])}
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
            {issue.original_value}
          </Box>
        </Box>
      );
    }
    return (
      <>
        {rowValue.short}
      </>
    );
  }, [completeCaseType, getIssueTooltipContent, theme]);

  const tableColumns = useMemo<TableColumn<ValidatedCaseWithGeneratedId>[]>(() => {
    const validatedCases = validationQuery?.data?.validated_cases;
    const tableCols: TableColumn<ValidatedCaseWithGeneratedId>[] = [];
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

    const hasIdColumn = validatedCases.some(vc => !!vc.case.id);
    const hasDateColumn = validatedCases.some(vc => !!vc.case.case_date);
    if (hasIdColumn) {
      tableCols.push({
        type: 'text',
        isInitiallyVisible: true,
        hideInFilter: true,
        id: 'case_id',
        headerName: t('case_id'),
        valueGetter: (params) => params.row.case.id || '',
        widthPx: 250,
      } satisfies TableColumn<ValidatedCaseWithGeneratedId>);
    }
    if (hasDateColumn) {
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
      } satisfies TableColumn<ValidatedCaseWithGeneratedId>);
    }


    // get union of caseTypeColIds from validationQuery.data.validated_cases
    const uniqueCaseTypeColIds: Set<string> = new Set();
    validatedCases.forEach((vc) => {
      Object.keys(vc.case.content || {}).forEach((colId) => uniqueCaseTypeColIds.add(colId));
    });

    completeCaseType.case_type_col_order.forEach((caseTypeColId) => {
      if (!uniqueCaseTypeColIds.has(caseTypeColId)) {
        return;
      }
      const caseTypeColumn = completeCaseType.case_type_cols[caseTypeColId];
      if (caseTypeColumn) {
        tableCols.push({
          type: 'text',
          isInitiallyVisible: true,
          hideInFilter: true,
          id: caseTypeColumn.id,
          headerName: caseTypeColumn.code,
          widthPx: 250,
          renderCell,
          cellTitleGetter: (params) => {
            const issue = params.row.data_issues.find((i) => i.case_type_col_id === caseTypeColumn.id);
            if (!issue) {
              const originalValue = selectFileResult.rawData.slice(1)[params.rowIndex][mappedColumns.find(mc => mc.caseTypeCol?.id === caseTypeColumn.id)?.originalIndex || -1];
              return t('{{value}} (original value: "{{originalValue}}")', {
                value: EpiCaseUtil.getRowValue(params.row.case as Case, caseTypeColumn, completeCaseType).short,
                originalValue,
              });
            }
            return '';
          },
          valueGetter: (params) => EpiCaseUtil.getRowValue(params.row.case as Case, caseTypeColumn, completeCaseType).short,
        } satisfies TableColumn<ValidatedCaseWithGeneratedId>);
      }
    });

    return tableCols;
  }, [completeCaseType, mappedColumns, renderCell, renderHasIssueCell, selectFileResult.rawData, validationQuery?.data?.validated_cases]);

  useInitializeTableStore<ValidatedCaseWithGeneratedId>({ store: tableStore, columns: tableColumns, rows: rowsWithGeneratedId, createFiltersFromColumns: true });

  const onProceedButtonClick = useCallback(() => {
    const selectedIds = tableStore.getState().selectedIds;
    const validatedCases = rowsWithGeneratedId.filter(r => selectedIds.includes(r.generated_id)).map(r => omit(r, 'generated_id'));
    onProceed(validatedCases);
  }, [onProceed, rowsWithGeneratedId, tableStore]);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'grid',
        gridTemplateRows: 'auto max-content',
      }}
    >
      <ResponseHandler
        inlineSpinner
        loadables={loadables}
        loadingMessage={t('Validating cases')}
      >
        <TableStoreContextProvider store={tableStore}>
          <Table />
          <EpiUploadNavigation
            onGoBackButtonClick={onGoBack}
            onProceedButtonClick={onProceedButtonClick}
          />
        </TableStoreContextProvider>
      </ResponseHandler>
    </Box>
  );
};
