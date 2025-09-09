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

import type {
  CaseTypeCol,
  CaseType,
  CompleteCaseType,
  Dim,
} from '../../api';
import {
  FORM_FIELD_DEFINITION_TYPE,
  type AutoCompleteOption,
  type FormFieldDefinition,
} from '../../models/form';
import { StringUtil } from '../StringUtil';
import { EpiCaseTypeUtil } from '../EpiCaseTypeUtil';
import type {
  EpiUploadMappedColumn,
  EpiUploadMappedColumnsFormFields,
} from '../../models/epiUpload';

export class EpiUploadUtil {
  public static __csvSheetId: string;

  public static readonly caseIdColumnAliases = ['case id', 'case_id', 'caseid', '_case_id', 'case.id'];
  public static readonly caseDateColumnAliases = ['case date', 'case_date', 'casedate', '_case_date', 'case.date'];

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
    if (fileName.endsWith('.csv')) {
      // Parse CSV file
      const text = await file.text();
      return parse(text, {
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
      return excelData.map(row => row.map(cell => cell?.toString() ?? undefined));
    }
    throw new Error('Unsupported file format. Please select a CSV or Excel file.');
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

  public static getInitialMappedColumns(completeCaseType: CompleteCaseType, rawData: string[][]): EpiUploadMappedColumn[] {
    if (rawData.length === 0) {
      return [];
    }
    return rawData[0].map((label, index) => {
      const isCaseIdColumn = EpiUploadUtil.caseIdColumnAliases.includes(label.toLocaleLowerCase());
      const isCaseDateColumn = EpiUploadUtil.caseDateColumnAliases.includes(label.toLocaleLowerCase());

      let caseTypeCol: CaseTypeCol | null = null;

      if (!isCaseIdColumn && !isCaseDateColumn) {
        caseTypeCol = Object.values(completeCaseType.case_type_cols).find(c => EpiUploadUtil.matchColumnLabel(label, c)) || null;
      }

      return {
        originalIndex: index,
        originalLabel: label,
        caseTypeCol,
        isCaseDateColumn,
        isCaseIdColumn,
      };
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  public static getSchemaFromMappedColumns(mappedColumns: EpiUploadMappedColumn[], t: TFunction<'translation', undefined>): ObjectSchema<{}, AnyObject, {}, ''> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fields: { [key: string]: any } = {};

    if (!mappedColumns.length) {
      return object().shape(fields);
    }
    const fieldNames = mappedColumns.map(mappedColumn => mappedColumn.originalIndex.toString());
    mappedColumns.forEach((mappedColumn) => {
      const otherFieldNames = fieldNames.filter(name => name !== mappedColumn.originalIndex.toString());
      fields[mappedColumn.originalIndex.toString()] = lazy(() => string().nullable().when(otherFieldNames, (otherFieldValues, schema) => {
        return schema
          .test('unique', t('Each column must be mapped to a unique case type field.'), (fieldValue) => {
            return !fieldValue || !otherFieldValues.includes(fieldValue);
          });
      }));
    });
    return object().shape(fields);
  }

  public static getFormFieldDefinitionsFromMappedColumns(mappedColumns: EpiUploadMappedColumn[], caseTypeColOptions: AutoCompleteOption<string>[]): FormFieldDefinition<EpiUploadMappedColumnsFormFields>[] {
    return mappedColumns.map((header) => ({
      definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
      name: header.originalIndex.toString(),
      label: header.originalLabel || `Column ${header.originalIndex + 1}`,
      options: caseTypeColOptions,
      multiple: false,
      clearOnBlur: true,
      disabled: false,
      fullWidth: true,
    }));
  }

  public static getCaseTypeColOptions(completeCaseType: CompleteCaseType): AutoCompleteOption<string>[] {
    const options: AutoCompleteOption<string>[] = [
      {
        value: 'case_id',
        label: 'case_id',
      },
      {
        value: 'case_date',
        label: 'case_date',
      },
    ];
    EpiCaseTypeUtil.iterateOrderedDimensions(completeCaseType, (_dim: Dim, caseTypeColumns: CaseTypeCol[]) => {
      EpiCaseTypeUtil.iterateCaseTypeColumns(completeCaseType, caseTypeColumns, (caseTypeCol) => {
        options.push({
          value: caseTypeCol.id,
          label: `${caseTypeCol.label} (${caseTypeCol.code})`,
        });
      });
    });
    return options;
  }

  public static getDefaultColumMappingFormValues(mappedColumns: EpiUploadMappedColumn[]): EpiUploadMappedColumnsFormFields {
    const values: EpiUploadMappedColumnsFormFields = {};
    mappedColumns.forEach((header) => {
      let value: string = null;
      if (header.isCaseIdColumn) {
        value = 'case_id';
      } else if (header.isCaseDateColumn) {
        value = 'case_date';
      } else if (header.caseTypeCol) {
        value = header.caseTypeCol?.id;
      }
      values[header.originalIndex.toString()] = value ?? null;
    });
    return values;
  }
}
