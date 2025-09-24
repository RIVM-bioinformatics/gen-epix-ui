import {
  Button,
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

  const renderCell = useCallback(({ id, row }: TableRowParams<ValidatedCaseWithGeneratedId>) => {
    const rowValue = EpiCaseUtil.getRowValue(row.case as Case, completeCaseType.case_type_cols[id], completeCaseType);
    const issue = row.data_issues.find((i) => i.case_type_col_id === id);

    if (issue) {
      let color: string;
      switch (issue.data_rule) {
        case CaseColDataRule.CONFLICT:
        case CaseColDataRule.MISSING:
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
            <ErrorOutlineIcon
              fontSize={'small'}
              sx={{
                color,
                position: 'absolute',
                marginTop: '-2px',
                cursor: 'pointer',
              }}
            />
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
  }, [completeCaseType, theme]);

  const tableColumns = useMemo<TableColumn<ValidatedCaseWithGeneratedId>[]>(() => {
    const validatedCases = validationQuery?.data?.validated_cases;
    const tableCols: TableColumn<ValidatedCaseWithGeneratedId>[] = [];
    if (!validatedCases?.length) {
      return tableCols;
    }
    tableCols.push(TableUtil.createReadableIndexColumn());
    tableCols.push(TableUtil.createSelectableColumn());

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
              return EpiCaseUtil.getRowValue(params.row.case as Case, caseTypeColumn, completeCaseType).full;
            }
            return '';
          },
          valueGetter: (params) => EpiCaseUtil.getRowValue(params.row.case as Case, caseTypeColumn, completeCaseType).short,
        } satisfies TableColumn<ValidatedCaseWithGeneratedId>);
      }
    });

    return tableCols;
  }, [completeCaseType, renderCell, validationQuery?.data?.validated_cases]);

  useInitializeTableStore<ValidatedCaseWithGeneratedId>({ store: tableStore, columns: tableColumns, rows: rowsWithGeneratedId, createFiltersFromColumns: true });

  const onProceedButtonClick = useCallback(() => {
    const selectedIds = tableStore.getState().selectedIds;
    const validatedCases = rowsWithGeneratedId.filter(r => selectedIds.includes(r.generated_id)).map(r => omit(r, 'generated_id'));
    onProceed(validatedCases);
  }, [onProceed, rowsWithGeneratedId, tableStore]);

  return (
    <ResponseHandler
      inlineSpinner
      loadables={loadables}
    >
      <TableStoreContextProvider store={tableStore}>
        <Box
          sx={{
            width: '100%',
            height: '100%',
            position: 'relative',
            display: 'grid',
            gridTemplateRows: 'auto max-content',
          }}
        >
          <Table />
          <Box
            marginTop={2}
            marginBottom={1}
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'flex-end',
            }}
          >
            <Button
              variant={'outlined'}
              onClick={onGoBack}
            >
              {t('Go back')}
            </Button>
            <Button
              variant={'contained'}
              onClick={onProceedButtonClick}
            >
              {t('Next')}
            </Button>
          </Box>
        </Box>
      </TableStoreContextProvider>
    </ResponseHandler>
  );
};
