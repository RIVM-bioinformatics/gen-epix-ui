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

import { ConfigManager } from '../../classes/managers/ConfigManager';
import { DATE_FORMAT } from '../../data/date';
import { StringUtil } from '../StringUtil';
import { CaseTypeUtil } from '../CaseTypeUtil';
import { CaseUtil } from '../CaseUtil';
import { AuthenticationManager } from '../../classes/managers/AuthenticationManager';
import { QueryClientManager } from '../../classes/managers/QueryClientManager';
import { QueryUtil } from '../QueryUtil';
import { QUERY_KEY } from '../../models/query';
import { NotificationManager } from '../../classes/managers/NotificationManager';
import { LogManager } from '../../classes/managers/LogManager';

export class DownloadUtil {
  public static createDownloadUrl(url: string, name: string): void {
    const link = document.createElement('a');
    link.download = name;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }


  public static downloadAsCsv(cases: CaseDbCase[], colIds: string[], completeCaseType: CaseDbCompleteCaseType, t: TFunction<'translation', undefined>): void {
    const data = [
      DownloadUtil.getColumnHeadersForExport(colIds, completeCaseType),
      ...DownloadUtil.getRowsForExport(cases, colIds, completeCaseType),
    ];
    const csv = stringify(data, {
      defaultEncoding: 'utf-8',
    });
    const fileName = `${DownloadUtil.getExportFileName(t`Line list`, completeCaseType, t)}.csv`;
    DownloadUtil.createDownloadUrl(`data:text/csv;base64,${btoa(csv)}`, fileName);
  }

  public static async downloadAsExcel(cases: CaseDbCase[], colIds: string[], completeCaseType: CaseDbCompleteCaseType, t: TFunction<'translation', undefined>): Promise<void> {
    // Prepare headers
    const headers = DownloadUtil.getColumnHeadersForExport(colIds, completeCaseType);

    // Prepare data rows
    const rows = DownloadUtil.getRowsForExport(cases, colIds, completeCaseType);

    // Convert data to the format expected by write-excel-file (SheetData)
    // Each row is an array of Cell objects
    const data = [
      // Header row
      headers.map(header => ({ type: String, value: header })),
      // Data rows
      ...rows.map(row => row.map(cell => ({ type: String, value: cell }))),
    ];

    const fileName = `${DownloadUtil.getExportFileName(t`Line list`, completeCaseType, t)}.xlsx`;

    // Generate Excel file as a Blob and download it
    const blob = await writeXlsxFile(data, {
      columns: headers.map(() => ({ width: 20 })),
      stickyRowsCount: 1,
    });

    // Convert blob to base64 and download
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = DownloadUtil.arrayBufferToBase64(arrayBuffer);
    DownloadUtil.createDownloadUrl(`data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`, fileName);
  }

  public static downloadAsMultiPartForm(kwArgs: { action: string; data: Record<string, string | string[]> }): void {
    const formElement = document.createElement('form');
    formElement.method = 'POST';
    formElement.action = kwArgs.action;
    formElement.style.display = 'none';
    formElement.target = '_blank';

    Object.entries(kwArgs.data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => {
          const input = document.createElement('input');
          input.name = key;
          input.value = v;
          formElement.appendChild(input);
        });
        return;
      }

