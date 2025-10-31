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
import {
  isValid,
  parseISO,
} from 'date-fns';

import type {
  CaseTypeCol,
  CaseType,
  CompleteCaseType,
  Case,
  ValidatedCase,
  CaseSeq,
  CaseReadSet,
  Seq,
  ReadSet,
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
  EpiValidatedCaseWithGeneratedId,
  EpiUploadSequenceMappingForCaseId,
} from '../../models/epiUpload';
import { EPI_UPLOAD_ACTION } from '../../models/epiUpload';
import { EpiCaseTypeUtil } from '../EpiCaseTypeUtil';
import { ConfigManager } from '../../classes/managers/ConfigManager';
import { EpiCaseUtil } from '../EpiCaseUtil';
import { FileUtil } from '../..';

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
      // Convert CellValue[][] to string[][]
      result = excelData.map(row => row.map(cell => cell?.toString() ?? undefined));
    } else {
      throw new Error('Unsupported file format. Please select a CSV or Excel file.');
    }
    if (result.length < 2 || result[0].length < 2) {
      throw new Error('The selected file does not contain enough data. Please ensure it has at least a header row and one data row.');
    }
    return result;
  }


  public static matchColumnLabel(columnLabel: string, caseTypeCol: CaseTypeCol): boolean {
    if (!columnLabel || typeof columnLabel !== 'string') {
      return false;
    }
    const labelLowerCase = columnLabel.toLocaleLowerCase();
    return labelLowerCase === caseTypeCol.label.toLocaleLowerCase() || labelLowerCase === caseTypeCol.code.toLowerCase() || labelLowerCase === caseTypeCol.id.toLocaleLowerCase();
  }

  public static getCaseTypeFromColumnLabels(caseTypeCols: CaseTypeCol[], columnLabels: string[]): CaseType | null {
    const bestMatch = {
      caseType: null as CaseType | null,
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

  public static isCaseDateColumn(label: string): boolean {
    return this.caseDateColumnAliases.includes(label.toLocaleLowerCase());
  }

  public static isCaseTypeColumn(label: string): boolean {
    return this.caseTypeColumnAliases.includes(label.toLocaleLowerCase());
  }

  public static getInitialMappedColumns(completeCaseType: CompleteCaseType, rawData: string[][], importAction: EPI_UPLOAD_ACTION): EpiUploadMappedColumn[] {
    if (rawData.length === 0) {
      return [];
    }
    const writableColIds = EpiUploadUtil.getWritableCaseTypeColIds(completeCaseType);

    const mappedColumns = rawData[0].map((label, index) => {
      const isCaseIdColumn = EpiUploadUtil.isCaseIdColumn(label);
      const isCaseDateColumn = EpiUploadUtil.isCaseDateColumn(label);
      const isCaseTypeColumn = EpiUploadUtil.isCaseTypeColumn(label);

      let caseTypeCol: CaseTypeCol | null = null;

      if (!isCaseIdColumn && !isCaseDateColumn && !isCaseTypeColumn) {
        caseTypeCol = Object.values(completeCaseType.case_type_cols).find(c => EpiUploadUtil.matchColumnLabel(label, c)) || null;
        if (caseTypeCol && importAction === EPI_UPLOAD_ACTION.UPDATE && !writableColIds.includes(caseTypeCol.id)) {
          caseTypeCol = null;
        }
      }

      return {
        originalIndex: index,
        originalLabel: label,
        caseTypeCol,
        isCaseDateColumn,
        isCaseIdColumn,
        isCaseTypeColumn,
      } satisfies EpiUploadMappedColumn;
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
  public static getSchema(rawData: string[][], completeCaseType: CompleteCaseType, importAction: EPI_UPLOAD_ACTION): ObjectSchema<{}, AnyObject, {}, ''> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fields: { [key: string]: any } = {};

    const fieldNames: string[] = ['case_id', 'case_date', ...completeCaseType.case_type_col_order];

    completeCaseType.case_type_col_order.forEach((colId) => {
      const caseTypeCol = completeCaseType.case_type_cols[colId];
      const otherFieldNames = fieldNames.filter(name => name !== caseTypeCol.id);
      fields[caseTypeCol.id] = lazy(() => string().nullable().when(otherFieldNames, (otherFieldValues, schema) => {
        return schema
          .test('unique', t('This column has already been mapped to another field.'), (fieldValue) => {
            return !fieldValue || !otherFieldValues.includes(fieldValue);
          });
      }));
    });

    if (importAction === EPI_UPLOAD_ACTION.UPDATE) {
      fields['case_id'] = lazy(() => string().nullable().when(fieldNames.filter(name => name !== 'case_id'), (otherFieldValues, schema) => {
        return schema
          .test('unique', t('This column has already been mapped to another field.'), (fieldValue) => {
            return !fieldValue || !otherFieldValues.includes(fieldValue);
          })
          .test('required', t('A column must be mapped to the case ID field.'), (fieldValue) => {
            return !!fieldValue;
          })
          .test('all-column-values-valid', t('The column mapped to the case ID field must contain an id for each row.'), (fieldValue) => {
            if (!fieldValue) {
              return true; // caught by another validation
            }
            const columnIndex = parseInt(fieldValue, 10);
            return rawData.slice(1).map(row => row[columnIndex]).every(value => !!value);
          });
      }));
    }
    fields['case_date'] = lazy(() => string().nullable().when(fieldNames.filter(name => name !== 'case_date'), (otherFieldValues, schema) => {
      return schema
        .test('unique', t('This column has already been mapped to another field.'), (fieldValue) => {
          return !fieldValue || !otherFieldValues.includes(fieldValue);
        })
        .test('required', t('A column must be mapped to the case date field.'), (fieldValue) => {
          if (importAction === EPI_UPLOAD_ACTION.UPDATE) {
            return true;
          }
          return !!fieldValue;
        })
        .test('all-column-values-valid', t('The column mapped to the case date field must contain valid date values for each row.'), (fieldValue) => {
          if (!fieldValue) {
            return true; // caught by another validation
          }
          const columnIndex = parseInt(fieldValue, 10);
          const values = rawData.slice(1).map(row => row[columnIndex]);
          return values.every(value => {
            try {
              if (isValid(value) || isValid(parseISO(value))) {
                return true;
              }
            } catch (_e) {
              return false;
            }
          });
        });
    }));

    return object().shape(fields);
  }


  public static getColumnMappingFormFieldDefinitions(completeCaseType: CompleteCaseType, headers: string[], fileName: string, importAction: EPI_UPLOAD_ACTION): FormFieldDefinition<EpiUploadMappedColumnsFormFields>[] {
    const options: AutoCompleteOption<string>[] = [
      ...headers.map((header, index) => ({
        label: `${header} (.${fileName.split('.').pop()})`,
        value: index.toString(),
      })),
    ];
    const writableColIds = EpiUploadUtil.getWritableCaseTypeColIds(completeCaseType);

    const getLabel = (label: string) => {
      return `${label} (${ConfigManager.instance.config.applicationName})`;
    };

    const fields: FormFieldDefinition<EpiUploadMappedColumnsFormFields>[] = [];
    if (importAction === EPI_UPLOAD_ACTION.UPDATE) {
      fields.push({
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'case_id',
        label: getLabel('Case ID'),
        options,
      });
    }
    fields.push({
      definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
      name: 'case_date',
      label: getLabel('Case Date'),
      options,
    });

    completeCaseType.case_type_col_order.forEach((colId) => {
      const caseTypeCol = completeCaseType.case_type_cols[colId];
      if (importAction === EPI_UPLOAD_ACTION.UPDATE && !writableColIds.includes(caseTypeCol.id)) {
        return;
      }
      fields.push({
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: caseTypeCol.id,
        label: getLabel(caseTypeCol.label),
        options,
      });
    });

    return fields;
  }

  public static getDefaultFormValues(completeCaseType: CompleteCaseType, mappedColumns: EpiUploadMappedColumn[], _importAction: EPI_UPLOAD_ACTION): EpiUploadMappedColumnsFormFields {
    const defaultFormValues: EpiUploadMappedColumnsFormFields = {};
    const caseIdColumn = mappedColumns.find(col => col.isCaseIdColumn);
    const caseDateColumn = mappedColumns.find(col => col.isCaseDateColumn);

    if (caseDateColumn) {
      defaultFormValues['case_date'] = caseDateColumn.originalIndex.toString();
    }
    if (caseIdColumn) {
      defaultFormValues['case_id'] = caseIdColumn.originalIndex.toString();
    }

    mappedColumns.forEach((mappedColumn) => {
      if (mappedColumn.caseTypeCol) {
        defaultFormValues[mappedColumn.caseTypeCol.id] = mappedColumn.originalIndex.toString();
      }
    });

    difference(completeCaseType.case_type_col_order, Object.keys(defaultFormValues)).forEach((colId) => {
      defaultFormValues[colId] = null;
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

  private static getWritableCaseTypeColIds(completeCaseType: CompleteCaseType): string[] {
    const writableColIds: string[] = [];
    Object.values(completeCaseType.case_type_access_abacs).forEach((abac) => {
      writableColIds.push(...abac.write_case_type_col_ids);
    });
    return uniq(writableColIds);
  }

  public static getCompleteCaseTypeColumnStats(completeCaseType: CompleteCaseType): EpiUploadCompleteCaseTypeColumnStats {
    const idColumns = EpiCaseTypeUtil.getCaseTypeColumnsByType(completeCaseType, [ColType.ID_ANONYMISED, ColType.ID_PSEUDONYMISED, ColType.ID_DIRECT]);
    const sequenceColumns = EpiCaseTypeUtil.getCaseTypeColumnsByType(completeCaseType, [ColType.GENETIC_SEQUENCE]);
    const readsColumns = EpiCaseTypeUtil.getCaseTypeColumnsByType(completeCaseType, [ColType.GENETIC_READS]);
    const writableColumns = Object.values(completeCaseType.case_type_cols).filter(col => EpiUploadUtil.getWritableCaseTypeColIds(completeCaseType).includes(col.id));

    return { idColumns, sequenceColumns, readsColumns, writableColumns };
  }

  private static idToRegex(id: string): RegExp {
    // Create regex that matches the id somewhere in a string
    return new RegExp(id.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'));
  }

  public static getEpiUploadSequenceMapping(completeCaseType: CompleteCaseType, validatedCases: EpiValidatedCaseWithGeneratedId[], sequenceFilesDataTransfer: DataTransfer): EpiUploadSequenceMapping {
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
        const rowValue = EpiCaseUtil.getRowValue(vc.case as Case, idCol, completeCaseType);
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
    libraryPrepProtocolId: string;
    mappedFileSize: number;
    sequenceFilesDataTransfer: DataTransfer;
    sequenceMapping: EpiUploadSequenceMapping;
    onProgress: (progress: number, message: string) => void;
    onComplete: () => void;
    onError: (error: Error) => void;
    shareInDataCollectionIds: string[];
    signal: AbortSignal;
    validatedCases: ValidatedCase[];
    validatedCasesWithGeneratedId: EpiValidatedCaseWithGeneratedId[];
  }): Promise<void> {
    const {
      caseTypeId,
      createdInDataCollectionId,
      importAction,
      libraryPrepProtocolId,
      mappedFileSize,
      sequenceFilesDataTransfer,
      sequenceMapping,
      onProgress,
      onComplete,
      onError,
      shareInDataCollectionIds,
      signal,
      validatedCases,
      validatedCasesWithGeneratedId,
    } = kwArgs;

    try {
      onProgress(0, t('Creating cases...'));
      const createCasesResponse = await CaseApi.instance.createCases({
        case_type_id: caseTypeId,
        created_in_data_collection_id: createdInDataCollectionId,
        data_collection_ids: shareInDataCollectionIds,
        is_update: importAction === EPI_UPLOAD_ACTION.UPDATE,
        cases: validatedCases.map(c => c.case),
      }, { signal });

      onProgress(5, t('Preparing genetic data files...'));
      const caseIdMapping: { [generatedCaseId: string]: string } = {};
      for (let i = 0; i < validatedCasesWithGeneratedId.length; i++) {
        const validatedCase = validatedCasesWithGeneratedId[i];
        const createdCase = createCasesResponse.data[i];
        caseIdMapping[validatedCase.generated_id] = createdCase.id;
      }

      const seqForCases: Array<{ caseSeq: CaseSeq; file: File }> = [];
      const readSetsForCases: Array<{ caseReadSet: CaseReadSet; fwdFile: File; revFile: File }> = [];

      for (const [generatedCaseId, mapping] of Object.entries(sequenceMapping)) {
        for (const [columnId, fileName] of Object.entries(mapping.sequenceFileNames)) {
          const file = Array.from(sequenceFilesDataTransfer.files).find(f => f.name === fileName);
          if (file) {
            seqForCases.push({
              caseSeq: {
                case_id: caseIdMapping[generatedCaseId],
                case_type_col_id: columnId,
              },
              file,
            });
          }
        }
        for (const [columnId, fileNames] of Object.entries(mapping.readsFileNames)) {
          let fwdFile: File | undefined;
          let revFile: File | undefined;
          if (fileNames.fwd) {
            fwdFile = Array.from(sequenceFilesDataTransfer.files).find(f => f.name === fileNames.fwd);
          }
          if (fileNames.rev) {
            revFile = Array.from(sequenceFilesDataTransfer.files).find(f => f.name === fileNames.rev);
          }

          if (fwdFile) {
            readSetsForCases.push({
              caseReadSet: {
                case_id: caseIdMapping[generatedCaseId],
                case_type_col_id: columnId,
                library_prep_protocol_id: libraryPrepProtocolId,
              },
              fwdFile,
              revFile,
            });
          }
        }
      }
      let seqs: Seq[] = [];
      let readSets: ReadSet[] = [];
      if (seqForCases.length > 0) {
        seqs = (await CaseApi.instance.createSeqsForCases(seqForCases.map(r => r.caseSeq), { signal })).data;
      }
      if (readSetsForCases.length > 0) {
        readSets = (await CaseApi.instance.createReadSetsForCases(readSetsForCases.map(r => r.caseReadSet), { signal })).data;
      }

      onProgress(10, t('Starting file uploads...'));
      const baseProgress = 10; // Progress after initial setup
      const uploadProgress = 90; // Progress available for file uploads
      let totalBytesUploaded = 0;

      const updateProgress = (fileSize: number, fileName: string) => {
        totalBytesUploaded += fileSize;
        const uploadProgressPercent = mappedFileSize > 0 ? (totalBytesUploaded / mappedFileSize) : 0;
        const currentProgress = Math.min(100, Math.round(baseProgress + (uploadProgressPercent * uploadProgress)));
        onProgress(currentProgress, t('Uploading file: {{fileName}} ({{fileSize}})...', { fileName, fileSize: FileUtil.getReadableFileSize(fileSize) }));
      };

      const waitFor = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      for (let i = 0; i < seqForCases.length; i++) {
        const { caseSeq, file } = seqForCases[i];
        const seq = seqs[i];
        if (seq) {
          await waitFor(1000);
          await CaseApi.instance.createFileForSeq(caseSeq.case_id, caseSeq.case_type_col_id, {
            file_content: await EpiUploadUtil.readFileAsBase64(file),
          }, { signal });
          updateProgress(file.size, file.name);
        }
      }

      for (let i = 0; i < readSetsForCases.length; i++) {
        const { caseReadSet, fwdFile, revFile } = readSetsForCases[i];
        const readSet = readSets[i];
        if (readSet) {
          await waitFor(1000);
          await CaseApi.instance.createFileForReadSet(caseReadSet.case_id, caseReadSet.case_type_col_id, {
            file_content: await EpiUploadUtil.readFileAsBase64(fwdFile),
            is_fwd: true,
          }, { signal });
          updateProgress(fwdFile.size, fwdFile.name);
          if (revFile) {
            await waitFor(1000);
            await CaseApi.instance.createFileForReadSet(caseReadSet.case_id, caseReadSet.case_type_col_id, {
              file_content: await EpiUploadUtil.readFileAsBase64(revFile),
              is_fwd: false,
            }, { signal });
            updateProgress(revFile.size, revFile.name);
          }
        }
      }
      onProgress(100, t('Upload complete.'));
      onComplete();
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unknown error occurred during upload'));
      throw error;
    }
  }
}
