import { type TFunction } from 'i18next';
import { format } from 'date-fns';
import type { ECharts } from 'echarts';
import writeXlsxFile from 'write-excel-file/browser';
import { stringify } from 'csv/browser/esm/sync';
import {
  type CaseDbCase,
  CaseDbCaseApi,
  type CaseDbCol,
  type CaseDbCompleteCaseType,
  CaseDbLogLevel,
} from '@gen-epix/api-casedb';
import {
  CommonDownloadUtil,
  ConfigManager,
  DATE_FORMAT,
  LogManager,
  NotificationManager,
  QUERY_KEY,
  QueryClientManager,
  QueryManager,
  StringUtil,
} from '@gen-epix/ui';

import { CaseTypeUtil } from '../CaseTypeUtil';
import { CaseUtil } from '../CaseUtil';

export class CaseDbDownloadUtil {
  public static downloadAsCsv(cases: CaseDbCase[], colIds: string[], completeCaseType: CaseDbCompleteCaseType, t: TFunction<'translation', undefined>): void {
    const data = [
      CaseDbDownloadUtil.getColumnHeadersForExport(colIds, completeCaseType),
      ...CaseDbDownloadUtil.getRowsForExport(cases, colIds, completeCaseType),
    ];
    const csv = stringify(data, {
      defaultEncoding: 'utf-8',
    });
    const fileName = `${CaseDbDownloadUtil.getExportFileName(t`Line list`, completeCaseType, t)}.csv`;
    CommonDownloadUtil.createDownloadUrl(`data:text/csv;base64,${btoa(csv)}`, fileName);
  }

  public static async downloadAsExcel(cases: CaseDbCase[], colIds: string[], completeCaseType: CaseDbCompleteCaseType, t: TFunction<'translation', undefined>): Promise<void> {
    // Prepare headers
    const headers = CaseDbDownloadUtil.getColumnHeadersForExport(colIds, completeCaseType);

    // Prepare data rows
    const rows = CaseDbDownloadUtil.getRowsForExport(cases, colIds, completeCaseType);

    // Convert data to the format expected by write-excel-file (SheetData)
    // Each row is an array of Cell objects
    const data = [
      // Header row
      headers.map(header => ({ type: String, value: header })),
      // Data rows
      ...rows.map(row => row.map(cell => ({ type: String, value: cell }))),
    ];

    const fileName = `${CaseDbDownloadUtil.getExportFileName(t`Line list`, completeCaseType, t)}.xlsx`;

    // Generate Excel file as a Blob and download it
    const blob = await writeXlsxFile(data, {
      columns: headers.map(() => ({ width: 20 })),
      stickyRowsCount: 1,
    });

    // Convert blob to base64 and download
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = CommonDownloadUtil.arrayBufferToBase64(arrayBuffer);
    CommonDownloadUtil.createDownloadUrl(`data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`, fileName);
  }

  public static downloadCanvasImage(baseName: string, canvas: HTMLCanvasElement, type: 'jpeg' | 'png', completeCaseType: CaseDbCompleteCaseType, t: TFunction<'translation', undefined>): void {
    const dataUrl = canvas.toDataURL(type === 'jpeg' ? 'image/jpeg' : 'image/png');
    const fileName = `${CaseDbDownloadUtil.getExportFileName(baseName, completeCaseType, t)}.${type}`;
    CommonDownloadUtil.createDownloadUrl(dataUrl, fileName);
  }

  public static downloadEchartsImage(baseName: string, instance: ECharts, type: 'jpeg' | 'png', completeCaseType: CaseDbCompleteCaseType, t: TFunction<'translation', undefined>): void {
    const url = instance.getDataURL({
      backgroundColor: '#fff',
      pixelRatio: 2,
      type,
    });
    const fileName = `${CaseDbDownloadUtil.getExportFileName(baseName, completeCaseType, t)}.${type.toLowerCase()}`;
    CommonDownloadUtil.createDownloadUrl(url, fileName);
  }

