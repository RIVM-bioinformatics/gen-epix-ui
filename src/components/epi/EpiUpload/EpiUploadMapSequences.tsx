import {
  Autocomplete,
  Box,
  TextField,
  useTheme,
} from '@mui/material';
import {
  useCallback,
  useMemo,
} from 'react';

import type { EpiValidatedCaseWithGeneratedId } from '../../../models/epiUpload';
import { StringUtil } from '../../../utils/StringUtil';
import {
  createTableStore,
  TableStoreContextProvider,
} from '../../../stores/tableStore';
import { useInitializeTableStore } from '../../../hooks/useInitializeTableStore';
import type {
  TableColumn,
  TableRowParams,
} from '../../../models/table';
import { TableUtil } from '../../../utils/TableUtil';
import { EpiUploadUtil } from '../../../utils/EpiUploadUtil';
import { Table } from '../../ui/Table';
import { EpiCaseUtil } from '../../../utils/EpiCaseUtil';
import {
  type CompleteCaseType,
  type ValidatedCase,
  type Case,
  type CaseTypeCol,
} from '../../../api';

import { EpiUploadNavigation } from './EpiUploadNavigation';

export type EpiUploadMapSequencesProps = {
  readonly onProceed: () => void;
  readonly onGoBack: () => void;
  readonly completeCaseType: CompleteCaseType;
  readonly validatedCases: ValidatedCase[];
  readonly sequenceFilesDataTransfer: DataTransfer;
};

export const EpiUploadMapSequences = ({ onProceed, onGoBack, validatedCases, sequenceFilesDataTransfer, completeCaseType }: EpiUploadMapSequencesProps) => {
  const theme = useTheme();
  const onProceedButtonClick = useCallback(() => {
    onProceed();
  }, [onProceed]);

  const rowsWithGeneratedId = useMemo<EpiValidatedCaseWithGeneratedId[]>(() => {
    return (validatedCases || []).map((vc) => ({
      ...vc,
      generated_id: vc.case.id || StringUtil.createUuid(),
    }));
  }, [validatedCases]);

  const completeCaseTypeColumnStats = useMemo(() => {
    return EpiUploadUtil.getCompleteCaseTypeColumnStats(completeCaseType);
  }, [completeCaseType]);

  const tableStore = useMemo(() => createTableStore<EpiValidatedCaseWithGeneratedId>({
    idSelectorCallback: (row) => row.generated_id,
  }), []);

  const caseHasColumnContent = useCallback((rows: EpiValidatedCaseWithGeneratedId[], caseTypeColumn: CaseTypeCol): boolean => {
    return rows.some((row) => {
      const value = EpiCaseUtil.getRowValue(row.case as Case, caseTypeColumn, completeCaseType);
      return value && !value?.isMissing;
    });
  }, [completeCaseType]);

  const renderDropDownCell = useCallback((tableRowParams: TableRowParams<EpiValidatedCaseWithGeneratedId>) => {
    const caseTypeColumn = completeCaseType.case_type_cols[tableRowParams.id];
    const rowValue = EpiCaseUtil.getRowValue(tableRowParams.row.case as Case, caseTypeColumn, completeCaseType);

    if (rowValue.isMissing) {
      return null;
    }

    const options = ['1', '2', '3'];
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
        height={'100%'}
      >
        <Autocomplete
          size={'small'}
          sx={{
            lineHeight: 'initial',
          }}
          // eslint-disable-next-line react/jsx-no-bind
          renderInput={(params) => (
            <TextField
              {...params}
              size={'small'}
              label={rowValue.short}
            />
          )}
          options={options}
        />
      </Box>
    );
  }, [completeCaseType]);

  const tableColumns = useMemo<TableColumn<EpiValidatedCaseWithGeneratedId>[]>(() => {
    const tableCols: TableColumn<EpiValidatedCaseWithGeneratedId>[] = [];
    tableCols.push(TableUtil.createReadableIndexColumn());

    [
      ...completeCaseTypeColumnStats.idColumns,
      ...completeCaseTypeColumnStats.sequenceColumns,
      ...completeCaseTypeColumnStats.readsColumns,
      ...completeCaseTypeColumnStats.readsFwdRevColumnPairs.flatMap(pair => [pair.fwd, pair.rev]),
    ].forEach((caseTypeColumn) => {
      if (!caseHasColumnContent(rowsWithGeneratedId, caseTypeColumn)) {
        console.log(`Skipping column ${caseTypeColumn.label} as no data present`);
        return;
      }
      const isIdColumn = completeCaseTypeColumnStats.idColumns.includes(caseTypeColumn);
      tableCols.push({
        type: 'text',
        isInitiallyVisible: true,
        hideInFilter: true,
        id: caseTypeColumn.id,
        headerName: caseTypeColumn.label,
        widthPx: isIdColumn ? 300 : 400,
        renderCell: isIdColumn ? undefined : renderDropDownCell,
        valueGetter: (params) => EpiCaseUtil.getRowValue(params.row.case as Case, caseTypeColumn, completeCaseType).short,
      });
    });

    return tableCols;
  }, [caseHasColumnContent, completeCaseType, completeCaseTypeColumnStats.idColumns, completeCaseTypeColumnStats.readsColumns, completeCaseTypeColumnStats.readsFwdRevColumnPairs, completeCaseTypeColumnStats.sequenceColumns, renderDropDownCell, rowsWithGeneratedId]);

  useInitializeTableStore<EpiValidatedCaseWithGeneratedId>({ store: tableStore, columns: tableColumns, rows: rowsWithGeneratedId, createFiltersFromColumns: true });

  // console.log({ completeCaseTypeIdsColumns: completeCaseTypeIdColumns, validatedCases, sequenceFilesDataTransfer });
  // console.log({ completeCaseTypeColumnStats });

  return (
    <Box
      sx={{
        height: '100%',
        display: 'grid',
        gridTemplateRows: 'auto max-content',
      }}
    >
      <TableStoreContextProvider store={tableStore}>
        <Table
          font={theme.epi.lineList.font}
          rowHeight={7}
        />
        <EpiUploadNavigation
          onGoBackButtonClick={onGoBack}
          onProceedButtonClick={onProceedButtonClick}
        />
      </TableStoreContextProvider>
    </Box>
  );
};
