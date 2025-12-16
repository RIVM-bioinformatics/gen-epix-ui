import { type TFunction } from 'i18next';
import { format } from 'date-fns';
import type { ECharts } from 'echarts';
import writeXlsxFile from 'write-excel-file';
import { stringify } from 'csv-stringify/browser/esm/sync';

import {
  CaseApi,
  LogLevel,
  type Case,
  type CaseTypeCol,
  type CompleteCaseType,
} from '../../api';
import { ConfigManager } from '../../classes/managers/ConfigManager';
import { DATE_FORMAT } from '../../data/date';
import { StringUtil } from '../StringUtil';
import { EpiCaseTypeUtil } from '../EpiCaseTypeUtil';
import { EpiCaseUtil } from '../EpiCaseUtil';
import { AuthenticationManager } from '../../classes/managers/AuthenticationManager';
import { QueryClientManager } from '../../classes/managers/QueryClientManager';
import { QueryUtil } from '../QueryUtil';
import { QUERY_KEY } from '../../models/query';
import { NotificationManager } from '../../classes/managers/NotificationManager';
import { LogManager } from '../../classes/managers/LogManager';

export class EpiDownloadUtil {
  public static async downloadExcelTemplate(caseTypeId: string, t: TFunction<'translation', undefined>): Promise<void> {
    const queryClient = QueryClientManager.instance.queryClient;
    try {
      const completeCaseType = await queryClient.fetchQuery({
        queryKey: QueryUtil.getGenericKey(QUERY_KEY.COMPLETE_CASE_TYPES, caseTypeId),
        queryFn: async ({ signal }) => {
          return (await CaseApi.instance.completeCaseTypesGetOne(caseTypeId, { signal })).data;
        },
      });

      const headers = EpiDownloadUtil.getColumnHeadersForImport(
        EpiCaseTypeUtil.getWritableImportExportCaseTypeColIds(completeCaseType)
          .sort((a, b) => completeCaseType.ordered_case_type_col_ids.indexOf(a) - completeCaseType.ordered_case_type_col_ids.indexOf(b))
        , completeCaseType,
      );
      const data = [
        headers.map(header => ({ type: String, value: header })),
      ];
      const fileName = `${EpiDownloadUtil.getTemplateFileName(completeCaseType)}.xlsx`;

      // Generate Excel file as a Blob and download it
      const blob = await writeXlsxFile(data, {
        columns: headers.map(() => ({ width: 20 })),
        stickyRowsCount: 1,
        showGridLines: true,
      });

      // Convert blob to base64 and download
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = EpiDownloadUtil.arrayBufferToBase64(arrayBuffer);
      EpiDownloadUtil.createDownloadUrl(`data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`, fileName);
    } catch (error) {
      LogManager.instance.log([{
        detail: {
          error,
          stack: (error as Error)?.stack,
        },
        level: LogLevel.ERROR,
        topic: (error as Error)?.message ? `Error: ${(error as Error)?.message}` : 'Error',
      }]);
      NotificationManager.instance.showNotification({
        message: t('Excel template could not be created'),
        severity: 'error',
      });
    }
  }


  public static createDownloadUrl(url: string, name: string): void {
    const link = document.createElement('a');
    link.download = name;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  public static getExportFileName(baseName: string, completeCaseType: CompleteCaseType, t: TFunction<'translation', undefined>): string {
    return t('{{date}}--{{applicationName}}--{{caseTypeName}}--{{baseName}}', {
      applicationName: StringUtil.createSlug(ConfigManager.instance.config.applicationName),
      baseName: StringUtil.createSlug(baseName),
      date: format(new Date(), DATE_FORMAT.DATE),
      caseTypeName: StringUtil.createSlug(completeCaseType.name),
    });
  }

  public static getTemplateFileName(completeCaseType: CompleteCaseType): string {
    return `${StringUtil.createSlug(ConfigManager.instance.config.applicationName)}--${StringUtil.createSlug(completeCaseType.name)}--template`;
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
    const data = [
      EpiDownloadUtil.getColumnHeadersForExport(caseTypeColumnIds, completeCaseType),
      ...EpiDownloadUtil.getRowsForExport(cases, caseTypeColumnIds, completeCaseType),
    ];
    const csv = stringify(data, {
      defaultEncoding: 'utf-8',
    });
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
      stickyRowsCount: 1,
    });

    // Convert blob to base64 and download
    const arrayBuffer = await blob.arrayBuffer();
    const base64 = EpiDownloadUtil.arrayBufferToBase64(arrayBuffer);
    EpiDownloadUtil.createDownloadUrl(`data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64}`, fileName);
  }

  private static getColumnHeadersForImport(caseTypeColumnIds: string[], completeCaseType: CompleteCaseType): string[] {
    return [
      '_case_id',
      '_case_date',
      ...EpiDownloadUtil.getCaseTypeColumnsForImportExport(caseTypeColumnIds, completeCaseType).map(caseTypeColumn => caseTypeColumn.label),
    ];
  }

  private static getColumnHeadersForExport(caseTypeColumnIds: string[], completeCaseType: CompleteCaseType): string[] {
    return [
      '_case_id',
      '_case_type',
      '_case_date',
      ...EpiDownloadUtil.getCaseTypeColumnsForImportExport(caseTypeColumnIds, completeCaseType).map(caseTypeColumn => caseTypeColumn.label),
    ];
  }

  private static getRowsForExport(cases: Case[], caseTypeColumnIds: string[], completeCaseType: CompleteCaseType): string[][] {
    const caseTypeColumns = EpiDownloadUtil.getCaseTypeColumnsForImportExport(caseTypeColumnIds, completeCaseType);
    return cases.map(row => [
      row.id,
      completeCaseType.name,
      row.case_date ? format(row.case_date, DATE_FORMAT.DATE) : '',
      ...caseTypeColumns.map(caseTypeColumn => EpiCaseUtil.getRowValue(row, caseTypeColumn, completeCaseType, true).long),
    ]);
  }

  private static getCaseTypeColumnsForImportExport(caseTypeColumnIds: string[], completeCaseType: CompleteCaseType): CaseTypeCol[] {
    return EpiCaseTypeUtil.getCaseTypeColumns(completeCaseType)
      .filter(x => caseTypeColumnIds.includes(x.id))
      .sort((a, b) => {
        return caseTypeColumnIds.indexOf(a.id) - caseTypeColumnIds.indexOf(b.id);
      });
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
}
