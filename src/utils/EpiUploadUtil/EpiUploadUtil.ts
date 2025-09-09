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

import type {
  CaseTypeCol,
  CaseType,
  CompleteCaseType,
} from '../../api';
import {
  FORM_FIELD_DEFINITION_TYPE,
  type AutoCompleteOption,
  type FormFieldDefinition,
} from '../../models/form';
import { StringUtil } from '../StringUtil';
import {
  EPI_UPLOAD_ACTION,
  type EpiUploadMappedColumn,
  type EpiUploadMappedColumnsFormFields,
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
    if (importAction === EPI_UPLOAD_ACTION.CREATE) {
      fields['case_date'] = lazy(() => string().nullable().when(fieldNames.filter(name => name !== 'case_date'), (otherFieldValues, schema) => {
        return schema
          .test('unique', t('Each column must be mapped to a unique case type field.'), (fieldValue) => {
            return !fieldValue || !otherFieldValues.includes(fieldValue);
          })
          .test('required', t('A column must be mapped to the case date field.'), (fieldValue) => {
            return !!fieldValue;
          });
      }));
    }

    return object().shape(fields);
  }


  public static getFormFieldDefinitions(completeCaseType: CompleteCaseType, headers: string[], importAction: EPI_UPLOAD_ACTION): FormFieldDefinition<EpiUploadMappedColumnsFormFields>[] {
    const options: AutoCompleteOption<string>[] = [
      ...headers.map((header, index) => ({
        label: header,
        value: index.toString(),
      })),
    ];

    const fields: FormFieldDefinition<EpiUploadMappedColumnsFormFields>[] = [];
    if (importAction === EPI_UPLOAD_ACTION.UPDATE) {
      fields.push({
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'case_id',
        label: 'Case ID',
        options,
      });
    }
    if (importAction === EPI_UPLOAD_ACTION.CREATE) {
      fields.push({
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: 'case_date',
        label: 'Case Date',
        options,
      });
    }

    completeCaseType.case_type_col_order.forEach((colId) => {
      const caseTypeCol = completeCaseType.case_type_cols[colId];
      fields.push({
        definition: FORM_FIELD_DEFINITION_TYPE.AUTOCOMPLETE,
        name: caseTypeCol.id,
        label: caseTypeCol.label,
        options,
      });
    });

    return fields;
  }

  public static getDefaultFormValues(completeCaseType: CompleteCaseType, mappedColumns: EpiUploadMappedColumn[], importAction: EPI_UPLOAD_ACTION): EpiUploadMappedColumnsFormFields {
    const defaultFormValues: EpiUploadMappedColumnsFormFields = {};
    const caseIdColumn = mappedColumns.find(col => col.isCaseIdColumn);
    const caseDateColumn = mappedColumns.find(col => col.isCaseDateColumn);

    if (importAction === EPI_UPLOAD_ACTION.UPDATE && caseIdColumn) {
      defaultFormValues['case_id'] = caseIdColumn.originalIndex.toString();
    }
    if (importAction === EPI_UPLOAD_ACTION.CREATE && caseDateColumn) {
      defaultFormValues['case_date'] = caseDateColumn.originalIndex.toString();
    }

    mappedColumns.forEach((header) => {
      if (header.caseTypeCol) {
        defaultFormValues[header.caseTypeCol.id] = header.originalIndex.toString();
      }
    });
    difference(completeCaseType.case_type_col_order, Object.keys(defaultFormValues)).forEach((colId) => {
      defaultFormValues[colId] = null;
    });
    return defaultFormValues;
  }

  public static getWritableCaseTypeColIds(completeCaseType: CompleteCaseType): string[] {
    const writableColIds: string[] = [];
    Object.values(completeCaseType.case_type_access_abacs).forEach((abac) => {
      writableColIds.push(...abac.write_case_type_col_ids);
    });
    return writableColIds;
  }
}
