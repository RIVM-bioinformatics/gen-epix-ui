import { createArrayCsvStringifier } from 'csv-writer';
import {
  utils,
  write,
} from 'xlsx';
import sumBy from 'lodash/sumBy';

import { DataUrlUtil } from '../DataUrlUtil';
import { EpiCaseTypeUtil } from '../EpiCaseTypeUtil';
import { EpiCaseUtil } from '../EpiCaseUtil';
import type {
  Case,
  CompleteCaseType,
} from '../../api';

export class EpiListUtil {
  public static downloadAsCsv(cases: Case[], completeCaseType: CompleteCaseType, name: string): void {
    const csvStringifier = createArrayCsvStringifier({
      header: EpiCaseTypeUtil.getCaseTypeColumns(completeCaseType).map(caseTypeColumn => caseTypeColumn.label),
    });
    const records = cases.map(row => EpiCaseTypeUtil.getCaseTypeColumns(completeCaseType).map(caseTypeColumn => EpiCaseUtil.getRowValue(row, caseTypeColumn, completeCaseType).short));
    const csv = `${csvStringifier.getHeaderString()}${csvStringifier.stringifyRecords(records)}`;

    DataUrlUtil.downloadUrl(`data:text/csv;base64,${btoa(csv)}`, name);
  }

  public static downloadAsExcel(cases: Case[], completeCaseType: CompleteCaseType, name: string): void {
    const workBook = utils.book_new();

    const headers = EpiCaseTypeUtil.getCaseTypeColumns(completeCaseType).map(caseTypeColumn => caseTypeColumn.label);
    const rows = cases.map(row => EpiCaseTypeUtil.getCaseTypeColumns(completeCaseType).map(caseTypeColumn => EpiCaseUtil.getRowValue(row, caseTypeColumn, completeCaseType).short));
    const data = [
      headers,
      ...rows,
    ];
    const workSheet = utils.aoa_to_sheet(data);
    utils.book_append_sheet(workBook, workSheet);

    const result = write(workBook, {
      type: 'base64',
      bookType: 'xls',
    }) as string;
    DataUrlUtil.downloadUrl(`data:application/vnd.ms-excel;base64,${result}`, name);
  }

  public static getCaseCount(cases: Case[]): number {
    // when count is null, 1 should be assumed
    return sumBy(cases, (row) => (row.count ?? 1));
  }
}
