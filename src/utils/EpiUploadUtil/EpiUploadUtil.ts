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
import type { TFunction } from 'i18next';
import difference from 'lodash/difference';
import uniq from 'lodash/uniq';

import type {
  CaseTypeCol,
  CaseType,
  CompleteCaseType,
  ValidatedCase,
} from '../../api';
import {
  FORM_FIELD_DEFINITION_TYPE,
  type AutoCompleteOption,
  type FormFieldDefinition,
} from '../../models/form';
import { StringUtil } from '../StringUtil';
import { ColType } from '../../api';
import type {
  EpiUploadMappedColumn,
  EpiUploadMappedColumnsFormFields,
  EpiUploadFileColumnAssignment,
} from '../../models/epiUpload';
import { EPI_UPLOAD_ACTION } from '../../models/epiUpload';
import { EpiCaseTypeUtil } from '../EpiCaseTypeUtil';
import { ConfigManager } from '../../classes/managers/ConfigManager';

export class EpiUploadUtil {
  public static __csvSheetId: string;

  public static readonly caseIdColumnAliases = ['_case_id', 'case id', 'case_id', 'caseid', 'case.id'];
  public static readonly caseDateColumnAliases = ['_case_date', 'case date', 'case_date', 'casedate', 'case.date'];
  public static readonly caseTypeColumnAliases = ['_case_type', 'case type', 'case_type', 'casetype', 'case.type'];

  public static get csvSheetId(): string {
    if (!this.__csvSheetId) {
      this.__csvSheetId = `csv-${StringUtil.createUuid()}`;
    }
    return this.__csvSheetId;
  }

  public static async getSheetNameOptions(fileList: FileList): Promise<AutoCompleteOption<string>[]> {
    const file = fileList[0];
    const fileName = file.name.toLowerCase();

    if (fileName.toLowerCase().endsWith('.xlsx')) {
      return (await readSheetNames(file)).map(name => ({ label: name, value: name }));
    } else if (fileName.toLowerCase().endsWith('.csv') || fileName.toLowerCase().endsWith('.tsv') || fileName.toLowerCase().endsWith('.txt')) {
      return [{ label: 'CSV', value: EpiUploadUtil.csvSheetId }];
    }
    return [];
  }

