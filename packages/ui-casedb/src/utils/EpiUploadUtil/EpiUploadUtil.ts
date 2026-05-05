import readXlsxFile, { readSheet } from 'read-excel-file/browser';
import type {
  CellValue,
  SheetData,
} from 'read-excel-file/browser';
import { parse } from 'csv/browser/esm/sync';
import type {
  AnyObject,
  ObjectSchema,
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
  CaseDbCaseBatchUploadResult,
  CaseDbCaseForUpload,
  CaseDbCaseType,
  CaseDbCaseUploadResult,
  CaseDbCol,
  CaseDbCompleteCaseType,
  CaseDbReadSetForUpload,
  CaseDbSeqForUpload,
} from '@gen-epix/api-casedb';
import {
  CaseDbCaseApi,
  CaseDbColType,
  CaseDbEtlStatus,
  CaseDbReadsFileFormat,
  CaseDbSeqFileFormat,
  CaseDbUploadAction,
} from '@gen-epix/api-casedb';

import { CaseTypeUtil } from '../CaseTypeUtil';
import { CaseUtil } from '../CaseUtil';
import { DATE_FORMAT } from '../../../../ui/src/data/date';
import { QueryUtil } from '../../../../ui/src/utils/QueryUtil';
import { QUERY_KEY } from '../../../../ui/src/models/query';
import type {
  AutoCompleteOption,
  FormFieldDefinition,
  OptionBase,
} from '../../../../ui/src/models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../../../ui/src/models/form';
import type {
  CaseUploadResultWithGeneratedId,
  EpiUploadCompleteColStats,
  EpiUploadMappedColumn,
  EpiUploadMappedColumnsFormFields,
  EpiUploadSequenceMapping,
  EpiUploadSequenceMappingForCaseId,
} from '../../models/epi';
import { FileUtil } from '../../../../ui/src/utils/FileUtil';
import { UploadError } from '../../classes/errors';
import { ValidationUtil } from '../../../../ui/src/utils/ValidationUtil';
import { ObjectUtil } from '../../../../ui/src/utils/ObjectUtil';

export class EpiUploadUtil {
  public static readonly caseDateColumnAliases = ['_case_date', 'case date', 'case_date', 'casedate', 'case.date'];
  public static readonly caseIdColumnAliases = ['_case_id', 'case id', 'case_id', 'caseid', 'case.id'];
  public static readonly colAliases = ['_case_type', 'case type', 'case_type', 'casetype', 'case.type'];

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

  public static async createCases(kwArgs: {
    assemblyProtocolId: string;
    caseTypeId: string;
    completeCaseType: CaseDbCompleteCaseType;
    createdInDataCollectionId: string;
    mappedColumns: EpiUploadMappedColumn[];
    sampleIdColId: string;
    sequenceMapping: EpiUploadSequenceMapping;
    sequencingProtocolId: string;
    signal: AbortSignal;
    validatedCases: CaseDbCaseUploadResult[];
    validatedCasesWithGeneratedId: CaseUploadResultWithGeneratedId[];
  }): Promise<CaseDbCaseBatchUploadResult> {
    const {
      assemblyProtocolId,
      caseTypeId,
      completeCaseType,
      createdInDataCollectionId,
      mappedColumns,
      sampleIdColId,
      sequenceMapping,
      sequencingProtocolId,
      signal,
      validatedCases,
      validatedCasesWithGeneratedId,
    } = kwArgs;
    const { col: mappedSampleIdCol, sampleIdentifierIssuerId } = mappedColumns.find(mc => mc.col.id === sampleIdColId);

    return (await CaseDbCaseApi.instance.uploadCases({
      case_batch: {
        cases: validatedCasesWithGeneratedId.map((vc, index) => {
          const caseId = validatedCases[index].id ?? undefined;
          const readSetsForUpload: CaseDbReadSetForUpload[] = [];
          const seqsForUpload: CaseDbSeqForUpload[] = [];
          const externalSampleId = CaseUtil.getRowValue(
            vc.validated_content,
            mappedSampleIdCol,
            completeCaseType,
          )?.raw;

          if (externalSampleId) {
            if (sequenceMapping[vc.generatedId]?.sequenceFileNames) {
              Object.entries(sequenceMapping[vc.generatedId].sequenceFileNames).forEach(([colId, fileName]) => {
                if (fileName) {
                  seqsForUpload.push({
                    case_id: caseId,
                    col_id: colId,
                    other_sample_identifier: {
                      external_id: externalSampleId,
                      identifier_issuer_id: sampleIdentifierIssuerId,
                    },
                    protocol_id: assemblyProtocolId,
                  } satisfies CaseDbSeqForUpload);
                }
              });
            }
            if (sequenceMapping[vc.generatedId]?.readsFileNames) {
              Object.entries(sequenceMapping[vc.generatedId].readsFileNames).forEach(([colId, fileNames]) => {
                if (fileNames.fwd || fileNames.rev) {
                  readSetsForUpload.push({
                    case_id: caseId,
                    col_id: colId,
                    other_sample_identifier: {
                      external_id: externalSampleId,
                      identifier_issuer_id: sampleIdentifierIssuerId,
                    },
                    protocol_id: sequencingProtocolId,
                  } satisfies CaseDbReadSetForUpload);
                }
              });
            }
          }

          return {
            case: {
              case_type_id: caseTypeId,
              content: ObjectUtil.deepRemoveEmptyStrings(vc.validated_content),
              created_in_data_collection_id: createdInDataCollectionId,
              id: caseId,
            },
            read_sets: readSetsForUpload,
            seqs: seqsForUpload,
          } satisfies CaseDbCaseForUpload;
        }),
      },
      case_type_id: caseTypeId,
      created_in_data_collection_id: createdInDataCollectionId,
      on_exists: CaseDbUploadAction.UPDATE,
    }, { signal })).data;
  }

