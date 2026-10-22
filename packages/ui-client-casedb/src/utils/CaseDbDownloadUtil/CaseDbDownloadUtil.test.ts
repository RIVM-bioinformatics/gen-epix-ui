import {
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { container } from 'tsyringe';
import i18next from 'i18next';
import type { TFunction } from 'i18next';
import type { ECharts } from 'echarts';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import type {
  CaseDbCase,
  CaseDbCol,
  CaseDbCompleteCaseType,
} from '@gen-epix/api-casedb';
import { QueryClientService } from '@gen-epix/ui-client-common/classes/services/QueryClientService';
import { LogService } from '@gen-epix/ui-client-common/classes/services/LogService';
import { NotificationService } from '@gen-epix/ui-client-common/classes/services/NotificationService';
import { DownloadUtil } from '@gen-epix/ui-core/utils/DownloadUtil';

import { CaseTypeUtil } from '../CaseTypeUtil';
import { CaseUtil } from '../CaseUtil';

import { CaseDbDownloadUtil } from './CaseDbDownloadUtil';

let translate: TFunction<'translation', undefined>;

const createColumn = (id: string, label: string): CaseDbCol => ({
  case_type_id: 'case-type-1',
  code: id,
  dim_id: 'dimension-1',
  id,
  label,
  rank: 1,
  ref_col_id: `ref-${id}`,
});

const createCompleteCaseType = (): CaseDbCompleteCaseType => ({
  cols: {
    'col-1': createColumn('col-1', 'Column one'),
    'col-2': createColumn('col-2', 'Column two'),
  },
  id: 'case-type-1',
  name: 'Case type one',
  ordered_col_ids: ['col-1', 'col-2'],
} as unknown as CaseDbCompleteCaseType);

const createCase = (id: string, timedAt?: null | string): CaseDbCase => ({
  content: {},
  id,
  timed_at: timedAt,
} as CaseDbCase);

const createTemplateApiHarness = (completeCaseType: CaseDbCompleteCaseType, error?: Error) => {
  const queryClientService = new QueryClientService({
    config: {
      queryClient: {
        retry: () => false,
        retryDelay: () => 0,
      },
    },
    queryKeyDependencies: [],
  });
  const completeCaseTypesGetOne = vi.fn(async (_caseTypeId: string, { signal }: { signal: AbortSignal }) => {
    if (error) {
      return Promise.reject(error);
    }
    return Promise.resolve({ data: completeCaseType, signal });
  });
  container.registerInstance(QueryClientService, queryClientService);
  container.registerInstance(CaseDbCaseApi, { completeCaseTypesGetOne } as unknown as CaseDbCaseApi);

  return {
    completeCaseTypesGetOne,
    queryClientService,
  };
};

beforeAll(async () => {
  await i18next.init({
    lng: 'en',
    resources: {
      en: {
        translation: {
          '{{date}}--{{applicationName}}--{{caseTypeName}}--{{baseName}}': '{{date}}--{{applicationName}}--{{caseTypeName}}--{{baseName}}',
          'Excel template could not be created': 'Excel template could not be created',
          'Line list': 'Line list',
        },
      },
    },
  });
  translate = i18next.getFixedT('en');
});

afterEach(() => {
  vi.restoreAllMocks();
  container.resolve(QueryClientService).queryClient.clear();
});

describe('CaseDbDownloadUtil CSV and Excel exports', () => {
  it('exports ordered columns and UTF-8 case values as CSV', () => {
    const completeCaseType = createCompleteCaseType();
    const cases = [
      createCase('case-1', '2024-01-02T00:00:00.000Z'),
      createCase('case-2'),
    ];
    const createDownloadUrl = vi.spyOn(DownloadUtil, 'createDownloadUrl').mockImplementation(() => undefined);
    vi.spyOn(CaseUtil, 'getRowValue').mockReturnValue({ long: 'café' } as ReturnType<typeof CaseUtil.getRowValue>);

    CaseDbDownloadUtil.downloadAsCsv(cases, ['col-2', 'col-1'], completeCaseType, translate);

    const [dataUrl, fileName] = createDownloadUrl.mock.calls[0] ?? [];
    expect(fileName).toMatch(/\.csv$/);
    expect(dataUrl).toMatch(/^data:text\/csv;base64,/);
    const encodedCsv = dataUrl.split(',')[1];
    const csv = new TextDecoder().decode(Uint8Array.from(atob(encodedCsv), character => character.charCodeAt(0)));
    expect(csv).toContain('_case_id,_case_type,_case_date,Column two,Column one');
    expect(csv).toContain('case-1,Case type one,2024-01-02,café,café');
    expect(csv).toContain('case-2,Case type one,,café,café');
  });

  it('writes Excel cells as text and downloads the generated workbook', async () => {
    const completeCaseType = createCompleteCaseType();
    const arrayBufferToBase64 = vi.spyOn(DownloadUtil, 'arrayBufferToBase64').mockReturnValue('excel-base64');
    const createDownloadUrl = vi.spyOn(DownloadUtil, 'createDownloadUrl').mockImplementation(() => undefined);
    vi.spyOn(CaseUtil, 'getRowValue').mockReturnValue({ long: 'Value' } as ReturnType<typeof CaseUtil.getRowValue>);

    await CaseDbDownloadUtil.downloadAsExcel([createCase('case-1')], ['col-1'], completeCaseType, translate);

    expect(arrayBufferToBase64).toHaveBeenCalledOnce();
    expect(createDownloadUrl).toHaveBeenCalledWith(
      'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,excel-base64',
      expect.stringMatching(/\.xlsx$/),
    );
  });

  it('propagates workbook generation failures', async () => {
    const error = new Error('Workbook failed');
    vi.spyOn(DownloadUtil, 'arrayBufferToBase64').mockImplementation(() => {
      throw error;
    });

    await expect(CaseDbDownloadUtil.downloadAsExcel([], [], createCompleteCaseType(), translate)).rejects.toBe(error);
  });
});

describe('CaseDbDownloadUtil image and Newick exports', () => {
  it.each([
    ['jpeg', 'image/jpeg'],
    ['png', 'image/png'],
  ] as const)('downloads a canvas image as %s', (type, mimeType) => {
    const canvas = { toDataURL: vi.fn(() => `${mimeType};base64,data`) } as unknown as HTMLCanvasElement;
    const createDownloadUrl = vi.spyOn(DownloadUtil, 'createDownloadUrl').mockImplementation(() => undefined);

    CaseDbDownloadUtil.downloadCanvasImage('canvas', canvas, type, createCompleteCaseType(), translate);

    expect(canvas.toDataURL).toHaveBeenCalledWith(mimeType);
    expect(createDownloadUrl).toHaveBeenCalledWith(`${mimeType};base64,data`, expect.stringMatching(new RegExp(`\\.${type}$`)));
  });

  it.each(['jpeg', 'png'] as const)('downloads an ECharts image as %s', (type) => {
    const instance = { getDataURL: vi.fn(() => 'data:image;base64,chart') } as unknown as ECharts;
    const createDownloadUrl = vi.spyOn(DownloadUtil, 'createDownloadUrl').mockImplementation(() => undefined);

    CaseDbDownloadUtil.downloadEchartsImage('chart', instance, type, createCompleteCaseType(), translate);

    expect(instance.getDataURL).toHaveBeenCalledWith({
      backgroundColor: '#fff',
      pixelRatio: 2,
      type,
    });
    expect(createDownloadUrl).toHaveBeenCalledWith('data:image;base64,chart', expect.stringMatching(new RegExp(`\\.${type}$`)));
  });

  it('downloads Unicode Newick text using UTF-8 encoding', () => {
    const createDownloadUrl = vi.spyOn(DownloadUtil, 'createDownloadUrl').mockImplementation(() => undefined);
    const newick = '(café,病例)root;';

    CaseDbDownloadUtil.downloadNewick('tree', newick, createCompleteCaseType(), translate);

    const [dataUrl, fileName] = createDownloadUrl.mock.calls[0] ?? [];
    expect(fileName).toMatch(/\.txt$/);
    expect(dataUrl).toMatch(/^data:text\/x-nh;base64,/);
    const encodedNewick = dataUrl.split(',')[1];
    const decodedNewick = new TextDecoder().decode(Uint8Array.from(atob(encodedNewick), character => character.charCodeAt(0)));
    expect(decodedNewick).toBe(newick);
  });
});

describe('CaseDbDownloadUtil Excel templates and filenames', () => {
  it('creates an Excel template with import columns in case-type order', async () => {
    const completeCaseType = createCompleteCaseType();
    const { completeCaseTypesGetOne, queryClientService } = createTemplateApiHarness(completeCaseType);
    const getWritableImportExportColIds = vi.spyOn(CaseTypeUtil, 'getWritableImportExportColIds').mockReturnValue(['col-2', 'col-1']);
    vi.spyOn(DownloadUtil, 'arrayBufferToBase64').mockReturnValue('template-base64');
    const createDownloadUrl = vi.spyOn(DownloadUtil, 'createDownloadUrl').mockImplementation(() => undefined);

    await CaseDbDownloadUtil.downloadExcelTemplate('case-type-1', translate);

    expect(completeCaseTypesGetOne.mock.calls[0]?.[0]).toBe('case-type-1');
    expect(completeCaseTypesGetOne.mock.calls[0]?.[1].signal).toBeInstanceOf(AbortSignal);
    expect(getWritableImportExportColIds).toHaveBeenCalledWith(completeCaseType);
    expect(queryClientService.queryClient.getQueryCache().getAll()).toHaveLength(1);
    expect(createDownloadUrl).toHaveBeenCalledWith(
      'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,template-base64',
      expect.stringMatching(/--template\.xlsx$/),
    );
  });

  it('logs and notifies when the template request fails', async () => {
    const error = new Error('Case type unavailable');
    const { completeCaseTypesGetOne } = createTemplateApiHarness(createCompleteCaseType(), error);
    const log = vi.spyOn(container.resolve(LogService), 'log').mockImplementation(() => undefined);
    const notification = vi.spyOn(container.resolve(NotificationService), 'showNotification').mockImplementation(() => undefined);

    await CaseDbDownloadUtil.downloadExcelTemplate('case-type-1', translate);

    expect(completeCaseTypesGetOne).toHaveBeenCalledOnce();
    expect(log).toHaveBeenCalledOnce();
    expect(notification).toHaveBeenCalledWith({
      message: 'Excel template could not be created',
      severity: 'error',
    });
  });

  it('uses a generic log topic for errors without a message', async () => {
    createTemplateApiHarness(createCompleteCaseType(), new Error(''));
    const log = vi.spyOn(container.resolve(LogService), 'log').mockImplementation(() => undefined);

    await CaseDbDownloadUtil.downloadExcelTemplate('case-type-1', translate);

    expect(log.mock.calls[0]?.[0][0]?.topic).toBe('Error');
  });

  it('creates export and template filenames from slugs and the current date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-02-03T12:00:00.000Z'));
    const completeCaseType = createCompleteCaseType();

    expect(CaseDbDownloadUtil.getExportFileName('Line list', completeCaseType, translate)).toContain('2024-02-03');
    expect(CaseDbDownloadUtil.getExportFileName('Line list', completeCaseType, translate)).toContain('case-type-one');
    expect(CaseDbDownloadUtil.getTemplateFileName(completeCaseType)).toMatch(/case-type-one--template$/);

    vi.useRealTimers();
  });
});
