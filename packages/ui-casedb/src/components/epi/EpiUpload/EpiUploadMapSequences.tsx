import {
  Alert,
  AlertTitle,
  Autocomplete,
  Box,
  TextField,
  useTheme,
} from '@mui/material';
import {
  use,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { type CaseDbCol } from '@gen-epix/api-casedb';
import type {
  TableColumn,
  TableRowParams,
} from '@gen-epix/ui';
import {
  createTableStore,
  Table,
  TableStoreContextProvider,
  TableUtil,
  useInitializeTableStore,
} from '@gen-epix/ui';

import { CaseUtil } from '../../../utils/CaseUtil';
import { EpiUploadStoreContext } from '../../../stores/epiUploadStore';
import type { CaseUploadResultWithGeneratedId } from '../../../models/epi';
import { EpiUploadUtil } from '../../../utils/EpiUploadUtil';

import { EpiUploadNavigation } from './EpiUploadNavigation';

export const EpiUploadMapSequences = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  const store = use(EpiUploadStoreContext);
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

  const epiUploadSequenceMappingRef = useRef(store.getState().sequenceMapping);

  const onProceedButtonClick = useCallback(async () => {
    setSequenceMapping(epiUploadSequenceMappingRef.current);
    await goToNextStep();
  }, [setSequenceMapping, goToNextStep]);

  const onGoBackButtonClick = useCallback(() => {
    goToPreviousStep();
  }, [goToPreviousStep]);

  const updateAlert = useCallback(() => {
    // Note: This is done via DOM manipulation to prevent excessive re-renders of the entire table

    const alertTitleElement = document.getElementById(alertTitleId);
    const alertContentElement = document.getElementById(alertContentId);
    if (!alertTitleElement || !alertContentElement) {
      return;
    }
    const {
      mappedFiles,
      numberOfFilesToMap,
      unmappedFileNames,
    } = EpiUploadUtil.getSequenceMappingStats(epiUploadSequenceMappingRef.current, sequenceFilesDataTransfer);

    alertTitleElement.innerHTML = numberOfFilesToMap === mappedFiles.length ? t('All {{numberOfFilesToMap}} files are mapped', { numberOfFilesToMap }) : t('{{mappedFilesLength}} of {{numberOfFilesToMap}} files mapped', { mappedFilesLength: mappedFiles.length, numberOfFilesToMap });
    alertContentElement.innerHTML = numberOfFilesToMap === mappedFiles.length ? '' : t('Unmapped files: {{unmappedFileNames}}', { unmappedFileNames: unmappedFileNames.join(', ') });
  }, [alertContentId, alertTitleId, sequenceFilesDataTransfer, t]);

  useEffect(() => {
    updateAlert();
  }, [updateAlert]);

  const tableStore = useMemo(() => createTableStore<CaseUploadResultWithGeneratedId>({
    idSelectorCallback: (row) => row.generatedId,
  }), []);

  const caseHasColumnContent = useCallback((rows: CaseUploadResultWithGeneratedId[], col: CaseDbCol): boolean => {
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

  const createDropDown = useCallback((kwArgs: { dropDownOptions: string[]; dropDownValue: string; label: string; onChange: (newValue: string) => void }) => {
    const { dropDownOptions, dropDownValue, label, onChange } = kwArgs;

    return (
      <Autocomplete
        freeSolo
        fullWidth
        // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
        onChange={(_, newValue) => {
          onChange(newValue);
          setSequenceMapping(epiUploadSequenceMappingRef.current);
          updateAlert();
        }}
        options={dropDownOptions}
        // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            size={'small'}
          />
        )}
        sx={{
          lineHeight: 'initial',
        }}
        value={dropDownValue}
      />
    );
  }, [setSequenceMapping, updateAlert]);

  const renderSequenceCell = useCallback((tableRowParams: TableRowParams<CaseUploadResultWithGeneratedId>) => {
    const col = completeCaseType.cols[tableRowParams.id];

    const id = tableRowParams.row.generatedId;
    const dropDownValue = epiUploadSequenceMappingRef.current?.[tableRowParams.row.generatedId]?.sequenceFileNames[col.id] || '';
    const onChange = (newValue: string) => {
      if (!newValue) {
        delete epiUploadSequenceMappingRef.current?.[id]?.sequenceFileNames[col.id];
      } else {
        epiUploadSequenceMappingRef.current[id].sequenceFileNames[col.id] = newValue;
      }
    };

    return (
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          justifyContent: 'center',
        }}
      >
        {createDropDown({
          dropDownOptions: sequenceDropDownOptions,
          dropDownValue,
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
    const dropDownValueFwd = epiUploadSequenceMappingRef.current?.[tableRowParams.row.generatedId]?.readsFileNames?.[col.id]?.fwd || '';
    const dropDownValueRev = epiUploadSequenceMappingRef.current?.[tableRowParams.row.generatedId]?.readsFileNames?.[col.id]?.rev || '';
    const onChangeFwd = (newValue: string) => {
      if (!newValue) {
        delete epiUploadSequenceMappingRef.current?.[id]?.readsFileNames?.[col.id]?.fwd;
      } else {
        epiUploadSequenceMappingRef.current[id].readsFileNames[col.id].fwd = newValue;
      }
    };
    const onChangeRev = (newValue: string) => {
      if (!newValue) {
        delete epiUploadSequenceMappingRef.current?.[id]?.readsFileNames?.[col.id]?.rev;
      } else {
        epiUploadSequenceMappingRef.current[id].readsFileNames[col.id].rev = newValue;
      }
    };

    return (
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          flexDirection: 'row',
          gap: 1,
          height: '100%',
          justifyContent: 'center',
        }}
      >
        {createDropDown({
          dropDownOptions: isSequenceColumn ? sequenceDropDownOptions : readsDropDownOptions,
          dropDownValue: dropDownValueFwd,
          label: `${col.label} FWD`,
          onChange: onChangeFwd,
        })}
        {createDropDown({
          dropDownOptions: isSequenceColumn ? sequenceDropDownOptions : readsDropDownOptions,
          dropDownValue: dropDownValueRev,
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
        headerName: sampleIdCol.label,
        hideInFilter: true,
        id: sampleIdCol.id,
        isInitiallyVisible: true,
        type: 'text',
        valueGetter: (params) => CaseUtil.getRowValue(params.row.validated_content, sampleIdCol, completeCaseType).short,
        widthPx: 300,
      });
    }

    completeCaseTypeColStats.sequenceColumns.forEach((col) => {
      tableCols.push({
        cellTitleGetter: () => null,
        headerName: col.label,
        hideInFilter: true,
        id: col.id,
        isInitiallyVisible: true,
        renderCell: renderSequenceCell,
        type: 'text',
        valueGetter: (params) => CaseUtil.getRowValue(params.row.validated_content, col, completeCaseType).short,
        widthPx: 400,
      });
    });

    completeCaseTypeColStats.readsColumns.forEach((col) => {
      tableCols.push({
        cellTitleGetter: () => null,
        headerName: col.label,
        hideInFilter: true,
        id: col.id,
        isInitiallyVisible: true,
        renderCell: renderReadsCell,
        type: 'text',
        valueGetter: (params) => CaseUtil.getRowValue(params.row.validated_content, col, completeCaseType).short,
        widthPx: 800,
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
          headerName: col.code,
          hideInFilter: true,
          id: col.id,
          isInitiallyVisible: true,
          type: 'text',
          valueGetter: (params) => CaseUtil.getRowValue(params.row.validated_content, col, completeCaseType).short,
          widthPx: 250,
        } satisfies TableColumn<CaseUploadResultWithGeneratedId>);
      }
    });

    return tableCols;
  }, [caseHasColumnContent, completeCaseType, completeCaseTypeColStats.readsColumns, completeCaseTypeColStats.sampleIdColumns, completeCaseTypeColStats.sequenceColumns, renderReadsCell, renderSequenceCell, sampleIdColId, validatedCases, validatedCasesWithGeneratedId]);

  useInitializeTableStore<CaseUploadResultWithGeneratedId>({ columns: tableColumns, createFiltersFromColumns: true, rows: validatedCasesWithGeneratedId, store: tableStore });

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateRows: 'max-content auto max-content',
        height: '100%',
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
          font={theme['gen-epix-ui-casedb'].lineList.font}
          rowHeight={7}
        />
        <EpiUploadNavigation
          onGoBackButtonClick={onGoBackButtonClick}
          onProceedButtonClick={onProceedButtonClick}
        />
      </TableStoreContextProvider>
    </Box>
  );
};