  public static async createCasesAndUploadFiles(kwArgs: {
    assemblyProtocolId: string;
    caseTypeId: string;
    completeCaseType: CaseDbCompleteCaseType;
    createdInDataCollectionId: string;
    mappedColumns: EpiUploadMappedColumn[];
    onComplete: () => void;
    onError: (error: Error) => void;
    onProgress: (progress: number, message: string) => void;
    sampleIdColId: string;
    sequenceFilesDataTransfer: DataTransfer;
    sequenceMapping: EpiUploadSequenceMapping;
    sequencingProtocolId: string;
    signal: AbortSignal;
    validatedCases: CaseDbCaseUploadResult[];
    validatedCasesWithGeneratedId: CaseUploadResultWithGeneratedId[];
  }): Promise<void> {
    const {
      onComplete,
      onError,
      onProgress,
    } = kwArgs;

    try {
      onProgress(0, t('Creating cases...'));
      const caseBatchUploadResult = await EpiUploadUtil.createCases(kwArgs);

      if (caseBatchUploadResult.status === CaseDbEtlStatus.FAILED) {
        throw new UploadError(t('Failed to create cases during upload.'), caseBatchUploadResult);
      }

      await EpiUploadUtil.uploadFilesForCases({ ...kwArgs, caseBatchUploadResult, endPercentage: 99, startPercentage: 1 });
      onProgress(100, t('Upload complete.'));

      await QueryUtil.invalidateQueryKeys(QueryUtil.getQueryKeyDependencies([QUERY_KEY.CASES], true));
      onComplete();
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unknown error occurred during upload'));
      throw error;
    }
  }

  public static getCasesForVerification(kwArgs: { caseTypeId: string; createdInDataCollectionId: string; mappedColumns: EpiUploadMappedColumn[]; rawData: string[][] }): CaseDbCaseForUpload[] {
    const { caseTypeId, createdInDataCollectionId, mappedColumns, rawData } = kwArgs;
    return rawData.slice(1).map((row) => {
      const caseIdColumn = mappedColumns.find((mappedColumn) => mappedColumn.isCaseIdColumn)?.originalIndex;
      const content: { [key: string]: string } = {};

      mappedColumns.forEach((mappedColumn) => {
        if (mappedColumn.col) {
          content[mappedColumn.col.id] = row[mappedColumn.originalIndex];
        }
      });

      const caseForCreateUpdate: CaseDbCaseForUpload = {
        case: {
          case_type_id: caseTypeId,
          content: ObjectUtil.deepRemoveEmptyStrings(content),
          created_in_data_collection_id: createdInDataCollectionId,
        },
        id: caseIdColumn !== undefined ? row[caseIdColumn] : undefined,
      };

      return { ...caseForCreateUpdate, content };
    });
  }

