import {
  Alert,
  AlertTitle,
  Autocomplete,
  Box,
  TextField,
  useTheme,
} from '@mui/material';
import {
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import uniq from 'lodash/uniq';
import { useStore } from 'zustand';

import type { EpiValidatedCaseWithGeneratedId } from '../../../models/epiUpload';
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
  type Case,
  type CaseTypeCol,
} from '../../../api';
import { EpiUploadStoreContext } from '../../../stores/epiUploadStore';

import { EpiUploadNavigation } from './EpiUploadNavigation';

export const EpiUploadMapSequences = () => {
  const [t] = useTranslation();
  const theme = useTheme();

  const store = useContext(EpiUploadStoreContext);
  const goToNextStep = useStore(store, (state) => state.goToNextStep);
  const goToPreviousStep = useStore(store, (state) => state.goToPreviousStep);
  const completeCaseType = useStore(store, (state) => state.completeCaseType);
  const sequenceFilesDataTransfer = useStore(store, (state) => state.sequenceFilesDataTransfer);
  const validatedCases = useStore(store, (state) => state.validatedCases);
  const setSequenceMapping = useStore(store, (state) => state.setSequenceMapping);

  const rowsWithGeneratedId = useMemo<EpiValidatedCaseWithGeneratedId[]>(() => {
    return (validatedCases || []).map((vc, index) => ({
      ...vc,
      generated_id: index.toString(),
    }));
  }, [validatedCases]);

  const completeCaseTypeColumnStats = useMemo(() => {
    return EpiUploadUtil.getCompleteCaseTypeColumnStats(completeCaseType);
  }, [completeCaseType]);

  const alertTitleId = useId();
  const alertContentId = useId();

  const epiUploadSequenceMapping = useRef(store.getState().sequenceMapping ?? EpiUploadUtil.getEpiUploadSequenceMapping(completeCaseType, rowsWithGeneratedId, sequenceFilesDataTransfer));

  const onProceedButtonClick = useCallback(() => {
    setSequenceMapping(epiUploadSequenceMapping.current);
    goToNextStep();
  }, [setSequenceMapping, goToNextStep]);

  const updateAlert = useCallback(() => {
    // Note: This is done via DOM manipulation to prevent excessive re-renders of the entire table

    const alertTitleElement = document.getElementById(alertTitleId);
    const alertContentElement = document.getElementById(alertContentId);
    if (!alertTitleElement || !alertContentElement) {
      return;
    }
    const numberOfFilesToMap = Array.from(sequenceFilesDataTransfer.files).length;
    const mappedFiles = uniq(Object.values(epiUploadSequenceMapping.current).flatMap(Object.values)).filter(v => v);
    const unmappedFileNames = Array.from(sequenceFilesDataTransfer.files).map(file => file.name).filter(fileName => !mappedFiles.includes(fileName));
    alertTitleElement.innerHTML = numberOfFilesToMap === mappedFiles.length ? t('All {{numberOfFilesToMap}} files are mapped', { numberOfFilesToMap }) : t('{{mappedFilesLength}} of {{numberOfFilesToMap}} files mapped', { mappedFilesLength: mappedFiles.length, numberOfFilesToMap });
    alertContentElement.innerHTML = numberOfFilesToMap === mappedFiles.length ? '' : t('Unmapped files: {{unmappedFileNames}}', { unmappedFileNames: unmappedFileNames.join(', ') });
  }, [alertContentId, alertTitleId, sequenceFilesDataTransfer.files, t]);

  useEffect(() => {
    updateAlert();
  }, [updateAlert]);

  const tableStore = useMemo(() => createTableStore<EpiValidatedCaseWithGeneratedId>({
    idSelectorCallback: (row) => row.generated_id,
  }), []);

  const caseHasColumnContent = useCallback((rows: EpiValidatedCaseWithGeneratedId[], caseTypeColumn: CaseTypeCol): boolean => {
    return rows.some((row) => {
      const value = EpiCaseUtil.getRowValue(row.case as Case, caseTypeColumn, completeCaseType);
      return value && !value?.isMissing;
    });
  }, [completeCaseType]);

  const sequenceDropDownOptions = useMemo(() => {
    return Array.from(sequenceFilesDataTransfer.files).map((file) => file.name).filter(name => name.endsWith('.fasta') || name.endsWith('.fa') || name.endsWith('.fa.gz') || name.endsWith('.fasta.gz'));
  }, [sequenceFilesDataTransfer.files]);

  const readsDropDownOptions = useMemo(() => {
    return Array.from(sequenceFilesDataTransfer.files).map((file) => file.name).filter(name => name.endsWith('.fastq') || name.endsWith('.fq') || name.endsWith('.fq.gz') || name.endsWith('.fastaq.gz'));
  }, [sequenceFilesDataTransfer.files]);

  const renderDropDownCell = useCallback((tableRowParams: TableRowParams<EpiValidatedCaseWithGeneratedId>) => {
    const caseTypeColumn = completeCaseType.case_type_cols[tableRowParams.id];
    const rowValue = EpiCaseUtil.getRowValue(tableRowParams.row.case as Case, caseTypeColumn, completeCaseType);
    const isSequenceColumn = completeCaseTypeColumnStats.sequenceColumns.includes(caseTypeColumn);

    if (rowValue.isMissing) {
      return null;
    }

    const dropDownValue = epiUploadSequenceMapping.current?.[tableRowParams.row.generated_id]?.[caseTypeColumn.id] || '';

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
          freeSolo
          size={'small'}
          sx={{
            lineHeight: 'initial',
          }}
          value={dropDownValue}
          options={isSequenceColumn ? sequenceDropDownOptions : readsDropDownOptions}
          // eslint-disable-next-line react/jsx-no-bind
          renderInput={(params) => (
            <TextField
              {...params}
              size={'small'}
              label={rowValue.short}
            />
          )}
          // eslint-disable-next-line react/jsx-no-bind
          onChange={(_, newValue) => {
            if (!newValue) {
              delete epiUploadSequenceMapping.current?.[tableRowParams.row.generated_id]?.[caseTypeColumn.id];
            } else {
              epiUploadSequenceMapping.current[tableRowParams.row.generated_id][caseTypeColumn.id] = newValue;
            }
            updateAlert();
          }}
        />
      </Box>
    );
  }, [completeCaseType, completeCaseTypeColumnStats.sequenceColumns, sequenceDropDownOptions, readsDropDownOptions, updateAlert]);

  const tableColumns = useMemo<TableColumn<EpiValidatedCaseWithGeneratedId>[]>(() => {
    const tableCols: TableColumn<EpiValidatedCaseWithGeneratedId>[] = [];
    tableCols.push(TableUtil.createReadableIndexColumn());

    const columnsUsedForMapping = [
      ...completeCaseTypeColumnStats.idColumns,
      ...completeCaseTypeColumnStats.sequenceColumns,
      ...completeCaseTypeColumnStats.readsColumns,
      ...completeCaseTypeColumnStats.readsFwdRevColumnPairs.flatMap(pair => [pair.fwd, pair.rev]),
    ];

    columnsUsedForMapping.forEach((caseTypeColumn) => {
      if (!caseHasColumnContent(rowsWithGeneratedId, caseTypeColumn)) {
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

    const uniqueCaseTypeColIds: Set<string> = new Set();
    validatedCases.forEach((vc) => {
      Object.keys(vc.case.content || {}).forEach((colId) => uniqueCaseTypeColIds.add(colId));
    });

    completeCaseType.case_type_col_order.forEach((caseTypeColId) => {
      if (!uniqueCaseTypeColIds.has(caseTypeColId) || columnsUsedForMapping.find(c => c.id === caseTypeColId)) {
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
          valueGetter: (params) => EpiCaseUtil.getRowValue(params.row.case as Case, caseTypeColumn, completeCaseType).short,
        } satisfies TableColumn<EpiValidatedCaseWithGeneratedId>);
      }
    });

    return tableCols;
  }, [caseHasColumnContent, completeCaseType, completeCaseTypeColumnStats.idColumns, completeCaseTypeColumnStats.readsColumns, completeCaseTypeColumnStats.readsFwdRevColumnPairs, completeCaseTypeColumnStats.sequenceColumns, renderDropDownCell, rowsWithGeneratedId, validatedCases]);

  useInitializeTableStore<EpiValidatedCaseWithGeneratedId>({ store: tableStore, columns: tableColumns, rows: rowsWithGeneratedId, createFiltersFromColumns: true });

  return (
    <Box
      sx={{
        height: '100%',
        display: 'grid',
        gridTemplateRows: 'max-content auto max-content',
      }}
    >
      <Box paddingBottom={1}>
        <Alert severity={'info'}>
          <AlertTitle id={alertTitleId} />
          <Box id={alertContentId} />
        </Alert>
      </Box>
      <TableStoreContextProvider store={tableStore}>
        <Table
          font={theme.epi.lineList.font}
          rowHeight={7}
        />
        <EpiUploadNavigation
          onGoBackButtonClick={goToPreviousStep}
          onProceedButtonClick={onProceedButtonClick}
        />
      </TableStoreContextProvider>
    </Box>
  );
};
