import { createArrayCsvStringifier } from 'csv-writer';
import { Workbook } from 'exceljs';
import sumBy from 'lodash/sumBy';
import { format } from 'date-fns';
import type { TFunction } from 'i18next';

import { DataUrlUtil } from '../DataUrlUtil';
import { EpiCaseTypeUtil } from '../EpiCaseTypeUtil';
import { EpiCaseUtil } from '../EpiCaseUtil';
import type {
  Case,
  CaseTypeCol,
  CompleteCaseType,
} from '../../api';
import { StringUtil } from '../StringUtil';
import { ConfigManager } from '../../classes/managers/ConfigManager';
import { DATE_FORMAT } from '../../data/date';

export class EpiListUtil {
  public static getColumnHeadersForExport(caseTypeColumnIds: string[], completeCaseType: CompleteCaseType): string[] {
    return [
      '_case_id',
      '_case_type',
      '_case_date',
      ...EpiListUtil.getCaseTypeColumnsForExport(caseTypeColumnIds, completeCaseType).map(caseTypeColumn => caseTypeColumn.label),
    ];
  }

  public static getRowsForExport(cases: Case[], caseTypeColumnIds: string[], completeCaseType: CompleteCaseType): string[][] {
    return cases.map(row => [
      row.id,
      completeCaseType.name,
      row.case_date ? format(row.case_date, DATE_FORMAT.DATE) : '',
      ...EpiListUtil.getCaseTypeColumnsForExport(caseTypeColumnIds, completeCaseType).map(caseTypeColumn => EpiCaseUtil.getRowValue(row, caseTypeColumn, completeCaseType).short),
    ]);
  }

  public static getExportFileName(completeCaseType: CompleteCaseType, t: TFunction<'translation', undefined>): string {
    return t('{{applicationName}}--line-list--{{date}}--{{caseTypeName}}', {
      applicationName: StringUtil.createSlug(ConfigManager.instance.config.applicationName),
      date: format(new Date(), DATE_FORMAT.DATE),
      caseTypeName: StringUtil.createSlug(completeCaseType.name),
    });
  }

  public static downloadAsCsv(cases: Case[], caseTypeColumnIds: string[], completeCaseType: CompleteCaseType, t: TFunction<'translation', undefined>): void {
    const csvStringifier = createArrayCsvStringifier({
      header: EpiListUtil.getColumnHeadersForExport(caseTypeColumnIds, completeCaseType),
    });
    const csv = `${csvStringifier.getHeaderString()}${csvStringifier.stringifyRecords(EpiListUtil.getRowsForExport(cases, caseTypeColumnIds, completeCaseType))}`;
    DataUrlUtil.downloadUrl(`data:text/csv;base64,${btoa(csv)}`, EpiListUtil.getExportFileName(completeCaseType, t));
  }

  public static async downloadAsExcel(cases: Case[], caseTypeColumnIds: string[], completeCaseType: CompleteCaseType, t: TFunction<'translation', undefined>): Promise<void> {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Data');

    // Add headers
    const headers = EpiListUtil.getColumnHeadersForExport(caseTypeColumnIds, completeCaseType);
    worksheet.addRow(headers);

    // Add data rows
    const rows = EpiListUtil.getRowsForExport(cases, caseTypeColumnIds, completeCaseType);
    rows.forEach(row => {
      worksheet.addRow(row);
    });

    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    const fileName = `${EpiListUtil.getExportFileName(completeCaseType, t)}.xlsx`;
    DataUrlUtil.downloadUrl(`data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`, fileName);
  }

  public static getCaseCount(cases: Case[]): number {
    // when count is null, 1 should be assumed
    return sumBy(cases, (row) => (row.count ?? 1));
  }

  private static getCaseTypeColumnsForExport(caseTypeColumnIds: string[], completeCaseType: CompleteCaseType): CaseTypeCol[] {
    return EpiCaseTypeUtil.getCaseTypeColumns(completeCaseType)
      .filter(x => caseTypeColumnIds.includes(x.id))
      .sort((a, b) => {
        return caseTypeColumnIds.indexOf(a.id) - caseTypeColumnIds.indexOf(b.id);
      });
  }
}
