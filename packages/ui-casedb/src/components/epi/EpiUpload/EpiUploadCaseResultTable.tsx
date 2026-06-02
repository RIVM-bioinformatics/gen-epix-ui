import type { ReactElement } from 'react';
import {
  useCallback,
  useMemo,
  useRef,
} from 'react';
import EditIcon from '@mui/icons-material/Edit';
import type { StoreApi } from 'zustand';
import {
  Box,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Tooltip,
  useTheme,
} from '@mui/material';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import type {
  CaseDbCase,
  CaseDbCaseDataIssue,
  CaseDbCaseUploadResult,
  CaseDbCol,
  CaseDbCompleteCaseType,
} from '@gen-epix/api-casedb';
import { CaseDbDataIssueType } from '@gen-epix/api-casedb';
import type {
  TableColumn,
  TableRowAndColumnParams,
  TableRowParams,
  TableStore,
} from '@gen-epix/ui';
import {
  Table,
  TABLE_COLUMN_FROZEN,
  TableMenu,
  TableUtil,
  useInitializeTableStore,
} from '@gen-epix/ui';

import type { CaseUploadResultWithGeneratedId } from '../../../models/epi';
import { CaseUtil } from '../../../utils/CaseUtil';
import type { EpiCaseContentFormDialogRefMethods } from '../EpiCaseContentFormDialog';
import { EpiCaseContentFormDialog } from '../EpiCaseContentFormDialog';


export type EpiUploadCaseResultTableProps = {
  readonly caseUploadResults?: CaseDbCaseUploadResult[];
  readonly completeCaseType: CaseDbCompleteCaseType;
  readonly getOriginalCellValue: (col: CaseDbCol, cellParams: TableRowAndColumnParams<CaseUploadResultWithGeneratedId, null>, issue: CaseDbCaseDataIssue) => string;
  readonly onCaseContentEditSubmit: (caseId: string, content: CaseDbCase['content']) => void;
  readonly tableStore: StoreApi<TableStore<CaseUploadResultWithGeneratedId>>;
};

