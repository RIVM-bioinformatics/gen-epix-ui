import readXlsxFile, { readSheetNames } from 'read-excel-file';
import { parse } from 'csv/browser/esm/sync';
import type {
  ObjectSchema,
  AnyObject,
} from 'yup';
import {
  lazy,
  object,
  string,
} from 'yup';
import { t } from 'i18next';
import difference from 'lodash/difference';
import uniq from 'lodash/uniq';
import { format } from 'date-fns';

import type {
  CaseTypeCol,
  CaseType,
  CompleteCaseType,
  CaseUploadResult,
} from '../../api';
import {
  FORM_FIELD_DEFINITION_TYPE,
  type AutoCompleteOption,
  type FormFieldDefinition,
} from '../../models/form';
import {
  CaseApi,
  ColType,
} from '../../api';
import type {
  EpiUploadMappedColumn,
  EpiUploadMappedColumnsFormFields,
  EpiUploadCompleteCaseTypeColumnStats,
  EpiUploadSequenceMapping,
  CaseUploadResultWithGeneratedId,
  EpiUploadSequenceMappingForCaseId,
} from '../../models/epiUpload';
import { EPI_UPLOAD_ACTION } from '../../models/epiUpload';
import { EpiCaseTypeUtil } from '../EpiCaseTypeUtil';
import { EpiCaseUtil } from '../EpiCaseUtil';
import { DATE_FORMAT } from '../../data/date';
import { QueryUtil } from '../QueryUtil';
import { QUERY_KEY } from '../../models/query';

export class EpiUploadUtil {
  public static readonly caseIdColumnAliases = ['_case_id', 'case id', 'case_id', 'caseid', 'case.id'];
  public static readonly caseDateColumnAliases = ['_case_date', 'case date', 'case_date', 'casedate', 'case.date'];
  public static readonly caseTypeColumnAliases = ['_case_type', 'case type', 'case_type', 'casetype', 'case.type'];

  public static isXlsxFile(fileName: string): boolean {
    return fileName?.toLowerCase()?.endsWith('.xlsx');
  }

  public static isTextFile(fileName: string): boolean {
    const lowerName = fileName?.toLowerCase();
    return lowerName?.endsWith('.csv') || lowerName?.endsWith('.tsv') || lowerName?.endsWith('.txt');
  }

  public static async getSheetNameOptions(fileList: FileList): Promise<AutoCompleteOption<string>[]> {
    const file = fileList[0];
    const fileName = file.name.toLowerCase();

    if (EpiUploadUtil.isXlsxFile(fileName)) {
      return (await readSheetNames(file)).map(name => ({ label: name, value: name }));
    }
    return [];
  }

  public static async readRawData(fileList: FileList, sheet?: string): Promise<string[][]> {
    const file = fileList[0];
    const fileName = file.name.toLowerCase();
    let result: string[][] = [];

    if (EpiUploadUtil.isTextFile(fileName)) {
      // Parse CSV file
      let text = await file.text();
      if (fileName.endsWith('.tsv')) {
        // Convert TSV to CSV by replacing tabs with commas
        text = text.replace(/\t/g, ',');
      }
      if (fileName.endsWith('.txt')) {
        // Attempt to auto-detect delimiter (comma, tab, semicolon)
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length > 0) {
          const delimiters = [',', '\t', ';'];
          let bestDelimiter = ',';
          let maxFields = 0;
          delimiters.forEach(delimiter => {
            const fieldsCount = lines[0].split(delimiter).length;
            if (fieldsCount > maxFields) {
              maxFields = fieldsCount;
              bestDelimiter = delimiter;
            }
          });
          if (bestDelimiter !== ',') {
            const regex = new RegExp(bestDelimiter.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
            text = text.replace(regex, ',');
          }
        }
      }
      result = parse(text, {
        columns: false, // Keep as array of arrays
        skip_empty_lines: true,
        trim: true,
      });
    } else if (EpiUploadUtil.isXlsxFile(fileName)) {
      // Parse Excel file
      const excelData = await readXlsxFile(file, {
        sheet,
        trim: true,
      });
      result = excelData.map(row => row.map(cell => {
        if (cell instanceof Date) {
          return format(cell, DATE_FORMAT.DATE);
        }
        return cell?.toString() ?? undefined;
      }));
    } else {
      throw new Error('Unsupported file format. Please select a CSV or Excel file.');
    }
    if (result.length < 2 || result[0].length < 2) {
      throw new Error('The selected file does not contain enough data. Please ensure it has at least a header row and one data row.');
    }
    return result;
  }

