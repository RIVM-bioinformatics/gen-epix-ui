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
import { useStore } from 'zustand';

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
import { CaseUtil } from '../../../utils/CaseUtil';
import { type Col } from '../../../api';
import { EpiUploadStoreContext } from '../../../stores/epiUploadStore';
import type { CaseUploadResultWithGeneratedId } from '../../../models/epi';

import { EpiUploadNavigation } from './EpiUploadNavigation';

export const EpiUploadMapSequences = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  const store = useContext(EpiUploadStoreContext);
  const goToNextStep = useStore(store, (state) => state.goToNextStep);
  const goToPreviousStep = useStore(store, (state) => state.goToPreviousStep);
  const completeCaseType = useStore(store, (state) => state.completeCaseType);
  const sampleIdColId = useStore(store, (state) => state.sampleIdColId);
  const sequenceFilesDataTransfer = useStore(store, (state) => state.sequenceFilesDataTransfer);
  const validatedCasesWithGeneratedId = useStore(store, (state) => state.validatedCasesWithGeneratedId);
  const validatedCases = useStore(store, (state) => state.validatedCases);
  const setSequenceMapping = useStore(store, (state) => state.setSequenceMapping);

  const completeCaseTypeColStats = useMemo(() => {
    return EpiUploadUtil.getCompleteCaseTypeColStats(completeCaseType);
  }, [completeCaseType]);

  const alertTitleId = useId();
  const alertContentId = useId();

  const epiUploadSequenceMapping = useRef(store.getState().sequenceMapping);

  const onProceedButtonClick = useCallback(async () => {
    setSequenceMapping(epiUploadSequenceMapping.current);
    await goToNextStep();
  }, [setSequenceMapping, goToNextStep]);

  const updateAlert = useCallback(() => {
    // Note: This is done via DOM manipulation to prevent excessive re-renders of the entire table

    const alertTitleElement = document.getElementById(alertTitleId);
    const alertContentElement = document.getElementById(alertContentId);
    if (!alertTitleElement || !alertContentElement) {
      return;
    }
    const {
      numberOfFilesToMap,
      mappedFiles,
      unmappedFileNames,
    } = EpiUploadUtil.getSequenceMappingStats(epiUploadSequenceMapping.current, sequenceFilesDataTransfer);

    alertTitleElement.innerHTML = numberOfFilesToMap === mappedFiles.length ? t('All {{numberOfFilesToMap}} files are mapped', { numberOfFilesToMap }) : t('{{mappedFilesLength}} of {{numberOfFilesToMap}} files mapped', { mappedFilesLength: mappedFiles.length, numberOfFilesToMap });
    alertContentElement.innerHTML = numberOfFilesToMap === mappedFiles.length ? '' : t('Unmapped files: {{unmappedFileNames}}', { unmappedFileNames: unmappedFileNames.join(', ') });
  }, [alertContentId, alertTitleId, sequenceFilesDataTransfer, t]);

  useEffect(() => {
    updateAlert();
  }, [updateAlert]);

  const tableStore = useMemo(() => createTableStore<CaseUploadResultWithGeneratedId>({
    idSelectorCallback: (row) => row.generatedId,
  }), []);

  const caseHasColumnContent = useCallback((rows: CaseUploadResultWithGeneratedId[], col: Col): boolean => {
    return rows.some((row) => {
      const value = CaseUtil.getRowValue(row.validated_content, col, completeCaseType);
      return value && !value?.isMissing;
    });
  }, [completeCaseType]);

  const sequenceDropDownOptions = useMemo(() => {
    return Array.from(sequenceFilesDataTransfer.files).map((file) => file.name).filter(name => name.endsWith('.fasta') || name.endsWith('.fa') || name.endsWith('.fa.gz') || name.endsWith('.fasta.gz'));
  }, [sequenceFilesDataTransfer.files]);

  const readsDropDownOptions = useMemo(() => {
    return Array.from(sequenceFilesDataTransfer.files).map((file) => file.name).filter(name => name.endsWith('.fastq') || name.endsWith('.fq') || name.endsWith('.fq.gz') || name.endsWith('.fastaq.gz'));
  }, [sequenceFilesDataTransfer.files]);

  const createDropDown = useCallback((kwArgs: { dropDownValue: string; dropDownOptions: string[]; label: string; onChange: (newValue: string) => void }) => {
    const { dropDownValue, dropDownOptions, label, onChange } = kwArgs;

    return (
      <Autocomplete
        freeSolo
        fullWidth
        sx={{
          lineHeight: 'initial',
        }}
        value={dropDownValue}
        options={dropDownOptions}
        // eslint-disable-next-line react/jsx-no-bind
        renderInput={(params) => (
          <TextField
            {...params}
            size={'small'}
            label={label}
          />
        )}
        // eslint-disable-next-line react/jsx-no-bind
        onChange={(_, newValue) => {
          onChange(newValue);
          setSequenceMapping(epiUploadSequenceMapping.current);
          updateAlert();
        }}
      />
    );
  }, [setSequenceMapping, updateAlert]);

  const renderSequenceCell = useCallback((tableRowParams: TableRowParams<CaseUploadResultWithGeneratedId>) => {
    const col = completeCaseType.cols[tableRowParams.id];

    const id = tableRowParams.row.generatedId;
    const dropDownValue = epiUploadSequenceMapping.current?.[tableRowParams.row.generatedId]?.sequenceFileNames[col.id] || '';
    const onChange = (newValue: string) => {
      if (!newValue) {
        delete epiUploadSequenceMapping.current?.[id]?.sequenceFileNames[col.id];
      } else {
        epiUploadSequenceMapping.current[id].sequenceFileNames[col.id] = newValue;
      }
    };

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {createDropDown({
          dropDownValue,
          dropDownOptions: sequenceDropDownOptions,
          label: col.label,
          onChange,
        })}
      </Box>
    );
  }, [completeCaseType, createDropDown, sequenceDropDownOptions]);


  const renderReadsCell = useCallback((tableRowParams: TableRowParams<CaseUploadResultWithGeneratedId>) => {
    const col = completeCaseType.cols[tableRowParams.id];
    const isSequenceColumn = completeCaseTypeColStats.sequenceColumns.includes(col);

    const id = tableRowParams.row.generatedId;
    const dropDownValueFwd = epiUploadSequenceMapping.current?.[tableRowParams.row.generatedId]?.readsFileNames?.[col.id]?.fwd || '';
    const dropDownValueRev = epiUploadSequenceMapping.current?.[tableRowParams.row.generatedId]?.readsFileNames?.[col.id]?.rev || '';
    const onChangeFwd = (newValue: string) => {
      if (!newValue) {
        delete epiUploadSequenceMapping.current?.[id]?.readsFileNames?.[col.id]?.fwd;
      } else {
        epiUploadSequenceMapping.current[id].readsFileNames[col.id].fwd = newValue;
      }
    };
    const onChangeRev = (newValue: string) => {
      if (!newValue) {
        delete epiUploadSequenceMapping.current?.[id]?.readsFileNames?.[col.id]?.rev;
      } else {
        epiUploadSequenceMapping.current[id].readsFileNames[col.id].rev = newValue;
      }
    };

    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 1,
          height: '100%',
        }}
      >
        {createDropDown({
          dropDownValue: dropDownValueFwd,
          dropDownOptions: isSequenceColumn ? sequenceDropDownOptions : readsDropDownOptions,
          label: `${col.label} FWD`,
          onChange: onChangeFwd,
        })}
        {createDropDown({
          dropDownValue: dropDownValueRev,
          dropDownOptions: isSequenceColumn ? sequenceDropDownOptions : readsDropDownOptions,
          label: `${col.label} REV`,
          onChange: onChangeRev,
        })}
      </Box>
    );
  }, [completeCaseType, completeCaseTypeColStats.sequenceColumns, createDropDown, sequenceDropDownOptions, readsDropDownOptions]);


  const tableColumns = useMemo<TableColumn<CaseUploadResultWithGeneratedId>[]>(() => {
    const tableCols: TableColumn<CaseUploadResultWithGeneratedId>[] = [];
    tableCols.push(
      TableUtil.createReadableIndexColumn(),
    );

    const columnsUsedForMapping = [
      ...completeCaseTypeColStats.sampleIdColumns,
      ...completeCaseTypeColStats.sequenceColumns,
      ...completeCaseTypeColStats.readsColumns,
    ];

    const sampleIdCol = completeCaseTypeColStats.sampleIdColumns.find(x => x.id === sampleIdColId);
    if (sampleIdCol && caseHasColumnContent(validatedCasesWithGeneratedId, sampleIdCol)) {
      tableCols.push({
        type: 'text',
        isInitiallyVisible: true,
        hideInFilter: true,
        id: sampleIdCol.id,
        headerName: sampleIdCol.label,
        widthPx: 300,
        valueGetter: (params) => CaseUtil.getRowValue(params.row.validated_content, sampleIdCol, completeCaseType).short,
      });
    }

    completeCaseTypeColStats.sequenceColumns.forEach((col) => {
      tableCols.push({
        type: 'text',
        isInitiallyVisible: true,
        hideInFilter: true,
        id: col.id,
        headerName: col.label,
        widthPx: 400,
        renderCell: renderSequenceCell,
        valueGetter: (params) => CaseUtil.getRowValue(params.row.validated_content, col, completeCaseType).short,
        cellTitleGetter: () => null,
      });
    });

    completeCaseTypeColStats.readsColumns.forEach((col) => {
      tableCols.push({
        type: 'text',
        isInitiallyVisible: true,
        hideInFilter: true,
        id: col.id,
        headerName: col.label,
        widthPx: 800,
        renderCell: renderReadsCell,
        valueGetter: (params) => CaseUtil.getRowValue(params.row.validated_content, col, completeCaseType).short,
        cellTitleGetter: () => null,
      });
    });

    const uniqueColIds: Set<string> = new Set();
    validatedCases.forEach((vc) => {
      Object.keys(vc.validated_content || {}).forEach((colId) => uniqueColIds.add(colId));
    });

    const colIdsToIgnore = [...completeCaseTypeColStats.sequenceColumns.map(x => x.id), ...completeCaseTypeColStats.readsColumns.map(x => x.id), sampleIdCol?.id];

    completeCaseType.ordered_col_ids.forEach((colId) => {
      if (colIdsToIgnore.includes(colId) || !uniqueColIds.has(colId) || columnsUsedForMapping.find(c => c.id === colId)) {
        return;
      }

      const col = completeCaseType.cols[colId];
      if (col) {
        tableCols.push({
          type: 'text',
          isInitiallyVisible: true,
          hideInFilter: true,
          id: col.id,
          headerName: col.code,
          widthPx: 250,
          valueGetter: (params) => CaseUtil.getRowValue(params.row.validated_content, col, completeCaseType).short,
        } satisfies TableColumn<CaseUploadResultWithGeneratedId>);
      }
    });

    return tableCols;
  }, [caseHasColumnContent, completeCaseType, completeCaseTypeColStats.readsColumns, completeCaseTypeColStats.sampleIdColumns, completeCaseTypeColStats.sequenceColumns, renderReadsCell, renderSequenceCell, sampleIdColId, validatedCases, validatedCasesWithGeneratedId]);

  useInitializeTableStore<CaseUploadResultWithGeneratedId>({ store: tableStore, columns: tableColumns, rows: validatedCasesWithGeneratedId, createFiltersFromColumns: true });

  return (
    <Box
      sx={{
        height: '100%',
        display: 'grid',
        gridTemplateRows: 'max-content auto max-content',
      }}
    >
      <Box sx={{ paddingBottom: 1 }}>
        <Alert severity={'info'}>
          <AlertTitle id={alertTitleId} />
          <Box id={alertContentId} />
        </Alert>
      </Box>
      <TableStoreContextProvider store={tableStore}>
        <Table
          font={theme['gen-epix'].lineList.font}
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