  public static async readRawData(fileList: FileList, sheet?: string): Promise<string[][]> {
    const file = fileList[0];
    const fileName = file.name.toLowerCase();
    let result: string[][] = [];

    if (fileName.endsWith('.csv') || fileName.endsWith('.tsv') || fileName.endsWith('.txt')) {
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
    } else if (fileName.endsWith('.xlsx')) {
      if (sheet === EpiUploadUtil.csvSheetId) {
        // allow a render cycle to complete
        return null;
      }
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
  public static getSchema(completeCaseType: CompleteCaseType, t: TFunction<'translation', undefined>, importAction: EPI_UPLOAD_ACTION): ObjectSchema<{}, AnyObject, {}, ''> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fields: { [key: string]: any } = {};

    const fieldNames: string[] = ['case_id', 'case_date', ...completeCaseType.case_type_col_order];

    completeCaseType.case_type_col_order.forEach((colId) => {
      const caseTypeCol = completeCaseType.case_type_cols[colId];
      const otherFieldNames = fieldNames.filter(name => name !== caseTypeCol.id);
      fields[caseTypeCol.id] = lazy(() => string().nullable().when(otherFieldNames, (otherFieldValues, schema) => {
        return schema
          .test('unique', t('Each column must be mapped to a unique case type field.'), (fieldValue) => {
            return !fieldValue || !otherFieldValues.includes(fieldValue);
          });
      }));
    });

    if (importAction === EPI_UPLOAD_ACTION.UPDATE) {
      fields['case_id'] = lazy(() => string().nullable().when(fieldNames.filter(name => name !== 'case_id'), (otherFieldValues, schema) => {
        return schema
          .test('unique', t('Each column must be mapped to a unique case type field.'), (fieldValue) => {
            return !fieldValue || !otherFieldValues.includes(fieldValue);
          })
          .test('required', t('A column must be mapped to the case ID field.'), (fieldValue) => {
            return !!fieldValue;
          });
      }));
    }
    fields['case_date'] = lazy(() => string().nullable().when(fieldNames.filter(name => name !== 'case_date'), (otherFieldValues, schema) => {
      return schema
        .test('unique', t('Each column must be mapped to a unique case type field.'), (fieldValue) => {
          return !fieldValue || !otherFieldValues.includes(fieldValue);
        })
        .test('required', t('A column must be mapped to the case date field.'), (fieldValue) => {
          if (importAction === EPI_UPLOAD_ACTION.UPDATE) {
            return true;
          }
          return !!fieldValue;
        });
    }));

    return object().shape(fields);
  }


  public static getFormFieldDefinitions(completeCaseType: CompleteCaseType, headers: string[], fileName: string, importAction: EPI_UPLOAD_ACTION): FormFieldDefinition<EpiUploadMappedColumnsFormFields>[] {
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

  public static getCompleteCaseTypeColumnStats(completeCaseType: CompleteCaseType): { idColumns: CaseTypeCol[]; sequenceColumns: CaseTypeCol[]; readsColumns: CaseTypeCol[]; writableColumns: CaseTypeCol[]; readsFwdRevColumnPairs: { fwd: CaseTypeCol; rev: CaseTypeCol }[] } {
    const idColumns = EpiCaseTypeUtil.getCaseTypeColumnsByType(completeCaseType, [ColType.ID_ANONYMISED, ColType.ID_PSEUDONYMISED, ColType.ID_DIRECT]);
    const sequenceColumns = EpiCaseTypeUtil.getCaseTypeColumnsByType(completeCaseType, [ColType.GENETIC_SEQUENCE]);
    const readsColumns = EpiCaseTypeUtil.getCaseTypeColumnsByType(completeCaseType, [ColType.GENETIC_READS]);
    const readsFwdRevColumnPairs = EpiCaseTypeUtil.findPairedReadsCaseTypeColumns(completeCaseType);
    const writableColumns = Object.values(completeCaseType.case_type_cols).filter(col => EpiUploadUtil.getWritableCaseTypeColIds(completeCaseType).includes(col.id));

    return { idColumns, sequenceColumns, readsColumns, writableColumns, readsFwdRevColumnPairs };
  }

  /**
   * Assigns genetic files (FASTA/FASTQ) to corresponding case type columns
   * @param completeCaseType The complete case type structure
   * @param dataTransfer The list of files to assign
   * @returns Array of file-to-column assignments
   */
  public static assignFilesToColumns(
    completeCaseType: CompleteCaseType,
    dataTransfer: DataTransfer,
    _validatedCases: ValidatedCase[],
  ): EpiUploadFileColumnAssignment[] {
    const files = Array.from(dataTransfer.files);
    const assignments: EpiUploadFileColumnAssignment[] = [];

    // Validate input
    if (!files.length) {
      return assignments;
    }

    // Separate supported and unsupported files
    const supportedFiles = files.filter(file => EpiUploadUtil.isSupportedGeneticFile(file.name));
    const unsupportedFiles = files.filter(file => !EpiUploadUtil.isSupportedGeneticFile(file.name));

    // Add assignments for unsupported files
    unsupportedFiles.forEach(file => {
      assignments.push({
        file,
        caseTypeCol: null,
      });
    });

    // Process supported files
    const genomeFiles = supportedFiles.filter(file => EpiUploadUtil.isGenomeFile(file.name));
    const readsFiles = supportedFiles.filter(file => EpiUploadUtil.isReadsFile(file.name));

    // Handle genome files (.fa, .fasta)
    genomeFiles.forEach(file => {
      const caseTypeColId = EpiUploadUtil.findUniqueCaseTypeColumnByFilename(completeCaseType, file.name, [ColType.GENETIC_SEQUENCE]);
      if (caseTypeColId) {
        assignments.push({
          file,
          caseTypeCol: caseTypeColId,
        });
        return;
      }
      const geneticSequenceCols = EpiCaseTypeUtil.getCaseTypeColumnsByType(completeCaseType, [ColType.GENETIC_SEQUENCE]);
      assignments.push({
        file,
        caseTypeCol: geneticSequenceCols.length === 1 ? geneticSequenceCols[0] : null,
      });
    });

    // Handle reads files (.fq, .fastq)
    if (readsFiles.length === 1) {
      // Single file - assign to GENETIC_READS
      const caseTypeColId = EpiUploadUtil.findUniqueCaseTypeColumnByFilename(completeCaseType, readsFiles[0].name, [ColType.GENETIC_READS]);
      if (caseTypeColId) {
        assignments.push({
          file: readsFiles[0],
          caseTypeCol: caseTypeColId,
        });
        return;
      }
      const geneticReadsCols = EpiCaseTypeUtil.getCaseTypeColumnsByType(completeCaseType, [ColType.GENETIC_READS]);
      assignments.push({
        file: readsFiles[0],
        caseTypeCol: geneticReadsCols.length === 1 ? geneticReadsCols[0] : null,
      });
    } else if (readsFiles.length === 2) {
      // Try to assign based on filenames first
      const caseTypeColA = EpiUploadUtil.findUniqueCaseTypeColumnByFilename(completeCaseType, readsFiles[0].name, [ColType.GENETIC_READS_FWD, ColType.GENETIC_READS_REV]);
      const caseTypeColB = EpiUploadUtil.findUniqueCaseTypeColumnByFilename(completeCaseType, readsFiles[1].name, [ColType.GENETIC_READS_FWD, ColType.GENETIC_READS_REV]);
      if (caseTypeColA && caseTypeColB) {
        const colTypeA = completeCaseType.cols[caseTypeColA.col_id].col_type;
        const colTypeB = completeCaseType.cols[caseTypeColB.col_id].col_type;
        if ((colTypeA === ColType.GENETIC_READS_FWD && colTypeB === ColType.GENETIC_READS_REV) ||
          (colTypeA === ColType.GENETIC_READS_REV && colTypeB === ColType.GENETIC_READS_FWD)) {
          assignments.push({
            file: readsFiles[0],
            caseTypeCol: caseTypeColA,
          });
          assignments.push({
            file: readsFiles[1],
            caseTypeCol: caseTypeColB,
          });
          return;
        }
      }

      // Try by pairing GENETIC_READS_FWD/REV in the same dimension
      const pairedReadsCols = EpiCaseTypeUtil.findPairedReadsCaseTypeColumns(completeCaseType);
      if (pairedReadsCols.length === 1) {
        const sortedFiles = [...readsFiles].sort((a, b) => a.name.localeCompare(b.name));

        assignments.push({
          file: sortedFiles[0],
          caseTypeCol: pairedReadsCols[0].fwd,
        });
        assignments.push({
          file: sortedFiles[1],
          caseTypeCol: pairedReadsCols[0].rev,
        });
      } else {
        // No suitable paired columns found - assign null to both files
        readsFiles.forEach(file => {
          assignments.push({
            file,
            caseTypeCol: null,
          });
        });
      }
    } else {
      // More than 2 reads files - not supported
      readsFiles.forEach(file => {
        assignments.push({
          file,
          caseTypeCol: null,
        });
      });
    }

    return assignments;
  }

  /**
   * Find a unique case type column by file name.
   * @param completeCaseType The complete case type object.
   * @param fileName The name of the file.
   * @returns The unique case type column or null if not found.
   */
  public static findUniqueCaseTypeColumnByFilename(completeCaseType: CompleteCaseType, fileName: string, colTypes: ColType[]): CaseTypeCol {
    const ids: string[] = [];

    const nameWithoutExtension = fileName.replace(/\.(gz|gzip)$/i, '').replace(/\.(fa|fasta|fq|fastq)$/i, '').toLowerCase();
    ids.push(nameWithoutExtension);
    ids.push(nameWithoutExtension.replace(/[_\-.]/g, ' '));

    // Find UUIDs in the filename (pattern: 8-4-4-4-12 hex characters)
    const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
    const uuidMatches = nameWithoutExtension.match(uuidRegex);
    if (uuidMatches) {
      uuidMatches.forEach(uuid => {
        ids.push(uuid.toLowerCase());
      });
    }

    // Find UUIDs without hyphens (32 consecutive hex characters)
    const uuidNoHyphenRegex = /[0-9a-f]{32}/gi;
    const uuidNoHyphenMatches = nameWithoutExtension.match(uuidNoHyphenRegex);
    if (uuidNoHyphenMatches) {
      uuidNoHyphenMatches.forEach(uuid => {
        // Add both the original format and the hyphenated version
        ids.push(uuid.toLowerCase());
        // Convert to standard UUID format: 8-4-4-4-12
        const hyphenated = `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20, 32)}`.toLowerCase();
        ids.push(hyphenated);
      });
    }

    // Find ULIDs in the filename (pattern: 26 characters using Crockford's Base32)
    const ulidRegex = /[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}/gi;
    const ulidMatches = nameWithoutExtension.match(ulidRegex);
    if (ulidMatches) {
      ulidMatches.forEach(ulid => {
        ids.push(ulid.toLowerCase());
      });
    }

    for (const id of ids) {
      const caseTypeCol = EpiCaseTypeUtil.findUniqueCaseTypeColumnByCaseTypeColIdOrColId(completeCaseType, id);
      if (caseTypeCol) {
        const col = completeCaseType.cols[caseTypeCol.col_id];
        if (colTypes.includes(col.col_type)) {
          return caseTypeCol;
        }
      }
    }
    return null;
  }
}