  public static async downloadExcelTemplate(caseTypeId: string, t: TFunction<'translation', undefined>): Promise<void> {
    const queryClient = QueryClientManager.getInstance().queryClient;
    try {
      const completeCaseType = await queryClient.fetchQuery({
        queryFn: async ({ signal }) => {
          return (await CaseDbCaseApi.getInstance().completeCaseTypesGetOne(caseTypeId, { signal })).data;
        },
        queryKey: QueryManager.getInstance().getGenericKey(QUERY_KEY.COMPLETE_CASE_TYPES, caseTypeId),
      });

      const headers = CaseDbDownloadUtil.getColumnHeadersForImport(
        CaseTypeUtil.getWritableImportExportColIds(completeCaseType)
          .sort((a, b) => completeCaseType.ordered_col_ids.indexOf(a) - completeCaseType.ordered_col_ids.indexOf(b))
        , completeCaseType,
      );
      const data = [
        headers.map(header => ({ type: String, value: header })),
      ];
      const fileName = `${CaseDbDownloadUtil.getTemplateFileName(completeCaseType)}.xlsx`;

      // Generate Excel file as a Blob and download it
      const blob = await writeXlsxFile(data, {
        columns: headers.map(() => ({ width: 20 })),
        showGridLines: true,
        stickyRowsCount: 1,
      });

      // Convert blob to base64 and download
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = CommonDownloadUtil.arrayBufferToBase64(arrayBuffer);
      CommonDownloadUtil.createDownloadUrl(`data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`, fileName);
    } catch (error) {
      LogManager.getInstance().log([{
        detail: {
          error,
          stack: (error as Error)?.stack,
        },
        level: CaseDbLogLevel.ERROR,
        topic: (error as Error)?.message ? `Error: ${(error as Error)?.message}` : 'Error',
      }]);
      NotificationManager.getInstance().showNotification({
        message: t('Excel template could not be created'),
        severity: 'error',
      });
    }
  }

  public static downloadNewick(baseName: string, newick: string, completeCaseType: CaseDbCompleteCaseType, t: TFunction<'translation', undefined>): void {
    const fileName = `${CaseDbDownloadUtil.getExportFileName(baseName, completeCaseType, t)}.txt`;
    CommonDownloadUtil.createDownloadUrl(`data:text/x-nh;base64,${btoa(newick)}`, fileName);
  }

  public static getExportFileName(baseName: string, completeCaseType: CaseDbCompleteCaseType, t: TFunction<'translation', undefined>): string {
    return t('{{date}}--{{applicationName}}--{{caseTypeName}}--{{baseName}}', {
      applicationName: StringUtil.createSlug(ConfigManager.getInstance().config.applicationName),
      baseName: StringUtil.createSlug(baseName),
      caseTypeName: StringUtil.createSlug(completeCaseType.name),
      date: format(new Date(), DATE_FORMAT.DATE),
    });
  }

  public static getTemplateFileName(completeCaseType: CaseDbCompleteCaseType): string {
    return `${StringUtil.createSlug(ConfigManager.getInstance().config.applicationName)}--${StringUtil.createSlug(completeCaseType.name)}--template`;
  }

  private static getColsForImportExport(colIds: string[], completeCaseType: CaseDbCompleteCaseType): CaseDbCol[] {
    return CaseTypeUtil.getCols(completeCaseType)
      .filter(x => colIds.includes(x.id))
      .sort((a, b) => {
        return colIds.indexOf(a.id) - colIds.indexOf(b.id);
      });
  }

  private static getColumnHeadersForExport(colIds: string[], completeCaseType: CaseDbCompleteCaseType): string[] {
    return [
      '_case_id',
      '_case_type',
      '_case_date',
      ...CaseDbDownloadUtil.getColsForImportExport(colIds, completeCaseType).map(col => col.label),
    ];
  }

  private static getColumnHeadersForImport(colIds: string[], completeCaseType: CaseDbCompleteCaseType): string[] {
    return [
      '_case_id',
      '_case_date',
      ...CaseDbDownloadUtil.getColsForImportExport(colIds, completeCaseType).map(col => col.label),
    ];
  }

  private static getRowsForExport(cases: CaseDbCase[], colIds: string[], completeCaseType: CaseDbCompleteCaseType): string[][] {
    const cols = CaseDbDownloadUtil.getColsForImportExport(colIds, completeCaseType);
    return cases.map(row => [
      row.id,
      completeCaseType.name,
      row.case_date ? format(row.case_date, DATE_FORMAT.DATE) : '',
      ...cols.map(col => CaseUtil.getRowValue(row.content, col, completeCaseType, true).long),
    ]);
  }
}
