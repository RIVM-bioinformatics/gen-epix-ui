import {
  Button,
  useTheme,
} from '@mui/material';
import { Box } from '@mui/system';
import { t } from 'i18next';
import {
  useCallback,
  useId,
  useMemo,
} from 'react';
import { format } from 'date-fns';

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
import { withEpiStore } from '../EpiStoreLoader';
import { DATE_FORMAT } from '../../../data/date';
import { TableUtil } from '../../../utils/TableUtil';
import { EpiCaseUtil } from '../../../utils/EpiCaseUtil';

export type EpiUploadValidateProps = {
  readonly selectFileResult: EpiUploadSelectFileResult;
  readonly mappedColumns: EpiUploadMappedColumn[];
  readonly onProceed: () => void;
  readonly onGoBack: () => void;
  readonly completeCaseType: CompleteCaseType;
  readonly caseTypeId: string;
};

export const EpiUploadValidate = withEpiStore(({
  selectFileResult,
  mappedColumns,
  onProceed,
  onGoBack,
  completeCaseType,
}: EpiUploadValidateProps) => {
  const theme = useTheme();
  const onProceedButtonClick = useCallback(() => {
    onProceed();
  }, [onProceed]);
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
    queryKey: ['validateCases', queryId],
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

  const loadables = useArray([
    validationQuery,
  ]);

  const tableStore = useMemo(() => createTableStore<ValidatedCase>({
    idSelectorCallback: () => null,
  }), []);

  const renderCell = useCallback(({ id, row }: TableRowParams<ValidatedCase>) => {
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
              background: color,
              marginRight: theme.spacing(1),
            }}
          />
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

  const tableColumns = useMemo<TableColumn<ValidatedCase>[]>(() => {
    const validatedCases = validationQuery?.data?.validated_cases;
    const tableCols: TableColumn<ValidatedCase>[] = [];
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
      } satisfies TableColumn<ValidatedCase>);
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
      } satisfies TableColumn<ValidatedCase>);
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
          type: 'validatedCase',
          isInitiallyVisible: true,
          hideInFilter: true,
          id: caseTypeColumn.id,
          headerName: caseTypeColumn.code,
          widthPx: 250,
          renderCell,
          completeCaseType,
          caseTypeColumn,
        } satisfies TableColumn<ValidatedCase>);
      }
    });

    return tableCols;
  }, [completeCaseType, renderCell, validationQuery?.data?.validated_cases]);

  useInitializeTableStore({ store: tableStore, columns: tableColumns, rows: validationQuery?.data?.validated_cases, createFiltersFromColumns: true });

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
});