export const EpiUploadCaseResultTable = ({ caseUploadResults, completeCaseType, getOriginalCellValue, onCaseContentEditSubmit, tableStore }: EpiUploadCaseResultTableProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const epiCaseFormDialogRef = useRef<EpiCaseContentFormDialogRefMethods>(null);

  const rowsWithGeneratedId = useMemo<CaseUploadResultWithGeneratedId[]>(() => {
    return (caseUploadResults || []).map((vc, index) => ({
      ...vc,
      generatedId: vc.id || index.toString(),
    }));
  }, [caseUploadResults]);

  const dataRulePriority: CaseDbDataIssueType[] = useMemo(() => [
    CaseDbDataIssueType.UNAUTHORIZED,
    CaseDbDataIssueType.INVALID,
    CaseDbDataIssueType.CONFLICT,
    CaseDbDataIssueType.MISSING,
    CaseDbDataIssueType.DERIVED,
    CaseDbDataIssueType.TRANSFORMED,
  ], []);

  const errorIssueTypes: CaseDbDataIssueType[] = useMemo(() => [
    CaseDbDataIssueType.UNAUTHORIZED,
    CaseDbDataIssueType.INVALID,
  ], []);

  const warningIssueTypes: CaseDbDataIssueType[] = useMemo(() => [
    CaseDbDataIssueType.MISSING,
    CaseDbDataIssueType.CONFLICT,
  ], []);

  const onCaseContentFormDialogSubmit = useCallback((caseId: string, content: CaseDbCase['content']) => {
    onCaseContentEditSubmit(caseId, content);
    epiCaseFormDialogRef.current?.close();
  }, [onCaseContentEditSubmit]);

  const getIssueTooltipMessages = useCallback((issues: CaseDbCaseDataIssue[]) => {
    const messages: { key: string; message: string }[] = [];
    issues.forEach((issue) => {
      const columnLabel = completeCaseType.cols[issue.col_id].label;
      const message = `${columnLabel}: ${issue.message}`;
      messages.push({
        key: `${issue.col_id}-${issue.data_issue_type}-${issue.code}`,
        message,
      });
    });
    return messages;
  }, [completeCaseType.cols]);

  const getIssueTooltipContent = useCallback((issues: CaseDbCaseDataIssue[]) => {
    const messages = getIssueTooltipMessages(issues);
    return (
      <>
        {messages.map(({ key, message }, index) => (
          <Box
            key={key}
            sx={{ marginTop: index > 0 ? 1 : 0 }}
          >
            {message}
          </Box>
        ))}
      </>
    );
  }, [getIssueTooltipMessages]);

  const getIssueTooltipLabel = useCallback((issues: CaseDbCaseDataIssue[]) => {
    const messages = getIssueTooltipMessages(issues);
    return messages.map(m => m.message).join(', ');
  }, [getIssueTooltipMessages]);

  const getFilteredIssueTypes = useCallback((id: string, issues: CaseDbCaseDataIssue[], value: string) => {
    return issues.filter((issue) => {
      if (issue.col_id !== id) {
        return false;
      }
      if (issue.data_issue_type === CaseDbDataIssueType.TRANSFORMED && issue.original_value === value) {
        return false;
      }
      return true;
    }).sort((a, b) => dataRulePriority.indexOf(a.data_issue_type) - dataRulePriority.indexOf(b.data_issue_type));
  }, [dataRulePriority]);

  const renderHasIssueHeader = useCallback(() => {
    return (
      <Tooltip
        aria-hidden={false}
        arrow
        title={t('Indicates if there are any issues with the case')}
      >
        <ErrorOutlinedIcon
          fontSize={'small'}
        />
      </Tooltip>
    );
  }, [t]);

  const renderHasIssueCell = useCallback(({ row }: TableRowParams<CaseUploadResultWithGeneratedId>) => {
    const errorIssues = row.data_issues.filter(i => i.data_issue_type === CaseDbDataIssueType.INVALID || i.data_issue_type === CaseDbDataIssueType.UNAUTHORIZED);
    if (errorIssues.length > 0) {
      return (
        <Tooltip
          aria-hidden={false}
          aria-label={getIssueTooltipLabel(errorIssues)}
          arrow
          title={getIssueTooltipContent(errorIssues)}
        >
          <ErrorOutlinedIcon
            fontSize={'small'}
            sx={{
              color: theme.palette.error.main,
              marginTop: '5px',
            }}
          />
        </Tooltip>
      );
    }
  }, [getIssueTooltipContent, getIssueTooltipLabel, theme.palette.error.main]);

  const renderIsNewHeader = useCallback(() => {
    return (
      <Tooltip
        aria-hidden={false}
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
        aria-hidden={false}
        aria-label={t`This case does not have an ID and will be created`}
        fontSize={'small'}
        sx={{
          marginTop: '5px',
          position: 'absolute',
        }}
      />
    );
  }, [t]);

  const renderCell = useCallback(({ id, row }: TableRowParams<CaseUploadResultWithGeneratedId>) => {
    const rowValue = CaseUtil.getRowValue(row.validated_content, completeCaseType.cols[id], completeCaseType);
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
          alignItems: 'center',
          display: 'flex',
        }}
      >
        <Box
          sx={{
            height: theme.spacing(2),
            marginRight: theme.spacing(1),
            minHeight: theme.spacing(2),
            minWidth: theme.spacing(2),
            position: 'relative',
            width: theme.spacing(2),
          }}
        >
          <Tooltip
            arrow
            title={getIssueTooltipContent(issues)}
          >
            <ErrorOutlinedIcon
              fontSize={'small'}
              sx={{
                color: iconColor,
                marginTop: '-2px',
                position: 'absolute',
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
    const tableCols: TableColumn<CaseUploadResultWithGeneratedId>[] = [];
    if (!caseUploadResults?.length) {
      return tableCols;
    }
    tableCols.push(TableUtil.createReadableIndexColumn());
    tableCols.push(TableUtil.createSelectableColumn({
      isDisabled: (params: TableRowParams<CaseUploadResultWithGeneratedId>) => {
        return params.row.data_issues.some(issue => errorIssueTypes.includes(issue.data_issue_type));
      },
    }));
    tableCols.push({
      disableEllipsis: true,
      frozen: TABLE_COLUMN_FROZEN.LEFT,
      headerName: '',
      hideInFilter: true,
      id: 'gen-epix-ui-issue',
      isInitiallyVisible: true,
      renderCell: renderHasIssueCell,
      renderHeader: renderHasIssueHeader,
      resizable: false,
      type: 'text',
      valueGetter: () => '',
      widthPx: 38,
    });
    tableCols.push({
      disableEllipsis: true,
      frozen: TABLE_COLUMN_FROZEN.LEFT,
      headerName: '',
      hideInFilter: true,
      id: 'gen-epix-ui-id',
      isInitiallyVisible: true,
      renderCell: renderIsNewCell,
      renderHeader: renderIsNewHeader,
      resizable: false,
      type: 'text',
      valueGetter: () => '',
      widthPx: 38,
    });

    const uniqueColIds: Set<string> = new Set();
    caseUploadResults.forEach((validatedCase) => {
      Object.keys(validatedCase.validated_content || {}).forEach((colId) => uniqueColIds.add(colId));
      validatedCase.data_issues.forEach((issue) => uniqueColIds.add(issue.col_id));
    });

    completeCaseType.ordered_col_ids.forEach((colId) => {
      if (!uniqueColIds.has(colId)) {
        return;
      }
      const col = completeCaseType.cols[colId];

      const issuesForCol = caseUploadResults.flatMap(vc => vc.data_issues.filter((i) => i.col_id === col.id));
      const isInitiallyVisible = issuesForCol.length === 0 || issuesForCol.some(i => i.data_issue_type !== CaseDbDataIssueType.DERIVED);

      if (col) {
        tableCols.push({
          cellTitleGetter: (params) => {
            const issue = params.row.data_issues.find((i) => i.col_id === col.id);
            if (!issue && getOriginalCellValue) {
              const originalValue = getOriginalCellValue(col, params, issue) ?? '';
              return t('{{value}} (original value: "{{originalValue}}")', {
                originalValue,
                value: CaseUtil.getRowValue(params.row.validated_content, col, completeCaseType).short,
              });
            }
            return '';
          },
          headerName: col.code,
          hideInFilter: true,
          id: col.id,
          isInitiallyVisible,
          renderCell,
          type: 'text',
          valueGetter: (params) => CaseUtil.getRowValue(params.row.validated_content, col, completeCaseType).short,
          widthPx: 250,
        } satisfies TableColumn<CaseUploadResultWithGeneratedId>);
      }
    });

    if (caseUploadResults.some(vc => vc.id)) {
      tableCols.push({
        headerName: t('case_id'),
        hideInFilter: true,
        id: 'case_id',
        isInitiallyVisible: true,
        type: 'text',
        valueGetter: (params) => params.row.id || '',
        widthPx: 250,
      } satisfies TableColumn<CaseUploadResultWithGeneratedId>);
    }

    tableCols.push(TableUtil.createActionsColumn({
      getActions: (params: TableRowParams<CaseUploadResultWithGeneratedId>) => {
        const actions: ReactElement[] = [];
        actions.push(
          <MenuItem
            key={'editCase'}
            // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
            onClick={() => {
              epiCaseFormDialogRef.current?.open({
                caseContent: params.row.validated_content,
                caseId: params.row.generatedId,
                completeCaseType,
                enabledColIds: completeCaseType.ordered_col_ids,
                formId: `edit-case-form`,
                onSubmit: onCaseContentFormDialogSubmit,
              });
            }}
          >
            <ListItemIcon>
              <EditIcon />
            </ListItemIcon>
            <ListItemText>
              {t`Edit`}
            </ListItemText>
          </MenuItem>,
        );
        return actions;
      },
      t,
    }));
    return tableCols;
  }, [caseUploadResults, renderHasIssueCell, renderHasIssueHeader, renderIsNewCell, renderIsNewHeader, completeCaseType, t, errorIssueTypes, renderCell, getOriginalCellValue, onCaseContentFormDialogSubmit]);

  useInitializeTableStore<CaseUploadResultWithGeneratedId>({ columns: tableColumns, createFiltersFromColumns: true, rows: rowsWithGeneratedId, store: tableStore });

  return (
    <>
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
        font={theme['gen-epix-ui-casedb'].lineList.font}
      />
      <EpiCaseContentFormDialog ref={epiCaseFormDialogRef} />
    </>
  );
};
