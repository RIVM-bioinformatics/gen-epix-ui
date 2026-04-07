import readXlsxFile, { readSheet } from 'read-excel-file/browser';
import type {
  CellValue,
  SheetData,
} from 'read-excel-file/browser';
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
  Col,
  CaseType,
  CompleteCaseType,
  CaseUploadResult,
  CaseForUpload,
  ReadSetForUpload,
  SeqForUpload,
  CaseBatchUploadResult,
} from '../../api';
import {
  CaseApi,
  ColType,
  UploadAction,
  ReadsFileFormat,
  SeqFileFormat,
  EtlStatus,
} from '../../api';
import { CaseTypeUtil } from '../CaseTypeUtil';
import { CaseUtil } from '../CaseUtil';
import { DATE_FORMAT } from '../../data/date';
import { QueryUtil } from '../QueryUtil';
import { QUERY_KEY } from '../../models/query';
import type {
  AutoCompleteOption,
  FormFieldDefinition,
  OptionBase,
} from '../../models/form';
import { FORM_FIELD_DEFINITION_TYPE } from '../../models/form';
import type {
  EpiUploadMappedColumn,
  EpiUploadMappedColumnsFormFields,
  EpiUploadCompleteColStats,
  CaseUploadResultWithGeneratedId,
  EpiUploadSequenceMapping,
  EpiUploadSequenceMappingForCaseId,
} from '../../models/epi';
import { FileUtil } from '../FileUtil';
import { UploadError } from '../../classes/errors';
import { ValidationUtil } from '../ValidationUtil';
import { ObjectUtil } from '../ObjectUtil';

export class EpiUploadUtil {
  public static readonly caseIdColumnAliases = ['_case_id', 'case id', 'case_id', 'caseid', 'case.id'];
  public static readonly caseDateColumnAliases = ['_case_date', 'case date', 'case_date', 'casedate', 'case.date'];
  public static readonly colAliases = ['_case_type', 'case type', 'case_type', 'casetype', 'case.type'];

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
      return (await readXlsxFile(file, { trim: true })).map(({ sheet: sheetName }) => ({
        label: sheetName,
        value: sheetName,
      }));
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

  public static getSampleIdColIds(completeCaseType: CompleteCaseType): string[] {
    const colsIds: string[] = [];
    Object.values(Object.keys(completeCaseType.cols)).forEach(colId => {
      const col = completeCaseType.cols[colId];
      const refCol = completeCaseType.ref_cols[col.ref_col_id];
      if (refCol?.col_type === ColType.ID_SAMPLE) {
        colsIds.push(col.id);
      }
    });
    return colsIds;
  }


  public static matchColumnLabel(columnLabel: string, col: Col): boolean {
    if (!columnLabel || typeof columnLabel !== 'string') {
      return false;
    }
    const labelLowerCase = columnLabel.toLocaleLowerCase();
    return labelLowerCase === col.label.toLocaleLowerCase() || labelLowerCase === col.code.toLowerCase() || labelLowerCase === col.id.toLocaleLowerCase();
  }