  public static getSampleIdCaseTypeColIds(completeCaseType: CompleteCaseType): string[] {
    const caseTypeColsIds: string[] = [];
    Object.values(Object.keys(completeCaseType.case_type_cols)).forEach(caseTypeColId => {
      const caseTypeCol = completeCaseType.case_type_cols[caseTypeColId];
      const col = completeCaseType.cols[caseTypeCol.col_id];
      if (col?.col_type === ColType.ID_SAMPLE) {
        caseTypeColsIds.push(caseTypeCol.id);
      }
    });
    return caseTypeColsIds;
  }


  public static matchColumnLabel(columnLabel: string, caseTypeCol: CaseTypeCol): boolean {
    if (!columnLabel || typeof columnLabel !== 'string') {
      return false;
    }
    const labelLowerCase = columnLabel.toLocaleLowerCase();
    return labelLowerCase === caseTypeCol.label.toLocaleLowerCase() || labelLowerCase === caseTypeCol.code.toLowerCase() || labelLowerCase === caseTypeCol.id.toLocaleLowerCase();
  }

  public static getCaseTypeFromColumnLabels(caseTypeCols: CaseTypeCol[], columnLabels: string[]): CaseType {
    const bestMatch = {
      caseType: null as CaseType,
      matchCount: 0,
    };

    // Group case type columns by case type ID to count matches per case type
    const caseTypeMatches = new Map<string, { caseType: CaseType; matchCount: number }>();

    caseTypeCols.forEach(caseTypeCol => {
      const matchCount = columnLabels.filter(label =>
        this.matchColumnLabel(label, caseTypeCol)).length;

      if (matchCount > 0) {
        const caseTypeId = caseTypeCol.case_type_id;
        const existing = caseTypeMatches.get(caseTypeId);

        if (existing) {
          existing.matchCount += matchCount;
        } else {
          // Note: We don't have access to the full CaseType object here,
          // so we create a minimal one with the ID. In a real implementation,
          // you might need to pass the complete case type data or modify the method signature.
          caseTypeMatches.set(caseTypeId, {
            caseType: { id: caseTypeId } as CaseType,
            matchCount,
          });
        }
      }
    });

    // Find the case type with the highest match count
    caseTypeMatches.forEach(match => {
      if (match.matchCount > bestMatch.matchCount) {
        bestMatch.caseType = match.caseType;
        bestMatch.matchCount = match.matchCount;
      }
    });

    return bestMatch.caseType;
  }

  public static isCaseIdColumn(label: string): boolean {
    return this.caseIdColumnAliases.includes(label.toLocaleLowerCase());
  }

  public static isCaseTypeColumn(label: string): boolean {
    return this.caseTypeColumnAliases.includes(label.toLocaleLowerCase());
  }

  public static isCaseDateColumn(label: string): boolean {
    return this.caseDateColumnAliases.includes(label.toLocaleLowerCase());
  }

