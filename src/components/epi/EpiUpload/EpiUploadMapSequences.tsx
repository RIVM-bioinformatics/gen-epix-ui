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
  const validatedCasesWithGeneratedId = useStore(store, (state) => state.validatedCasesWithGeneratedId);
  const validatedCases = useStore(store, (state) => state.validatedCases);
  const setSequenceMapping = useStore(store, (state) => state.setSequenceMapping);

  const completeCaseTypeColumnStats = useMemo(() => {
    return EpiUploadUtil.getCompleteCaseTypeColumnStats(completeCaseType);
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

  const tableStore = useMemo(() => createTableStore<EpiValidatedCaseWithGeneratedId>({
    idSelectorCallback: (row) => row.generated_id,
  }), []);

  const caseHasColumnContent = useCallback((rows: EpiValidatedCaseWithGeneratedId[], caseTypeCol: CaseTypeCol): boolean => {
    return rows.some((row) => {
      const value = EpiCaseUtil.getRowValue(row.case as Case, caseTypeCol, completeCaseType);
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

  const renderSequenceCell = useCallback((tableRowParams: TableRowParams<EpiValidatedCaseWithGeneratedId>) => {
    const caseTypeCol = completeCaseType.case_type_cols[tableRowParams.id];

    const id = tableRowParams.row.generated_id;
    const dropDownValue = epiUploadSequenceMapping.current?.[tableRowParams.row.generated_id]?.sequenceFileNames[caseTypeCol.id] || '';
    const onChange = (newValue: string) => {
      if (!newValue) {
        delete epiUploadSequenceMapping.current?.[id]?.sequenceFileNames[caseTypeCol.id];
      } else {
        epiUploadSequenceMapping.current[id].sequenceFileNames[caseTypeCol.id] = newValue;
      }
    };

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
        {createDropDown({
          dropDownValue,
          dropDownOptions: sequenceDropDownOptions,
          label: caseTypeCol.label,
          onChange,
        })}
      </Box>
    );
  }, [completeCaseType, createDropDown, sequenceDropDownOptions]);


  const renderReadsCell = useCallback((tableRowParams: TableRowParams<EpiValidatedCaseWithGeneratedId>) => {
    const caseTypeCol = completeCaseType.case_type_cols[tableRowParams.id];
    const isSequenceColumn = completeCaseTypeColumnStats.sequenceColumns.includes(caseTypeCol);

    const id = tableRowParams.row.generated_id;
    const dropDownValueFwd = epiUploadSequenceMapping.current?.[tableRowParams.row.generated_id]?.readsFileNames?.[caseTypeCol.id]?.fwd || '';
    const dropDownValueRev = epiUploadSequenceMapping.current?.[tableRowParams.row.generated_id]?.readsFileNames?.[caseTypeCol.id]?.rev || '';
    const onChangeFwd = (newValue: string) => {
      if (!newValue) {
        delete epiUploadSequenceMapping.current?.[id]?.readsFileNames?.[caseTypeCol.id]?.fwd;
      } else {
        epiUploadSequenceMapping.current[id].readsFileNames[caseTypeCol.id].fwd = newValue;
      }
    };
    const onChangeRev = (newValue: string) => {
      if (!newValue) {
        delete epiUploadSequenceMapping.current?.[id]?.readsFileNames?.[caseTypeCol.id]?.rev;
      } else {
        epiUploadSequenceMapping.current[id].readsFileNames[caseTypeCol.id].rev = newValue;
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
        }}
        height={'100%'}
      >
        {createDropDown({
          dropDownValue: dropDownValueFwd,
          dropDownOptions: isSequenceColumn ? sequenceDropDownOptions : readsDropDownOptions,
          label: `${caseTypeCol.label} FWD`,
          onChange: onChangeFwd,
        })}
        {createDropDown({
          dropDownValue: dropDownValueRev,
          dropDownOptions: isSequenceColumn ? sequenceDropDownOptions : readsDropDownOptions,
          label: `${caseTypeCol.label} REV`,
          onChange: onChangeRev,
        })}
      </Box>
    );
  }, [completeCaseType, completeCaseTypeColumnStats.sequenceColumns, createDropDown, sequenceDropDownOptions, readsDropDownOptions]);


  const tableColumns = useMemo<TableColumn<EpiValidatedCaseWithGeneratedId>[]>(() => {
    const tableCols: TableColumn<EpiValidatedCaseWithGeneratedId>[] = [];
    tableCols.push(
      TableUtil.createReadableIndexColumn(),
    );

    const columnsUsedForMapping = [
      ...completeCaseTypeColumnStats.idColumns,
      ...completeCaseTypeColumnStats.sequenceColumns,
      ...completeCaseTypeColumnStats.readsColumns,
    ];

    completeCaseTypeColumnStats.idColumns.forEach((caseTypeCol) => {
      if (!caseHasColumnContent(validatedCasesWithGeneratedId, caseTypeCol)) {
        return;
      }
      tableCols.push({
        type: 'text',
        isInitiallyVisible: true,
        hideInFilter: true,
        id: caseTypeCol.id,
        headerName: caseTypeCol.label,
        widthPx: 300,
        valueGetter: (params) => EpiCaseUtil.getRowValue(params.row.case as Case, caseTypeCol, completeCaseType).short,
      });
    });

    completeCaseTypeColumnStats.sequenceColumns.forEach((caseTypeCol) => {
      tableCols.push({
        type: 'text',
        isInitiallyVisible: true,
        hideInFilter: true,
        id: caseTypeCol.id,
        headerName: caseTypeCol.label,
        widthPx: 400,
        renderCell: renderSequenceCell,
        valueGetter: (params) => EpiCaseUtil.getRowValue(params.row.case as Case, caseTypeCol, completeCaseType).short,
        cellTitleGetter: () => null,
      });
    });

    completeCaseTypeColumnStats.readsColumns.forEach((caseTypeCol) => {
      tableCols.push({
        type: 'text',
        isInitiallyVisible: true,
        hideInFilter: true,
        id: caseTypeCol.id,
        headerName: caseTypeCol.label,
        widthPx: 800,
        renderCell: renderReadsCell,
        valueGetter: (params) => EpiCaseUtil.getRowValue(params.row.case as Case, caseTypeCol, completeCaseType).short,
        cellTitleGetter: () => null,
      });
    });

    const uniqueCaseTypeColIds: Set<string> = new Set();
    validatedCases.forEach((vc) => {
      Object.keys(vc.case.content || {}).forEach((colId) => uniqueCaseTypeColIds.add(colId));
    });

    completeCaseType.ordered_case_type_col_ids.forEach((caseTypeColId) => {
      if (!uniqueCaseTypeColIds.has(caseTypeColId) || columnsUsedForMapping.find(c => c.id === caseTypeColId)) {
        return;
      }
      const caseTypeCol = completeCaseType.case_type_cols[caseTypeColId];
      if (caseTypeCol) {
        tableCols.push({
          type: 'text',
          isInitiallyVisible: true,
          hideInFilter: true,
          id: caseTypeCol.id,
          headerName: caseTypeCol.code,
          widthPx: 250,
          valueGetter: (params) => EpiCaseUtil.getRowValue(params.row.case as Case, caseTypeCol, completeCaseType).short,
        } satisfies TableColumn<EpiValidatedCaseWithGeneratedId>);
      }
    });

    return tableCols;
  }, [caseHasColumnContent, completeCaseType, completeCaseTypeColumnStats.idColumns, completeCaseTypeColumnStats.readsColumns, completeCaseTypeColumnStats.sequenceColumns, renderReadsCell, renderSequenceCell, validatedCases, validatedCasesWithGeneratedId]);

  useInitializeTableStore<EpiValidatedCaseWithGeneratedId>({ store: tableStore, columns: tableColumns, rows: validatedCasesWithGeneratedId, createFiltersFromColumns: true });

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