      const input = document.createElement('input');
      input.name = key;
      input.value = value;
      formElement.appendChild(input);
    });
    const input = document.createElement('input');
    input.name = 'token';
    input.value = AuthenticationManager.instance.authContextProps?.user?.access_token ?? '';
    formElement.appendChild(input);

    document.body.appendChild(formElement);
    formElement.submit();
    document.body.removeChild(formElement);
  }

  public static downloadCanvasImage(baseName: string, canvas: HTMLCanvasElement, type: 'jpeg' | 'png', completeCaseType: CaseDbCompleteCaseType, t: TFunction<'translation', undefined>): void {
    const dataUrl = canvas.toDataURL(type === 'jpeg' ? 'image/jpeg' : 'image/png');
    const fileName = `${DownloadUtil.getExportFileName(baseName, completeCaseType, t)}.${type}`;
    DownloadUtil.createDownloadUrl(dataUrl, fileName);
  }

  public static downloadEchartsImage(baseName: string, instance: ECharts, type: 'jpeg' | 'png', completeCaseType: CaseDbCompleteCaseType, t: TFunction<'translation', undefined>): void {
    const url = instance.getDataURL({
      backgroundColor: '#fff',
      pixelRatio: 2,
      type,
    });
    const fileName = `${DownloadUtil.getExportFileName(baseName, completeCaseType, t)}.${type.toLowerCase()}`;
    DownloadUtil.createDownloadUrl(url, fileName);
  }

  public static async downloadExcelTemplate(caseTypeId: string, t: TFunction<'translation', undefined>): Promise<void> {
    const queryClient = QueryClientManager.instance.queryClient;
    try {
      const completeCaseType = await queryClient.fetchQuery({
        queryFn: async ({ signal }) => {
          return (await CaseDbCaseApi.instance.completeCaseTypesGetOne(caseTypeId, { signal })).data;
        },
        queryKey: QueryUtil.getGenericKey(QUERY_KEY.COMPLETE_CASE_TYPES, caseTypeId),
      });

      const headers = DownloadUtil.getColumnHeadersForImport(
        CaseTypeUtil.getWritableImportExportColIds(completeCaseType)
          .sort((a, b) => completeCaseType.ordered_col_ids.indexOf(a) - completeCaseType.ordered_col_ids.indexOf(b))
        , completeCaseType,
      );
      const data = [
        headers.map(header => ({ type: String, value: header })),
      ];
      const fileName = `${DownloadUtil.getTemplateFileName(completeCaseType)}.xlsx`;

      // Generate Excel file as a Blob and download it
      const blob = await writeXlsxFile(data, {
        columns: headers.map(() => ({ width: 20 })),
        showGridLines: true,
        stickyRowsCount: 1,
      });

      // Convert blob to base64 and download
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = DownloadUtil.arrayBufferToBase64(arrayBuffer);
      DownloadUtil.createDownloadUrl(`data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`, fileName);
    } catch (error) {
      LogManager.instance.log([{
        detail: {
          error,
          stack: (error as Error)?.stack,
        },
        level: CaseDbLogLevel.ERROR,
        topic: (error as Error)?.message ? `Error: ${(error as Error)?.message}` : 'Error',
      }]);
      NotificationManager.instance.showNotification({
        message: t('Excel template could not be created'),
        severity: 'error',
      });
    }
  }

  public static downloadNewick(baseName: string, newick: string, completeCaseType: CaseDbCompleteCaseType, t: TFunction<'translation', undefined>): void {
    const fileName = `${DownloadUtil.getExportFileName(baseName, completeCaseType, t)}.txt`;
    DownloadUtil.createDownloadUrl(`data:text/x-nh;base64,${btoa(newick)}`, fileName);
  }

  public static getExportFileName(baseName: string, completeCaseType: CaseDbCompleteCaseType, t: TFunction<'translation', undefined>): string {
    return t('{{date}}--{{applicationName}}--{{caseTypeName}}--{{baseName}}', {
      applicationName: StringUtil.createSlug(ConfigManager.instance.config.applicationName),
      baseName: StringUtil.createSlug(baseName),
      caseTypeName: StringUtil.createSlug(completeCaseType.name),
      date: format(new Date(), DATE_FORMAT.DATE),
    });
  }

  public static getTemplateFileName(completeCaseType: CaseDbCompleteCaseType): string {
    return `${StringUtil.createSlug(ConfigManager.instance.config.applicationName)}--${StringUtil.createSlug(completeCaseType.name)}--template`;
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
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
      ...DownloadUtil.getColsForImportExport(colIds, completeCaseType).map(col => col.label),
    ];
  }

  private static getColumnHeadersForImport(colIds: string[], completeCaseType: CaseDbCompleteCaseType): string[] {
    return [
      '_case_id',
      '_case_date',
      ...DownloadUtil.getColsForImportExport(colIds, completeCaseType).map(col => col.label),
    ];
  }

  private static getRowsForExport(cases: CaseDbCase[], colIds: string[], completeCaseType: CaseDbCompleteCaseType): string[][] {
    const cols = DownloadUtil.getColsForImportExport(colIds, completeCaseType);
    return cases.map(row => [
      row.id,
      completeCaseType.name,
      row.case_date ? format(row.case_date, DATE_FORMAT.DATE) : '',
      ...cols.map(col => CaseUtil.getRowValue(row.content, col, completeCaseType, true).long),
    ]);
  }
}