  public static getInitialMappedColumns(completeCaseType: CompleteCaseType, rawData: string[][], importAction: EPI_UPLOAD_ACTION): EpiUploadMappedColumn[] {
    if (rawData.length === 0) {
      return [];
    }
    const writableColIds = EpiCaseTypeUtil.getWritableCaseTypeColIds(completeCaseType);
    const filteredCaseTypeCols = EpiCaseTypeUtil.getWritableImportExportCaseTypeColIds(completeCaseType).map(id => completeCaseType.case_type_cols[id]);
    const sampleIdCaseTypeColIds = EpiUploadUtil.getSampleIdCaseTypeColIds(completeCaseType);
    const mappedColumns = rawData[0].map((label, index) => {
      const isCaseIdColumn = importAction === EPI_UPLOAD_ACTION.UPDATE && EpiUploadUtil.isCaseIdColumn(label);
      const isCaseTypeColumn = EpiUploadUtil.isCaseTypeColumn(label);

      let caseTypeCol: CaseTypeCol = null;
      let isSampleIdColumn = false;

      if (!isCaseIdColumn && !isCaseTypeColumn) {
        caseTypeCol = filteredCaseTypeCols.find(c => EpiUploadUtil.matchColumnLabel(label, c)) || null;
        if (caseTypeCol && importAction === EPI_UPLOAD_ACTION.UPDATE && !writableColIds.includes(caseTypeCol.id)) {
          caseTypeCol = null;
        }
        isSampleIdColumn = caseTypeCol ? sampleIdCaseTypeColIds.includes(caseTypeCol.id) : false;
      }

      return {
        originalIndex: index,
        originalLabel: label,
        caseTypeCol,
        isCaseIdColumn,
        isCaseTypeColumn,
        isSampleIdColumn,
        sampleIdentifierIssuerId: null,
      } satisfies EpiUploadMappedColumn;
    });

    return mappedColumns.filter(mc => {
      return mc.isCaseIdColumn || mc.caseTypeCol;
    });
  }

  public static getMappedColumnsFromFormData(data: EpiUploadMappedColumnsFormFields, rawData: string[][], caseTypeColMap: Map<string, CaseTypeCol>, completeCaseType: CompleteCaseType): EpiUploadMappedColumn[] {
    const mappedColumns: EpiUploadMappedColumn[] = [];
    const sampleIdCaseTypeColIds = EpiUploadUtil.getSampleIdCaseTypeColIds(completeCaseType);
    Object.entries(data).forEach(([originalIndexString, formValue]) => {
      if (!formValue) {
        return;
      }
      const originalIndex = parseInt(originalIndexString, 10);
      const isCaseIdColumn = formValue === 'case_id';
      let caseTypeCol: CaseTypeCol = null;
      if (!isCaseIdColumn) {
        caseTypeCol = caseTypeColMap.get(formValue) || null;
      }
      let sampleIdentifierIssuerId: string = null;
      const isSampleIdColumn = caseTypeCol ? sampleIdCaseTypeColIds.includes(caseTypeCol.id) : false;
      if (isSampleIdColumn) {
        sampleIdentifierIssuerId = data[formValue] || null;
      }
      mappedColumns.push({
        isCaseIdColumn,
        isSampleIdColumn,
        caseTypeCol,
        originalIndex,
        originalLabel: rawData[0][originalIndex] || '',
        sampleIdentifierIssuerId,
      } satisfies EpiUploadMappedColumn);
    });
    return mappedColumns;
  }

