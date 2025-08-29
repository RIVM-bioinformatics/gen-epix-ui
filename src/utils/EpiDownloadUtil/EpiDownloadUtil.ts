import type { TFunction } from 'i18next';
import { format } from 'date-fns';
import type { ECharts } from 'echarts';
import { createArrayCsvStringifier } from 'csv-writer';
import writeXlsxFile from 'write-excel-file';

import type {
  Case,
  CaseTypeCol,
  CompleteCaseType,
} from '../../api';
import { ConfigManager } from '../../classes/managers/ConfigManager';
import { DATE_FORMAT } from '../../data/date';
import { StringUtil } from '../StringUtil';
import { EpiCaseTypeUtil } from '../EpiCaseTypeUtil';
import { EpiCaseUtil } from '../EpiCaseUtil';

export class EpiDownloadUtil {
  public static createDownloadUrl(url: string, name: string): void {
    const link = document.createElement('a');
    link.download = name;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  public static getExportFileName(baseName: string, completeCaseType: CompleteCaseType, t: TFunction<'translation', undefined>): string {
    return t('{{applicationName}}--{{date}}--{{caseTypeName}}--{{baseName}}', {
      applicationName: StringUtil.createSlug(ConfigManager.instance.config.applicationName),
      baseName: StringUtil.createSlug(baseName),
      date: format(new Date(), DATE_FORMAT.DATE),
      caseTypeName: StringUtil.createSlug(completeCaseType.name),
    });
  }

  public static downloadEchartsImage(baseName: string, instance: ECharts, type: 'jpeg' | 'png', completeCaseType: CompleteCaseType, t: TFunction<'translation', undefined>): void {
    const url = instance.getDataURL({
      type,
      pixelRatio: 2,
      backgroundColor: '#fff',
    });
    const fileName = `${EpiDownloadUtil.getExportFileName(baseName, completeCaseType, t)}.${type.toLowerCase()}`;
    EpiDownloadUtil.createDownloadUrl(url, fileName);
  }

  public static downloadCanvasImage(baseName: string, canvas: HTMLCanvasElement, type: 'jpeg' | 'png', completeCaseType: CompleteCaseType, t: TFunction<'translation', undefined>): void {
    const dataUrl = canvas.toDataURL(type === 'jpeg' ? 'image/jpeg' : 'image/png');
    const fileName = `${EpiDownloadUtil.getExportFileName(baseName, completeCaseType, t)}.${type}`;
    EpiDownloadUtil.createDownloadUrl(dataUrl, fileName);
  }

  public static downloadNewick(baseName: string, newick: string, completeCaseType: CompleteCaseType, t: TFunction<'translation', undefined>): void {
    const fileName = `${EpiDownloadUtil.getExportFileName(baseName, completeCaseType, t)}.txt`;
    EpiDownloadUtil.createDownloadUrl(`data:text/x-nh;base64,${btoa(newick)}`, fileName);
  }

  public static downloadAsCsv(cases: Case[], caseTypeColumnIds: string[], completeCaseType: CompleteCaseType, t: TFunction<'translation', undefined>): void {
    const csvStringifier = createArrayCsvStringifier({
      header: EpiDownloadUtil.getColumnHeadersForExport(caseTypeColumnIds, completeCaseType),
    });
    const csv = `${csvStringifier.getHeaderString()}${csvStringifier.stringifyRecords(EpiDownloadUtil.getRowsForExport(cases, caseTypeColumnIds, completeCaseType))}`;
    const fileName = `${EpiDownloadUtil.getExportFileName(t`Line list`, completeCaseType, t)}.csv`;
    EpiDownloadUtil.createDownloadUrl(`data:text/csv;base64,${btoa(csv)}`, fileName);
  }

  public static async downloadAsExcel(cases: Case[], caseTypeColumnIds: string[], completeCaseType: CompleteCaseType, t: TFunction<'translation', undefined>): Promise<void> {
    // Prepare headers
    const headers = EpiDownloadUtil.getColumnHeadersForExport(caseTypeColumnIds, completeCaseType);

    // Prepare data rows
    const rows = EpiDownloadUtil.getRowsForExport(cases, caseTypeColumnIds, completeCaseType);

    // Convert data to the format expected by write-excel-file (SheetData)
    // Each row is an array of Cell objects
    const data = [
      // Header row
      headers.map(header => ({ type: String, value: header })),
      // Data rows
      ...rows.map(row => row.map(cell => ({ type: String, value: cell }))),
    ];

    const fileName = `${EpiDownloadUtil.getExportFileName(t`Line list`, completeCaseType, t)}.xlsx`;

    // Generate Excel file as a Blob and download it
    const blob = await writeXlsxFile(data, {
      columns: headers.map(() => ({ width: 20 })),
    });

    // Convert blob to base64 and download
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    EpiDownloadUtil.createDownloadUrl(`data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`, fileName);
  }

  private static getColumnHeadersForExport(caseTypeColumnIds: string[], completeCaseType: CompleteCaseType): string[] {
    return [
      '_case_id',
      '_case_type',
      '_case_date',
      ...EpiDownloadUtil.getCaseTypeColumnsForExport(caseTypeColumnIds, completeCaseType).map(caseTypeColumn => caseTypeColumn.label),
    ];
  }

  private static getRowsForExport(cases: Case[], caseTypeColumnIds: string[], completeCaseType: CompleteCaseType): string[][] {
    return cases.map(row => [
      row.id,
      completeCaseType.name,
      row.case_date ? format(row.case_date, DATE_FORMAT.DATE) : '',
      ...EpiDownloadUtil.getCaseTypeColumnsForExport(caseTypeColumnIds, completeCaseType).map(caseTypeColumn => EpiCaseUtil.getRowValue(row, caseTypeColumn, completeCaseType).short),
    ]);
  }

  private static getCaseTypeColumnsForExport(caseTypeColumnIds: string[], completeCaseType: CompleteCaseType): CaseTypeCol[] {
    return EpiCaseTypeUtil.getCaseTypeColumns(completeCaseType)
      .filter(x => caseTypeColumnIds.includes(x.id))
      .sort((a, b) => {
        return caseTypeColumnIds.indexOf(a.id) - caseTypeColumnIds.indexOf(b.id);
      });
  }


}