  public static getCaseTypeFromColumnLabels(cols: CaseDbCol[], columnLabels: string[]): CaseDbCaseType {
    const bestMatch = {
      caseType: null as CaseDbCaseType,
      matchCount: 0,
    };

    // Group columns by case type ID to count matches per case type
    const caseTypeMatches = new Map<string, { caseType: CaseDbCaseType; matchCount: number }>();

    cols.forEach(col => {
      const matchCount = columnLabels.filter(label =>
        this.matchColumnLabel(label, col)).length;

      if (matchCount > 0) {
        const caseTypeId = col.case_type_id;
        const existing = caseTypeMatches.get(caseTypeId);

        if (existing) {
          existing.matchCount += matchCount;
        } else {
          // Note: We don't have access to the full CaseType object here,
          // so we create a minimal one with the ID. In a real implementation,
          // you might need to pass the complete case type data or modify the method signature.
          caseTypeMatches.set(caseTypeId, {
            caseType: { id: caseTypeId } as CaseDbCaseType,
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

  public static getColumnMappingFormFieldDefinitions(completeCaseType: CaseDbCompleteCaseType, rawDataHeaders: string[], _fileName: string): FormFieldDefinition<EpiUploadMappedColumnsFormFields>[] {
    const fields: FormFieldDefinition<EpiUploadMappedColumnsFormFields>[] = [];
    const options: AutoCompleteOption<string>[] = [];

    options.push({
      label: 'Case ID',
      value: 'case_id',
    });

    const allowedColIds = CaseTypeUtil.getWritableImportExportColIds(completeCaseType);
    completeCaseType.ordered_col_ids.filter(x => allowedColIds.includes(x)).forEach((colId) => {
      const col = completeCaseType.cols[colId];

      options.push({
        label: col.label,
        value: col.id,
      });
    });

    rawDataHeaders.forEach((header, index) => {
      fields.push({
        definition: FORM_FIELD_DEFINITION_TYPE.SELECT,
        label: header,
        name: index.toString(),
        options,
      });
    });

    return fields;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  public static getColumnMappingSchema(rawData: string[][], completeCaseType: CaseDbCompleteCaseType): ObjectSchema<{}, AnyObject, {}, ''> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fields: { [key: string]: any } = {};
    const fieldNames: string[] = rawData[0].map((_, index) => index.toString());
    const sampleIdColIds = EpiUploadUtil.getSampleIdColIds(completeCaseType);

    sampleIdColIds.forEach((colId) => {
      fields[colId] = lazy(() => string().nullable().when(fieldNames, (otherFieldValues, schema) => {
        return schema.test('needs-identifier-issuer', t('An identifier issuer must be selected.'), (fieldValue) => {
          const allFieldValues = [...otherFieldValues as string[], fieldValue];
          if (allFieldValues.includes(colId)) {
            return !!fieldValue;
          }
          return true;
        });
      }));
    });

    fieldNames.forEach((fieldName, fieldIndex) => {
      const otherFieldNames = fieldNames.filter(name => name !== fieldName);
      fields[fieldName] = lazy(() => string().nullable().when(otherFieldNames, (otherFieldValues, schema) => {
        return schema
          .test('unique', t('This column has already been mapped to another field.'), (fieldValue) => {
            return !fieldValue || !otherFieldValues.includes(fieldValue);
          })
          .test('valid-case-id-values', t('The column mapped to the case id field must contain valid UUID\'s.'), (fieldValue) => {
            if (fieldValue !== 'case_id') {
              return true;
            }
            const values = rawData.slice(1).map(row => row[fieldIndex]);
            return values.every(value => ValidationUtil.validate('UUID4', value));
          });
      }));
    });

    return object().shape(fields);
  }


  public static getCompleteCaseTypeColStats(completeCaseType: CaseDbCompleteCaseType): EpiUploadCompleteColStats {
    const sampleIdColumns = CaseTypeUtil.getColsByType(completeCaseType, [CaseDbColType.ID_SAMPLE]);
    const sequenceColumns = CaseTypeUtil.getColsByType(completeCaseType, [CaseDbColType.GENETIC_SEQUENCE]);
    const readsColumns = CaseTypeUtil.getColsByType(completeCaseType, [CaseDbColType.GENETIC_READS]);
    const writableColumns = Object.values(completeCaseType.cols).filter(col => CaseTypeUtil.getWritableColIds(completeCaseType).includes(col.id));

    return { readsColumns, sampleIdColumns, sequenceColumns, writableColumns };
  }

  public static getDefaultColumnMappingFormValues(rawDataHeaders: string[], mappedColumns: EpiUploadMappedColumn[], identifierIssuerOptions: OptionBase<string>[]): EpiUploadMappedColumnsFormFields {
    const defaultFormValues: EpiUploadMappedColumnsFormFields = Object.fromEntries(Object.keys(rawDataHeaders).map<[string, null]>(x => [x.toString(), null]));
    const caseIdColumn = mappedColumns.find(mappedColumn => mappedColumn.isCaseIdColumn);

    if (caseIdColumn) {
      defaultFormValues[caseIdColumn.originalIndex.toString()] = 'case_id';
    }

    mappedColumns.forEach((mappedColumn) => {
      if (mappedColumn.col) {
        defaultFormValues[mappedColumn.originalIndex.toString()] = mappedColumn.col.id;
        if (mappedColumn.isSampleIdColumn) {
          defaultFormValues[mappedColumn.col.id] = mappedColumn.sampleIdentifierIssuerId || identifierIssuerOptions.length === 1 ? identifierIssuerOptions[0].value : null;
        }
      }
    });
    return defaultFormValues;
  }

  public static getEpiUploadSequenceMapping(completeCaseType: CaseDbCompleteCaseType, validatedCases: CaseUploadResultWithGeneratedId[], sequenceFilesDataTransfer: DataTransfer): EpiUploadSequenceMapping {
    if (!sequenceFilesDataTransfer || sequenceFilesDataTransfer.files.length === 0) {
      return {};
    }

    const stats = EpiUploadUtil.getCompleteCaseTypeColStats(completeCaseType);
    const result: EpiUploadSequenceMapping = {};

    validatedCases.forEach((vc) => {
      const caseSequenceMapping: EpiUploadSequenceMappingForCaseId = {
        readsFileNames: {},
        sequenceFileNames: {},
      };

      // modify by reference
      result[vc.generatedId] = caseSequenceMapping;

      if (stats.sequenceColumns.length !== 1 && stats.readsColumns.length !== 1) {
        return;
      }

      const sampleIdColumnIds: string[] = [];
      stats.sampleIdColumns.forEach((idCol) => {
        const rowValue = CaseUtil.getRowValue(vc.validated_content, idCol, completeCaseType);
        if (rowValue && !rowValue.isMissing) {
          sampleIdColumnIds.push(rowValue.raw);
        }
      });
      if (!sampleIdColumnIds.length) {
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
        const matchesId = sampleIdColumnIds.some((id) => lowerName.match(EpiUploadUtil.idToRegex(id.toLowerCase())));
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

  public static getInitialMappedColumns(completeCaseType: CaseDbCompleteCaseType, rawData: string[][]): EpiUploadMappedColumn[] {
    if (rawData.length === 0) {
      return [];
    }
    const writableColIds = CaseTypeUtil.getWritableColIds(completeCaseType);
    const filteredCols = CaseTypeUtil.getWritableImportExportColIds(completeCaseType).map(id => completeCaseType.cols[id]);
    const sampleIdColIds = EpiUploadUtil.getSampleIdColIds(completeCaseType);
    const mappedColumns = rawData[0].map((label, index) => {
      const isCaseIdColumn = EpiUploadUtil.isCaseIdColumn(label);
      const isCol = EpiUploadUtil.isCol(label);

      let col: CaseDbCol = null;
      let isSampleIdColumn = false;

      if (!isCaseIdColumn && !isCol) {
        col = filteredCols.find(c => EpiUploadUtil.matchColumnLabel(label, c)) || null;
        if (col && !writableColIds.includes(col.id)) {
          col = null;
        }
        isSampleIdColumn = col ? sampleIdColIds.includes(col.id) : false;
      }

      return {
        col,
        isCaseIdColumn,
        isCol,
        isSampleIdColumn,
        originalIndex: index,
        originalLabel: label,
        sampleIdentifierIssuerId: null as string,
      } satisfies EpiUploadMappedColumn;
    });

    return mappedColumns.filter(mc => {
      return mc.isCaseIdColumn || mc.col;
    });
  }

  public static getMappedColumnsFromFormData(data: EpiUploadMappedColumnsFormFields, rawData: string[][], colMap: Map<string, CaseDbCol>, completeCaseType: CaseDbCompleteCaseType): EpiUploadMappedColumn[] {
    const mappedColumns: EpiUploadMappedColumn[] = [];
    const sampleIdColIds = EpiUploadUtil.getSampleIdColIds(completeCaseType);
    Object.entries(data).forEach(([originalIndexString, formValue]) => {
      if (!formValue) {
        return;
      }
      const originalIndex = parseInt(originalIndexString, 10);
      const isCaseIdColumn = formValue === 'case_id';
      let col: CaseDbCol = null;
      if (!isCaseIdColumn) {
        col = colMap.get(formValue) || null;
      }
      let sampleIdentifierIssuerId: string = null;
      const isSampleIdColumn = col ? sampleIdColIds.includes(col.id) : false;
      if (isSampleIdColumn) {
        sampleIdentifierIssuerId = data[formValue] || null;
      }
      mappedColumns.push({
        col,
        isCaseIdColumn,
        isSampleIdColumn,
        originalIndex,
        originalLabel: rawData[0][originalIndex] || '',
        sampleIdentifierIssuerId,
      } satisfies EpiUploadMappedColumn);
    });
    return mappedColumns;
  }

  public static getSampleIdColIds(completeCaseType: CaseDbCompleteCaseType): string[] {
    const colsIds: string[] = [];
    Object.values(Object.keys(completeCaseType.cols)).forEach(colId => {
      const col = completeCaseType.cols[colId];
      const refCol = completeCaseType.ref_cols[col.ref_col_id];
      if (refCol?.col_type === CaseDbColType.ID_SAMPLE) {
        colsIds.push(col.id);
      }
    });
    return colsIds;
  }

  public static getSequenceMappingStats(sequenceMapping: EpiUploadSequenceMapping, sequenceFilesDataTransfer: DataTransfer): {
    mappedFiles: string[];
    mappedReadsFiles: string[];
    mappedSequenceFiles: string[];
    numberOfFilesToMap: number;
    unmappedFileNames: string[];
    unmappedReadsFiles: string[];
    unmappedSequenceFiles: string[];
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

    return {
      mappedFiles,
      mappedReadsFiles,
      mappedSequenceFiles,
      numberOfFilesToMap,
      unmappedFileNames,
      unmappedReadsFiles,
      unmappedSequenceFiles,
    };
  }

  public static async getSheetNameOptions(fileList: FileList): Promise<AutoCompleteOption<string>[]> {
    const file = fileList[0];
    const fileName = file.name.toLowerCase();

    if (EpiUploadUtil.isXlsxFile(fileName)) {
      return (await readXlsxFile(file, { trim: true })).map(({ sheet: sheetName }) => ({
        label: sheetName,
        value: sheetName,
      }));
    }
    return [];
  }

  public static hasReadsColumnMapped(mappedColumns: EpiUploadMappedColumn[], completeCaseTypeColStats: EpiUploadCompleteColStats): boolean {
    return mappedColumns.some((mappedColumn) => {
      return completeCaseTypeColStats.readsColumns.some(readCol => mappedColumn.col?.id === readCol.id);
    });
  }

  public static hasSequenceColumnMapped(mappedColumns: EpiUploadMappedColumn[], completeCaseTypeColStats: EpiUploadCompleteColStats): boolean {
    return mappedColumns.some((mappedColumn) => {
      return completeCaseTypeColStats.sequenceColumns.some(seqCol => mappedColumn.col?.id === seqCol.id);
    });
  }

  public static isCaseDateColumn(label: string): boolean {
    return this.caseDateColumnAliases.includes(label.toLocaleLowerCase());
  }

  public static isCaseIdColumn(label: string): boolean {
    return this.caseIdColumnAliases.includes(label.toLocaleLowerCase());
  }

  public static isCol(label: string): boolean {
    return this.colAliases.includes(label.toLocaleLowerCase());
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


  public static isTextFile(fileName: string): boolean {
    const lowerName = fileName?.toLowerCase();
    return lowerName?.endsWith('.csv') || lowerName?.endsWith('.tsv') || lowerName?.endsWith('.txt');
  }

  public static isXlsxFile(fileName: string): boolean {
    return fileName?.toLowerCase()?.endsWith('.xlsx');
  }

  public static matchColumnLabel(columnLabel: string, col: CaseDbCol): boolean {
    if (!columnLabel || typeof columnLabel !== 'string') {
      return false;
    }
    const labelLowerCase = columnLabel.toLocaleLowerCase();
    return labelLowerCase === col.label.toLocaleLowerCase() || labelLowerCase === col.code.toLowerCase() || labelLowerCase === col.id.toLocaleLowerCase();
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

  public static async readRawData(fileList: FileList, sheet?: string): Promise<string[][]> {
    const file = fileList[0];
    const fileName = file.name.toLowerCase();
    let result: string[][];

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
      const excelData = sheet
        ? await readSheet(file, sheet, { trim: true })
        : await readSheet(file, { trim: true });
      result = EpiUploadUtil.mapExcelSheetData(excelData);
    } else {
      throw new Error('Unsupported file format. Please select a CSV or Excel file.');
    }
    if (result.length < 2 || result[0].length < 2) {
      throw new Error('The selected file does not contain enough data. Please ensure it has at least a header row and one data row.');
    }
    return result;
  }

  public static reportFileUploadProgress(kwArgs: {
    endPercentage: number;
    fileSize: number;
    message: string;
    onProgress: (progress: number, message: string) => void;
    startPercentage: number;
    totalFileSizeToUpload: number;
    uploadedFileSize: number;
  }): void {
    const {
      endPercentage,
      fileSize,
      message,
      onProgress,
      startPercentage,
      totalFileSizeToUpload,
      uploadedFileSize,
    } = kwArgs;

    const percentageRange = endPercentage - startPercentage;
    const percentageRangePerByte = percentageRange / totalFileSizeToUpload;
    const overallProgress = startPercentage + (uploadedFileSize * percentageRangePerByte) + (fileSize * percentageRangePerByte);

    onProgress(overallProgress, message);
  }

  public static async uploadFilesForCases(kwArgs: {
    assemblyProtocolId: string;
    caseBatchUploadResult: CaseDbCaseBatchUploadResult;
    caseTypeId: string;
    completeCaseType: CaseDbCompleteCaseType;
    createdInDataCollectionId: string;
    endPercentage: number;
    mappedColumns: EpiUploadMappedColumn[];
    onComplete: () => void;
    onError: (error: Error) => void;
    onProgress: (progress: number, message: string) => void;
    sampleIdColId: string;
    sequenceFilesDataTransfer: DataTransfer;
    sequenceMapping: EpiUploadSequenceMapping;
    sequencingProtocolId: string;
    signal: AbortSignal;
    startPercentage: number;
    validatedCases: CaseDbCaseUploadResult[];
    validatedCasesWithGeneratedId: CaseUploadResultWithGeneratedId[];
  }): Promise<void> {
    const {
      caseBatchUploadResult,
      endPercentage,
      onProgress,
      sequenceFilesDataTransfer,
      sequenceMapping,
      signal,
      startPercentage,
    } = kwArgs;

    const seqsToBeUploaded: Array<{ caseId: string; colId: string; fileName: string }> = [];
    const readSetsToBeUploaded: Array<{ caseId: string; colId: string; fileName: string; is_fwd: boolean }> = [];
    let totalFileSizeToUpload = 0;

    for (const [index, caseUploadResult] of caseBatchUploadResult.cases.entries()) {
      const { generatedId } = kwArgs.validatedCasesWithGeneratedId[index];
      if (sequenceMapping[generatedId]) {
        const caseId = caseUploadResult.id;
        for (const [colId, fileName] of Object.entries(sequenceMapping[generatedId].sequenceFileNames)) {
          if (fileName) {
            const file = Array.from(sequenceFilesDataTransfer.files).find(f => f.name === fileName);
            if (file) {
              seqsToBeUploaded.push({ caseId, colId, fileName });
              totalFileSizeToUpload = totalFileSizeToUpload + (file?.size || 0);
            }
          }
        }
        for (const [colId, fileNames] of Object.entries(sequenceMapping[generatedId].readsFileNames)) {
          if (fileNames.fwd) {
            const file = Array.from(sequenceFilesDataTransfer.files).find(f => f.name === fileNames.fwd);
            if (file) {
              readSetsToBeUploaded.push({ caseId, colId, fileName: fileNames.fwd, is_fwd: true });
              totalFileSizeToUpload = totalFileSizeToUpload + (file?.size || 0);
            }
          }
          if (fileNames.rev) {
            const file = Array.from(sequenceFilesDataTransfer.files).find(f => f.name === fileNames.rev);
            if (file) {
              readSetsToBeUploaded.push({ caseId, colId, fileName: fileNames.rev, is_fwd: false });
              totalFileSizeToUpload = totalFileSizeToUpload + (file?.size || 0);
            }
          }
        }
      }
    }

    // upload in order of cases
    let uploadedFileSize = 0;
    for (const caseUploadResult of caseBatchUploadResult.cases) {
      const caseSeqToBeUploaded = seqsToBeUploaded.find(s => s.caseId === caseUploadResult.id);
      const caseReadSetsToBeUploaded = readSetsToBeUploaded.filter(rs => rs.caseId === caseUploadResult.id);

      if (caseSeqToBeUploaded) {
        const file = Array.from(sequenceFilesDataTransfer.files).find(f => f.name === caseSeqToBeUploaded.fileName);
        if (file) {
          const fileSize = file.size;
          const base64Data = await EpiUploadUtil.readFileAsBase64(file);
          await CaseDbCaseApi.instance.createFileForSeq(caseSeqToBeUploaded.caseId, caseSeqToBeUploaded.colId, {
            file_compression: FileUtil.getFileCompressionFromFileName(caseSeqToBeUploaded.fileName),
            file_content: base64Data,
            file_format: CaseDbSeqFileFormat.FASTA,
          }, { signal });
          EpiUploadUtil.reportFileUploadProgress({
            endPercentage,
            fileSize,
            message: t('Uploading sequence file "{{fileName}}" for case ID "{{caseId}}"...', { caseId: caseSeqToBeUploaded.caseId, fileName: caseSeqToBeUploaded.fileName }),
            onProgress,
            startPercentage,
            totalFileSizeToUpload,
            uploadedFileSize,
          });
          uploadedFileSize += fileSize;
        }
      }
      for (const caseReadSetToBeUploaded of caseReadSetsToBeUploaded) {
        const file = Array.from(sequenceFilesDataTransfer.files).find(f => f.name === caseReadSetToBeUploaded.fileName);
        if (file) {
          const fileSize = file.size;
          const base64Data = await EpiUploadUtil.readFileAsBase64(file);
          await CaseDbCaseApi.instance.createFileForReadSet(caseReadSetToBeUploaded.caseId, caseReadSetToBeUploaded.colId, {
            file_compression: FileUtil.getFileCompressionFromFileName(caseReadSetToBeUploaded.fileName),
            file_content: base64Data,
            file_format: CaseDbReadsFileFormat.FASTQ,
            is_fwd: caseReadSetToBeUploaded.is_fwd,
          }, { signal });
          EpiUploadUtil.reportFileUploadProgress({
            endPercentage,
            fileSize,
            message: t('Uploading read set file "{{fileName}}" for case ID "{{caseId}}"...', { caseId: caseReadSetToBeUploaded.caseId, fileName: caseReadSetToBeUploaded.fileName }),
            onProgress,
            startPercentage,
            totalFileSizeToUpload,
            uploadedFileSize,
          });
          uploadedFileSize += fileSize;
        }
      }
    }
  }

  private static idToRegex(id: string): RegExp {
    // Create regex that matches the id somewhere in a string
    return new RegExp(id.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'));
  }

  private static mapExcelCellToString(cell: CellValue | null): string {
    if (cell instanceof Date) {
      return format(cell, DATE_FORMAT.DATE);
    }
    if (cell === null || cell === undefined) {
      return '';
    }
    return cell.toString();
  }

  private static mapExcelSheetData(sheetData: SheetData): string[][] {
    return sheetData.map(row => row.map(cell => EpiUploadUtil.mapExcelCellToString(cell)));
  }
}