  public static areMappedColumnsEqual(a: EpiUploadMappedColumn[], b: EpiUploadMappedColumn[]): boolean {
    if (a.length !== b.length) {
      return false;
    }

    return a.every((itemA, index) => {
      const itemB = b[index];
      const stringifiedA = `${itemA.originalIndex}-${itemA.originalLabel}`;
      const stringifiedB = `${itemB.originalIndex}-${itemB.originalLabel}`;
      return stringifiedA === stringifiedB;
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  public static getColumnMappingSchema(rawData: string[][], completeCaseType: CompleteCaseType, importAction: EPI_UPLOAD_ACTION): ObjectSchema<{}, AnyObject, {}, ''> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fields: { [key: string]: any } = {};
    const fieldNames: string[] = rawData[0].map((_, index) => index.toString());
    const sampleIdCaseTypeColIds = EpiUploadUtil.getSampleIdCaseTypeColIds(completeCaseType);

    sampleIdCaseTypeColIds.forEach((caseTypeColId) => {
      fields[caseTypeColId] = lazy(() => string().nullable().when(fieldNames, (otherFieldValues, schema) => {
        return schema.test('needs-identifier-issuer', t('An identifier issuer must be selected.'), (fieldValue) => {
          const allFieldValues = [...otherFieldValues as string[], fieldValue];
          if (allFieldValues.includes(caseTypeColId)) {
            return !!fieldValue;
          }
          return true;
        });
      }));
    });

    fieldNames.forEach((fieldName) => {
      const otherFieldNames = fieldNames.filter(name => name !== fieldName);
      fields[fieldName] = lazy(() => string().nullable().when(otherFieldNames, (otherFieldValues, schema) => {
        return schema
          .test('unique', t('This column has already been mapped to another field.'), (fieldValue) => {
            return !fieldValue || !otherFieldValues.includes(fieldValue);
          })
          .test('needs-id-column', t('At least one column should be mapped to the case id column.'), (fieldValue) => {
            if (importAction !== EPI_UPLOAD_ACTION.UPDATE) {
              return true;
            }
            const allFieldValues = [...otherFieldValues as string[], fieldValue];
            return allFieldValues.includes('case_id');
          });
      }));
    });

    return object().shape(fields);
  }

  public static getColumnMappingFormFieldDefinitions(completeCaseType: CompleteCaseType, rawDataHeaders: string[], _fileName: string, importAction: EPI_UPLOAD_ACTION): FormFieldDefinition<EpiUploadMappedColumnsFormFields>[] {
    const fields: FormFieldDefinition<EpiUploadMappedColumnsFormFields>[] = [];
    const options: AutoCompleteOption<string>[] = [];

    if (importAction === EPI_UPLOAD_ACTION.UPDATE) {
      options.push({
        label: 'Case ID',
        value: 'case_id',
      });
    }

    const allowedCaseTypeColIds = EpiCaseTypeUtil.getWritableImportExportCaseTypeColIds(completeCaseType);
    completeCaseType.ordered_case_type_col_ids.filter(x => allowedCaseTypeColIds.includes(x)).forEach((caseTypeColId) => {
      const caseTypeCol = completeCaseType.case_type_cols[caseTypeColId];

      options.push({
        label: caseTypeCol.label,
        value: caseTypeCol.id,
      });
    });

    rawDataHeaders.forEach((header, index) => {
      fields.push({
        definition: FORM_FIELD_DEFINITION_TYPE.SELECT,
        name: index.toString(),
        label: header,
        options,
      });
    });

    return fields;
  }

  public static getDefaultColumnMappingFormValues(rawDataHeaders: string[], mappedColumns: EpiUploadMappedColumn[], importAction: EPI_UPLOAD_ACTION): EpiUploadMappedColumnsFormFields {
    const defaultFormValues: EpiUploadMappedColumnsFormFields = Object.fromEntries(Object.keys(rawDataHeaders).map<[string, null]>(x => [x.toString(), null]));
    const caseIdColumn = mappedColumns.find(col => col.isCaseIdColumn);

    if (caseIdColumn && importAction === EPI_UPLOAD_ACTION.UPDATE) {
      defaultFormValues[caseIdColumn.originalIndex.toString()] = 'case_id';
    }

    mappedColumns.forEach((mappedColumn) => {
      if (mappedColumn.caseTypeCol) {
        defaultFormValues[mappedColumn.originalIndex.toString()] = mappedColumn.caseTypeCol.id;
        if (mappedColumn.isSampleIdColumn) {
          defaultFormValues[mappedColumn.caseTypeCol.id] = mappedColumn.sampleIdentifierIssuerId || null;
        }
      }
    });
    return defaultFormValues;
  }

  public static isGenomeFile(fileName: string): boolean {
    const lowerName = fileName.toLowerCase();
    return lowerName.endsWith('.fa') ||
      lowerName.endsWith('.fasta') ||
      lowerName.endsWith('.fa.gz') ||
      lowerName.endsWith('.fasta.gz');
  }

  public static isReadsFile(fileName: string): boolean {
    const lowerName = fileName.toLowerCase();
    return lowerName.endsWith('.fq') ||
      lowerName.endsWith('.fastq') ||
      lowerName.endsWith('.fq.gz') ||
      lowerName.endsWith('.fastq.gz');
  }

  public static isSupportedGeneticFile(fileName: string): boolean {
    return EpiUploadUtil.isGenomeFile(fileName) || EpiUploadUtil.isReadsFile(fileName);
  }


  public static getCompleteCaseTypeColumnStats(completeCaseType: CompleteCaseType): EpiUploadCompleteCaseTypeColumnStats {
    const idColumns = EpiCaseTypeUtil.getCaseTypeColsByType(completeCaseType, [ColType.ID_SAMPLE]);
    const sequenceColumns = EpiCaseTypeUtil.getCaseTypeColsByType(completeCaseType, [ColType.GENETIC_SEQUENCE]);
    const readsColumns = EpiCaseTypeUtil.getCaseTypeColsByType(completeCaseType, [ColType.GENETIC_READS]);
    const writableColumns = Object.values(completeCaseType.case_type_cols).filter(col => EpiCaseTypeUtil.getWritableCaseTypeColIds(completeCaseType).includes(col.id));

    return { idColumns, sequenceColumns, readsColumns, writableColumns };
  }

  private static idToRegex(id: string): RegExp {
    // Create regex that matches the id somewhere in a string
    return new RegExp(id.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'));
  }

  public static getEpiUploadSequenceMapping(completeCaseType: CompleteCaseType, validatedCases: CaseUploadResultWithGeneratedId[], sequenceFilesDataTransfer: DataTransfer): EpiUploadSequenceMapping {
    const stats = EpiUploadUtil.getCompleteCaseTypeColumnStats(completeCaseType);
    const result: EpiUploadSequenceMapping = {};

    validatedCases.forEach((vc) => {
      const caseSequenceMapping: EpiUploadSequenceMappingForCaseId = {
        sequenceFileNames: {},
        readsFileNames: {},
      };

      // modify by reference
      result[vc.generated_id] = caseSequenceMapping;

      if (stats.sequenceColumns.length !== 1 && stats.readsColumns.length !== 1) {
        return;
      }

      const idColumnIds: string[] = [];
      stats.idColumns.forEach((idCol) => {
        const rowValue = EpiCaseUtil.getRowValue(vc.validated_content, idCol, completeCaseType);
        if (rowValue && !rowValue.isMissing) {
          idColumnIds.push(rowValue.raw);
        }
      });
      if (!idColumnIds.length) {
        return;
      }

      stats.sequenceColumns.forEach((seqCol) => {
        caseSequenceMapping.sequenceFileNames[seqCol.id] = '';
      });
      stats.readsColumns.forEach((readCol) => {
        caseSequenceMapping.readsFileNames[readCol.id] = {
          fwd: '',
          rev: '',
        };
      });

      const sequenceFiles: string[] = [];
      const readsFiles: string[] = [];
      Array.from(sequenceFilesDataTransfer.files).forEach((file) => {
        const fileName = file.name;
        const lowerName = fileName.toLowerCase();
        const matchesId = idColumnIds.some((id) => lowerName.match(EpiUploadUtil.idToRegex(id.toLowerCase())));
        if (matchesId) {
          if (EpiUploadUtil.isGenomeFile(fileName)) {
            sequenceFiles.push(fileName);
          } else if (EpiUploadUtil.isReadsFile(fileName)) {
            readsFiles.push(fileName);
          }
        }
      });

      if (stats.sequenceColumns.length === 1 && sequenceFiles.length === 1) {
        caseSequenceMapping.sequenceFileNames[stats.sequenceColumns[0].id] = sequenceFiles[0];
      }
      if (stats.readsColumns.length === 1) {
        if (readsFiles.length === 1) {
          caseSequenceMapping.readsFileNames[stats.readsColumns[0].id].fwd = readsFiles[0];
        }
        if (readsFiles.length === 2) {
          const sortedReadsFiles = readsFiles.sort((a, b) => a.localeCompare(b));
          caseSequenceMapping.readsFileNames[stats.readsColumns[0].id].fwd = sortedReadsFiles[0];
          caseSequenceMapping.readsFileNames[stats.readsColumns[0].id].rev = sortedReadsFiles[1];
        }
      }
    });
    return result;
  }

  public static getSequenceMappingStats(sequenceMapping: EpiUploadSequenceMapping, sequenceFilesDataTransfer: DataTransfer): {
    numberOfFilesToMap: number;
    mappedFiles: string[];
    mappedSequenceFiles: string[];
    mappedReadsFiles: string[];
    unmappedFileNames: string[];
    unmappedSequenceFiles: string[];
    unmappedReadsFiles: string[];
    readsFileSize: number;
    sequencesFileSize: number;
    mappedFileSize: number;
  } {
    const sequenceFiles = Array.from(sequenceFilesDataTransfer.files).map(file => file.name).filter(fileName => EpiUploadUtil.isGenomeFile(fileName));
    const readsFiles = Array.from(sequenceFilesDataTransfer.files).map(file => file.name).filter(fileName => EpiUploadUtil.isReadsFile(fileName));
    const files = [...sequenceFiles, ...readsFiles];
    const numberOfFilesToMap = files.length;

    const mappedSequenceFiles = uniq(Object.values(sequenceMapping).flatMap(mapping => Object.values(mapping.sequenceFileNames)).filter(x => x));
    const mappedReadsFiles = uniq(Object.values(sequenceMapping).flatMap(mapping => Object.values(mapping.readsFileNames).flatMap(reads => [reads.fwd, reads.rev])).filter(x => x));
    const mappedFiles = [...mappedSequenceFiles, ...mappedReadsFiles];

    const unmappedSequenceFiles = difference(sequenceFiles, mappedSequenceFiles);
    const unmappedReadsFiles = difference(readsFiles, mappedReadsFiles);
    const unmappedFileNames = difference(files, mappedFiles);

    const readsFileSize = Array.from(sequenceFilesDataTransfer.files)
      .filter(file => mappedReadsFiles.includes(file.name))
      .reduce((acc, file) => acc + file.size, 0);
    const sequencesFileSize = Array.from(sequenceFilesDataTransfer.files)
      .filter(file => mappedSequenceFiles.includes(file.name))
      .reduce((acc, file) => acc + file.size, 0);
    const mappedFileSize = readsFileSize + sequencesFileSize;

    return {
      readsFileSize,
      sequencesFileSize,
      mappedFileSize,
      numberOfFilesToMap,
      mappedFiles,
      mappedSequenceFiles,
      mappedReadsFiles,
      unmappedFileNames,
      unmappedSequenceFiles,
      unmappedReadsFiles,
    };
  }

  public static async readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1]; // Remove data:*/*;base64, prefix
        resolve(base64);
      };
      reader.onerror = (_) => {
        reject(Error('File read error'));
      };
      reader.readAsDataURL(file);
    });
  }

  public static async createCasesAndUploadFiles(kwArgs: {
    caseTypeId: string;
    createdInDataCollectionId: string;
    importAction: EPI_UPLOAD_ACTION;
    sequencingProtocolId: string;
    assemblyProtocolId: string;
    mappedFileSize: number;
    sequenceFilesDataTransfer: DataTransfer;
    sequenceMapping: EpiUploadSequenceMapping;
    onProgress: (progress: number, message: string) => void;
    onComplete: () => void;
    onError: (error: Error) => void;
    signal: AbortSignal;
    validatedCases: CaseUploadResult[];
    validatedCasesWithGeneratedId: CaseUploadResultWithGeneratedId[];
  }): Promise<void> {
    const {
      caseTypeId,
      createdInDataCollectionId,
      importAction,
      mappedFileSize,
      sequenceFilesDataTransfer,
      assemblyProtocolId,
      sequencingProtocolId,
      sequenceMapping,
      onProgress,
      onComplete,
      onError,
      signal,
      validatedCases,
      validatedCasesWithGeneratedId,
    } = kwArgs;

    try {

      for (const [index, validatedCase] of validatedCases.entries()) {
        onProgress((100 / validatedCases.length) * index, t('Creating cases...'));
        await CaseApi.instance.createCases({
          case_type_id: caseTypeId,
          created_in_data_collection_id: createdInDataCollectionId,
          data_collection_ids: shareInDataCollectionIds,
          is_update: importAction === EPI_UPLOAD_ACTION.UPDATE,
          case_batch: {
            cases: [{
              ...validatedCase.case,
            }],
          },
        }, { signal });
      }

      await QueryUtil.invalidateQueryKeys(QueryUtil.getQueryKeyDependencies([QUERY_KEY.CASES], true));
      onProgress(100, t('Upload complete.'));
      onComplete();
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unknown error occurred during upload'));
      throw error;
    }
  }
  // public static async createCasesAndUploadFiles(kwArgs: {
  //   caseTypeId: string;
  //   createdInDataCollectionId: string;
  //   importAction: EPI_UPLOAD_ACTION;
  //   sequencingProtocolId: string;
  //   assemblyProtocolId: string;
  //   mappedFileSize: number;
  //   sequenceFilesDataTransfer: DataTransfer;
  //   sequenceMapping: EpiUploadSequenceMapping;
  //   onProgress: (progress: number, message: string) => void;
  //   onComplete: () => void;
  //   onError: (error: Error) => void;
  //   shareInDataCollectionIds: string[];
  //   signal: AbortSignal;
  //   validatedCases: CaseUploadResult[];
  //   validatedCasesWithGeneratedId: EpiValidatedCaseWithGeneratedId[];
  // }): Promise<void> {
  //   const {
  //     caseTypeId,
  //     createdInDataCollectionId,
  //     importAction,
  //     mappedFileSize,
  //     sequenceFilesDataTransfer,
  //     assemblyProtocolId,
  //     sequencingProtocolId,
  //     sequenceMapping,
  //     onProgress,
  //     onComplete,
  //     onError,
  //     shareInDataCollectionIds,
  //     signal,
  //     validatedCases,
  //     validatedCasesWithGeneratedId,
  //   } = kwArgs;

  //   try {
  //     onProgress(0, t('Creating cases...'));
  //     const createCasesResponse = await CaseApi.instance.createCases({
  //       case_type_id: caseTypeId,
  //       created_in_data_collection_id: createdInDataCollectionId,
  //       data_collection_ids: shareInDataCollectionIds,
  //       is_update: importAction === EPI_UPLOAD_ACTION.UPDATE,
  //       cases: validatedCases.map(c => c.case),
  //     }, { signal });

  //     onProgress(5, t('Preparing genetic data files...'));
  //     const caseIdMapping: { [generatedCaseId: string]: string } = {};
  //     for (let i = 0; i < validatedCasesWithGeneratedId.length; i++) {
  //       const validatedCase = validatedCasesWithGeneratedId[i];
  //       const createdCase = createCasesResponse.data[i];
  //       caseIdMapping[validatedCase.generated_id] = createdCase.id;
  //     }

  //     const seqForCases: Array<{ caseSeq: CaseSeq; file: File }> = [];
  //     const readSetsForCases: Array<{ caseReadSet: CaseReadSet; fwdFile: File; revFile: File }> = [];

  //     for (const [generatedCaseId, mapping] of Object.entries(sequenceMapping)) {
  //       for (const [columnId, fileName] of Object.entries(mapping.sequenceFileNames)) {
  //         const file = Array.from(sequenceFilesDataTransfer.files).find(f => f.name === fileName);
  //         if (file) {
  //           seqForCases.push({
  //             caseSeq: {
  //               case_id: caseIdMapping[generatedCaseId],
  //               case_type_col_id: columnId,
  //               seq: {
  //                 assembly_protocol_id: assemblyProtocolId,
  //                 sample_id: '', // !FIXME
  //               },
  //             },
  //             file,
  //           });
  //         }
  //       }
  //       for (const [columnId, fileNames] of Object.entries(mapping.readsFileNames)) {
  //         let fwdFile: File | undefined;
  //         let revFile: File | undefined;
  //         if (fileNames.fwd) {
  //           fwdFile = Array.from(sequenceFilesDataTransfer.files).find(f => f.name === fileNames.fwd);
  //         }
  //         if (fileNames.rev) {
  //           revFile = Array.from(sequenceFilesDataTransfer.files).find(f => f.name === fileNames.rev);
  //         }

  //         if (fwdFile) {
  //           readSetsForCases.push({
  //             caseReadSet: {
  //               case_id: caseIdMapping[generatedCaseId],
  //               case_type_col_id: columnId,
  //               read_set: {
  //                 sequencing_protocol_id: sequencingProtocolId,
  //                 sample_id: '', // !FIXME
  //               },
  //             },
  //             fwdFile,
  //             revFile,
  //           });
  //         }
  //       }
  //     }
  //     let seqs: Seq[] = [];
  //     let readSets: ReadSet[] = [];
  //     if (seqForCases.length > 0) {
  //       seqs = (await CaseApi.instance.createSeqsForCases(seqForCases.map(seqForCase => seqForCase.caseSeq), { signal })).data;
  //     }
  //     if (readSetsForCases.length > 0) {
  //       readSets = (await CaseApi.instance.createReadSetsForCases(readSetsForCases.map(readSetForCase => readSetForCase.caseReadSet), { signal })).data;
  //     }

  //     onProgress(10, t('Starting file uploads...'));
  //     const baseProgress = 10; // Progress after initial setup
  //     const uploadProgress = 90; // Progress available for file uploads
  //     let totalBytesUploaded = 0;

  //     const updateProgress = (fileSize: number, fileName: string) => {
  //       totalBytesUploaded += fileSize;
  //       const uploadProgressPercent = mappedFileSize > 0 ? (totalBytesUploaded / mappedFileSize) : 0;
  //       const currentProgress = Math.min(100, Math.round(baseProgress + (uploadProgressPercent * uploadProgress)));
  //       onProgress(currentProgress, t('Uploading file: {{fileName}} ({{fileSize}})...', { fileName, fileSize: FileUtil.getReadableFileSize(fileSize) }));
  //     };

  //     for (let i = 0; i < seqForCases.length; i++) {
  //       const { caseSeq, file } = seqForCases[i];
  //       const seq = seqs[i];
  //       if (seq) {
  //         await CaseApi.instance.createFileForSeq(caseSeq.case_id, caseSeq.case_type_col_id, {
  //           file_content: await EpiUploadUtil.readFileAsBase64(file),
  //         }, { signal });
  //         updateProgress(file.size, file.name);
  //       }
  //     }

  //     for (let i = 0; i < readSetsForCases.length; i++) {
  //       const { caseReadSet, fwdFile, revFile } = readSetsForCases[i];
  //       const readSet = readSets[i];
  //       if (readSet) {
  //         await CaseApi.instance.createFileForReadSet(caseReadSet.case_id, caseReadSet.case_type_col_id, {
  //           file_content: await EpiUploadUtil.readFileAsBase64(fwdFile),
  //           is_fwd: true,
  //         }, { signal });
  //         updateProgress(fwdFile.size, fwdFile.name);
  //         if (revFile) {
  //           await CaseApi.instance.createFileForReadSet(caseReadSet.case_id, caseReadSet.case_type_col_id, {
  //             file_content: await EpiUploadUtil.readFileAsBase64(revFile),
  //             is_fwd: false,
  //           }, { signal });
  //           updateProgress(revFile.size, revFile.name);
  //         }
  //       }
  //     }
  //     await QueryUtil.invalidateQueryKeys(QueryUtil.getQueryKeyDependencies([QUERY_KEY.CASES], true));
  //     onProgress(100, t('Upload complete.'));
  //     onComplete();
  //   } catch (error) {
  //     onError(error instanceof Error ? error : new Error('Unknown error occurred during upload'));
  //     throw error;
  //   }
  // }
}