  public static getCaseTypeFromColumnLabels(cols: Col[], columnLabels: string[]): CaseType {
    const bestMatch = {
      caseType: null as CaseType,
      matchCount: 0,
    };

    // Group columns by case type ID to count matches per case type
    const caseTypeMatches = new Map<string, { caseType: CaseType; matchCount: number }>();

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

  public static isCol(label: string): boolean {
    return this.colAliases.includes(label.toLocaleLowerCase());
  }

  public static isCaseDateColumn(label: string): boolean {
    return this.caseDateColumnAliases.includes(label.toLocaleLowerCase());
  }

  public static getInitialMappedColumns(completeCaseType: CompleteCaseType, rawData: string[][]): EpiUploadMappedColumn[] {
    if (rawData.length === 0) {
      return [];
    }
    const writableColIds = CaseTypeUtil.getWritableColIds(completeCaseType);
    const filteredCols = CaseTypeUtil.getWritableImportExportColIds(completeCaseType).map(id => completeCaseType.cols[id]);
    const sampleIdColIds = EpiUploadUtil.getSampleIdColIds(completeCaseType);
    const mappedColumns = rawData[0].map((label, index) => {
      const isCaseIdColumn = EpiUploadUtil.isCaseIdColumn(label);
      const isCol = EpiUploadUtil.isCol(label);

      let col: Col = null;
      let isSampleIdColumn = false;

      if (!isCaseIdColumn && !isCol) {
        col = filteredCols.find(c => EpiUploadUtil.matchColumnLabel(label, c)) || null;
        if (col && !writableColIds.includes(col.id)) {
          col = null;
        }
        isSampleIdColumn = col ? sampleIdColIds.includes(col.id) : false;
      }

      return {
        originalIndex: index,
        originalLabel: label,
        col,
        isCaseIdColumn,
        isCol,
        isSampleIdColumn,
        sampleIdentifierIssuerId: null as string,
      } satisfies EpiUploadMappedColumn;
    });

    return mappedColumns.filter(mc => {
      return mc.isCaseIdColumn || mc.col;
    });
  }

  public static getMappedColumnsFromFormData(data: EpiUploadMappedColumnsFormFields, rawData: string[][], colMap: Map<string, Col>, completeCaseType: CompleteCaseType): EpiUploadMappedColumn[] {
    const mappedColumns: EpiUploadMappedColumn[] = [];
    const sampleIdColIds = EpiUploadUtil.getSampleIdColIds(completeCaseType);
    Object.entries(data).forEach(([originalIndexString, formValue]) => {
      if (!formValue) {
        return;
      }
      const originalIndex = parseInt(originalIndexString, 10);
      const isCaseIdColumn = formValue === 'case_id';
      let col: Col = null;
      if (!isCaseIdColumn) {
        col = colMap.get(formValue) || null;
      }
      let sampleIdentifierIssuerId: string = null;
      const isSampleIdColumn = col ? sampleIdColIds.includes(col.id) : false;
      if (isSampleIdColumn) {
        sampleIdentifierIssuerId = data[formValue] || null;
      }
      mappedColumns.push({
        isCaseIdColumn,
        isSampleIdColumn,
        col,
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
  public static getColumnMappingSchema(rawData: string[][], completeCaseType: CompleteCaseType): ObjectSchema<{}, AnyObject, {}, ''> {
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

  public static getColumnMappingFormFieldDefinitions(completeCaseType: CompleteCaseType, rawDataHeaders: string[], _fileName: string): FormFieldDefinition<EpiUploadMappedColumnsFormFields>[] {
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
        name: index.toString(),
        label: header,
        options,
      });
    });

    return fields;
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

  public static hasSequenceColumnMapped(mappedColumns: EpiUploadMappedColumn[], completeCaseTypeColStats: EpiUploadCompleteColStats): boolean {
    return mappedColumns.some((mappedColumn) => {
      return completeCaseTypeColStats.sequenceColumns.some(seqCol => mappedColumn.col?.id === seqCol.id);
    });
  }

  public static hasReadsColumnMapped(mappedColumns: EpiUploadMappedColumn[], completeCaseTypeColStats: EpiUploadCompleteColStats): boolean {
    return mappedColumns.some((mappedColumn) => {
      return completeCaseTypeColStats.readsColumns.some(readCol => mappedColumn.col?.id === readCol.id);
    });
  }


  public static getCompleteCaseTypeColStats(completeCaseType: CompleteCaseType): EpiUploadCompleteColStats {
    const sampleIdColumns = CaseTypeUtil.getColsByType(completeCaseType, [ColType.ID_SAMPLE]);
    const sequenceColumns = CaseTypeUtil.getColsByType(completeCaseType, [ColType.GENETIC_SEQUENCE]);
    const readsColumns = CaseTypeUtil.getColsByType(completeCaseType, [ColType.GENETIC_READS]);
    const writableColumns = Object.values(completeCaseType.cols).filter(col => CaseTypeUtil.getWritableColIds(completeCaseType).includes(col.id));

    return { sampleIdColumns, sequenceColumns, readsColumns, writableColumns };
  }

  private static idToRegex(id: string): RegExp {
    // Create regex that matches the id somewhere in a string
    return new RegExp(id.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'));
  }

  public static getEpiUploadSequenceMapping(completeCaseType: CompleteCaseType, validatedCases: CaseUploadResultWithGeneratedId[], sequenceFilesDataTransfer: DataTransfer): EpiUploadSequenceMapping {
    if (!sequenceFilesDataTransfer || sequenceFilesDataTransfer.files.length === 0) {
      return {};
    }

    const stats = EpiUploadUtil.getCompleteCaseTypeColStats(completeCaseType);
    const result: EpiUploadSequenceMapping = {};

    validatedCases.forEach((vc) => {
      const caseSequenceMapping: EpiUploadSequenceMappingForCaseId = {
        sequenceFileNames: {},
        readsFileNames: {},
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

  public static getSequenceMappingStats(sequenceMapping: EpiUploadSequenceMapping, sequenceFilesDataTransfer: DataTransfer): {
    numberOfFilesToMap: number;
    mappedFiles: string[];
    mappedSequenceFiles: string[];
    mappedReadsFiles: string[];
    unmappedFileNames: string[];
    unmappedSequenceFiles: string[];
    unmappedReadsFiles: string[];
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

  public static getCasesForVerification(kwArgs: { rawData: string[][]; mappedColumns: EpiUploadMappedColumn[]; caseTypeId: string; createdInDataCollectionId: string }): CaseForUpload[] {
    const { rawData, mappedColumns, caseTypeId, createdInDataCollectionId } = kwArgs;
    return rawData.slice(1).map((row) => {
      const caseIdColumn = mappedColumns.find((mappedColumn) => mappedColumn.isCaseIdColumn)?.originalIndex;
      const content: { [key: string]: string } = {};

      mappedColumns.forEach((mappedColumn) => {
        if (mappedColumn.col) {
          content[mappedColumn.col.id] = row[mappedColumn.originalIndex];
        }
      });

      const caseForCreateUpdate: CaseForUpload = {
        id: caseIdColumn !== undefined ? row[caseIdColumn] : undefined,
        case: {
          content: ObjectUtil.deepRemoveEmptyStrings(content),
          case_type_id: caseTypeId,
          created_in_data_collection_id: createdInDataCollectionId,
        },
      };

      return { ...caseForCreateUpdate, content };
    });
  }

  public static async createCases(kwArgs: {
    completeCaseType: CompleteCaseType;
    assemblyProtocolId: string;
    caseTypeId: string;
    createdInDataCollectionId: string;
    mappedColumns: EpiUploadMappedColumn[];
    sampleIdColId: string;
    sequenceMapping: EpiUploadSequenceMapping;
    sequencingProtocolId: string;
    signal: AbortSignal;
    validatedCases: CaseUploadResult[];
    validatedCasesWithGeneratedId: CaseUploadResultWithGeneratedId[];
  }): Promise<CaseBatchUploadResult> {
    const {
      completeCaseType,
      assemblyProtocolId,
      caseTypeId,
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

    return (await CaseApi.instance.uploadCases({
      case_type_id: caseTypeId,
      created_in_data_collection_id: createdInDataCollectionId,
      on_exists: UploadAction.UPDATE,
      case_batch: {
        cases: validatedCasesWithGeneratedId.map((vc, index) => {
          const caseId = validatedCases[index].id ?? undefined;
          const readSetsForUpload: ReadSetForUpload[] = [];
          const seqsForUpload: SeqForUpload[] = [];
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
                    col_id: colId,
                    case_id: caseId,
                    other_sample_identifier: {
                      external_id: externalSampleId,
                      identifier_issuer_id: sampleIdentifierIssuerId,
                    },
                    protocol_id: assemblyProtocolId,
                  } satisfies SeqForUpload);
                }
              });
            }
            if (sequenceMapping[vc.generatedId]?.readsFileNames) {
              Object.entries(sequenceMapping[vc.generatedId].readsFileNames).forEach(([colId, fileNames]) => {
                if (fileNames.fwd || fileNames.rev) {
                  readSetsForUpload.push({
                    col_id: colId,
                    case_id: caseId,
                    other_sample_identifier: {
                      external_id: externalSampleId,
                      identifier_issuer_id: sampleIdentifierIssuerId,
                    },
                    protocol_id: sequencingProtocolId,
                  } satisfies ReadSetForUpload);
                }
              });
            }
          }

          return {
            case: {
              id: caseId,
              case_type_id: caseTypeId,
              created_in_data_collection_id: createdInDataCollectionId,
              content: ObjectUtil.deepRemoveEmptyStrings(vc.validated_content),
            },
            read_sets: readSetsForUpload,
            seqs: seqsForUpload,
          } satisfies CaseForUpload;
        }),
      },
    }, { signal })).data;
  }

  public static reportFileUploadProgress(kwArgs: {
    startPercentage: number;
    endPercentage: number;
    onProgress: (progress: number, message: string) => void;
    totalFileSizeToUpload: number;
    uploadedFileSize: number;
    fileSize: number;
    message: string;
  }): void {
    const {
      startPercentage,
      endPercentage,
      onProgress,
      totalFileSizeToUpload,
      uploadedFileSize,
      fileSize,
      message,
    } = kwArgs;

    const percentageRange = endPercentage - startPercentage;
    const percentageRangePerByte = percentageRange / totalFileSizeToUpload;
    const overallProgress = startPercentage + (uploadedFileSize * percentageRangePerByte) + (fileSize * percentageRangePerByte);

    onProgress(overallProgress, message);
  }

  public static async uploadFilesForCases(kwArgs: {
    startPercentage: number;
    endPercentage: number;
    assemblyProtocolId: string;
    caseTypeId: string;
    completeCaseType: CompleteCaseType;
    caseBatchUploadResult: CaseBatchUploadResult;
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
    validatedCases: CaseUploadResult[];
    validatedCasesWithGeneratedId: CaseUploadResultWithGeneratedId[];
  }): Promise<void> {
    const {
      startPercentage,
      endPercentage,
      caseBatchUploadResult,
      onProgress,
      sequenceFilesDataTransfer,
      sequenceMapping,
      signal,
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
          await CaseApi.instance.createFileForSeq(caseSeqToBeUploaded.caseId, caseSeqToBeUploaded.colId, {
            file_content: base64Data,
            file_compression: FileUtil.getFileCompressionFromFileName(caseSeqToBeUploaded.fileName),
            file_format: SeqFileFormat.FASTA,
          }, { signal });
          EpiUploadUtil.reportFileUploadProgress({
            startPercentage,
            endPercentage,
            onProgress,
            totalFileSizeToUpload,
            uploadedFileSize,
            fileSize,
            message: t('Uploading sequence file "{{fileName}}" for case ID "{{caseId}}"...', { fileName: caseSeqToBeUploaded.fileName, caseId: caseSeqToBeUploaded.caseId }),
          });
          uploadedFileSize += fileSize;
        }
      }
      for (const caseReadSetToBeUploaded of caseReadSetsToBeUploaded) {
        const file = Array.from(sequenceFilesDataTransfer.files).find(f => f.name === caseReadSetToBeUploaded.fileName);
        if (file) {
          const fileSize = file.size;
          const base64Data = await EpiUploadUtil.readFileAsBase64(file);
          await CaseApi.instance.createFileForReadSet(caseReadSetToBeUploaded.caseId, caseReadSetToBeUploaded.colId, {
            file_content: base64Data,
            file_compression: FileUtil.getFileCompressionFromFileName(caseReadSetToBeUploaded.fileName),
            file_format: ReadsFileFormat.FASTQ,
            is_fwd: caseReadSetToBeUploaded.is_fwd,
          }, { signal });
          EpiUploadUtil.reportFileUploadProgress({
            startPercentage,
            endPercentage,
            onProgress,
            totalFileSizeToUpload,
            uploadedFileSize,
            fileSize,
            message: t('Uploading read set file "{{fileName}}" for case ID "{{caseId}}"...', { fileName: caseReadSetToBeUploaded.fileName, caseId: caseReadSetToBeUploaded.caseId }),
          });
          uploadedFileSize += fileSize;
        }
      }
    }
  }

  public static async createCasesAndUploadFiles(kwArgs: {
    completeCaseType: CompleteCaseType;
    assemblyProtocolId: string;
    caseTypeId: string;
    createdInDataCollectionId: string;
    mappedColumns: EpiUploadMappedColumn[];
    onComplete: () => void;
    sampleIdColId: string;
    onError: (error: Error) => void;
    onProgress: (progress: number, message: string) => void;
    sequenceFilesDataTransfer: DataTransfer;
    sequenceMapping: EpiUploadSequenceMapping;
    sequencingProtocolId: string;
    signal: AbortSignal;
    validatedCases: CaseUploadResult[];
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

      if (caseBatchUploadResult.status === EtlStatus.FAILED) {
        throw new UploadError(t('Failed to create cases during upload.'), caseBatchUploadResult);
      }

      await EpiUploadUtil.uploadFilesForCases({ ...kwArgs, caseBatchUploadResult, startPercentage: 1, endPercentage: 99 });
      onProgress(100, t('Upload complete.'));

      await QueryUtil.invalidateQueryKeys(QueryUtil.getQueryKeyDependencies([QUERY_KEY.CASES], true));
      onComplete();
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unknown error occurred during upload'));
      throw error;
    }
  }
}
