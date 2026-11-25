import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import type { ReactElement } from 'react';
import { t } from 'i18next';
import { DATE_FORMAT } from '@gen-epix/ui-core/constants/date.constants';
import { DownloadUtil } from '@gen-epix/ui-core/utils/DownloadUtil';
import type { OptionBase } from '@gen-epix/ui-core-form/models/form.models';

import { DateFilter } from '../../classes/filters/DateFilter';
import { MultiSelectFilter } from '../../classes/filters/MultiSelectFilter';
import { NumberRangeFilter } from '../../classes/filters/NumberRangeFilter';
import { TextFilter } from '../../classes/filters/TextFilter';
import type { Filters } from '../../models/filter.models';
import type {
  TableColumn,
  TableColumnBoolean,
  TableColumnDate,
  TableColumnDimension,
  TableColumnNumber,
  TableColumnOptions,
  TableColumnText,
  TableColumnVisualSettings,
} from '../../models/table.models';
import {
  FIXED_COLUMN_ID,
  TABLE_COLUMN_FROZEN,
} from '../../models/table.models';
import type { ConfigBase } from '../../models/config.models';
import { DependencyContainerUtil } from '../DependencyContainerUtil';

import { TableUtil } from './TableUtil';

const { writeXlsxFileMock } = vi.hoisted(() => ({
  writeXlsxFileMock: vi.fn(),
}));

vi.mock('write-excel-file/browser', () => ({
  default: writeXlsxFileMock,
}));

interface NumericOptionRow {
  seq_format: number;
}

interface TestRow {
  active: boolean;
  allTags: string | string[];
  date: string;
  id: string;
  name: string;
  options: string | string[];
  score: number;
  tags: string | string[];
}

const INITIAL_LOCATION = `${window.location.pathname}${window.location.search}${window.location.hash}`;
const OPTION_VALUES: OptionBase<string>[] = [
  { label: 'Alpha', value: 'a' },
  { label: 'Beta', value: 'b' },
  { label: 'Gamma', value: 'c' },
];

const createTextColumn = (id: keyof TestRow, name = String(id)): TableColumnText<TestRow> => {
  return TableUtil.createTextColumn<TestRow>({ id, name });
};

const createVisualSettings = (
  id: string,
  overrides: Partial<TableColumnVisualSettings> = {},
): TableColumnVisualSettings => ({
  id,
  isVisible: true,
  widthFlex: 0,
  widthPx: 0,
  ...overrides,
});

const createRow = (overrides: Partial<TestRow> = {}): TestRow => ({
  active: false,
  allTags: 'a',
  date: '2020-06-01T10:00:00.000Z',
  id: 'row-1',
  name: 'Alpha',
  options: 'a',
  score: 1,
  tags: 'a',
  ...overrides,
});

const createDimension = (id: string, columnIds: string[]): TableColumnDimension => ({
  columnIds,
  id,
  label: id,
});

const decodeCsvDataUrl = (url: string): string => {
  const encodedCsv = url.split(',')[1] ?? '';
  return new TextDecoder().decode(Uint8Array.from(atob(encodedCsv), character => character.charCodeAt(0)));
};

const setLocation = (url: string) => {
  window.history.replaceState({}, '', url);
};

const getFilter = (filters: Filters, id: string) => {
  const filter = filters.find(candidate => candidate.id === id);
  if (!filter) {
    throw new Error(`Expected a filter with ID "${id}".`);
  }
  return filter;
};

beforeAll(() => {
  DependencyContainerUtil.registerConfig({
    table: {
      CONDENSED_WIDTH_PX: 140,
    },
  } as ConfigBase);
});

afterEach(() => {
  vi.restoreAllMocks();
  writeXlsxFileMock.mockReset();
  window.history.replaceState({}, '', INITIAL_LOCATION);
});

afterAll(() => {
  vi.useRealTimers();
});

describe('TableUtil column builders', () => {
  it('validates column visual settings against column IDs', () => {
    const columns = [createTextColumn('name'), createTextColumn('id')];

    expect(TableUtil.areColumnVisualSettingsValid(columns, [])).toBe(false);
    expect(TableUtil.areColumnVisualSettingsValid(columns, [
      createVisualSettings('id'),
      createVisualSettings('name'),
    ])).toBe(true);
    expect(TableUtil.areColumnVisualSettingsValid(columns, [
      createVisualSettings('name'),
      createVisualSettings('missing'),
    ])).toBe(false);
    expect(TableUtil.areColumnVisualSettingsValid(columns, [createVisualSettings('name')])).toBe(false);
    expect(TableUtil.areColumnVisualSettingsValid(columns, [
      createVisualSettings('name'),
      createVisualSettings('name'),
    ])).toBe(false);
  });

  it('rejects column visual settings that hide a frozen column', () => {
    const columns = [
      { ...createTextColumn('name'), frozen: TABLE_COLUMN_FROZEN.LEFT },
      createTextColumn('id'),
    ];

    expect(TableUtil.areColumnVisualSettingsValid(columns, [
      createVisualSettings('name', { isVisible: false }),
      createVisualSettings('id'),
    ])).toBe(false);
    expect(TableUtil.areColumnVisualSettingsValid(columns, [
      createVisualSettings('name'),
      createVisualSettings('id', { isVisible: false }),
    ])).toBe(true);
  });

  it('reconciles column visual settings with the table columns', () => {
    const columns = [
      { ...createTextColumn('name'), frozen: TABLE_COLUMN_FROZEN.LEFT },
      createTextColumn('id'),
      createTextColumn('date'),
    ];

    const reconciled = TableUtil.reconcileColumnVisualSettings(columns, [
      createVisualSettings('date'),
      createVisualSettings('missing'),
      createVisualSettings('name', { isVisible: false }),
      createVisualSettings('date'),
    ]);

    expect(reconciled.map(s => s.id)).toEqual(['date', 'name', 'id']);
    expect(reconciled.find(s => s.id === 'name')?.isVisible).toBe(true);
    expect(TableUtil.areColumnVisualSettingsValid(columns, reconciled)).toBe(true);
  });

  it('inserts missing columns after their preceding column', () => {
    const columns = [createTextColumn('name'), createTextColumn('id'), createTextColumn('score')];

    const reconciled = TableUtil.reconcileColumnVisualSettings(columns, [
      createVisualSettings('name'),
      createVisualSettings('score'),
    ]);

    expect(reconciled.map(s => s.id)).toEqual(['name', 'id', 'score']);
    expect(TableUtil.areColumnVisualSettingsValid(columns, reconciled)).toBe(true);
  });

  it('returns the same instance when column visual settings are already valid', () => {
    const columns = [createTextColumn('name'), createTextColumn('id')];
    const settings = [createVisualSettings('id'), createVisualSettings('name')];

    expect(TableUtil.reconcileColumnVisualSettings(columns, settings)).toBe(settings);
  });

  it('keeps the settings unchanged when no columns are known yet', () => {
    const settings = [createVisualSettings('name')];

    expect(TableUtil.reconcileColumnVisualSettings([], settings)).toBe(settings);
  });

  it('creates the supported column definitions with defaults and overrides', () => {
    const getActions = (): ReactElement[] => [];
    const actionColumn = TableUtil.createActionsColumn<TestRow>({ getActions, t });
    const defaultBooleanColumn = TableUtil.createBooleanColumn<TestRow>({ name: 'Active' });
    const booleanColumn = TableUtil.createBooleanColumn<TestRow, null, string>({
      columnContext: 'column-context',
      filterLabel: 'Active filter',
      flex: 0,
      id: 'active',
      name: 'Active',
    });
    const defaultDateColumn = TableUtil.createDateColumn<TestRow>({ id: 'date', name: 'Date' });
    const dateColumn = TableUtil.createDateColumn<TestRow, null, string>({
      dateFormat: DATE_FORMAT.DATE_TIME,
      filterLabel: 'Date filter',
      flex: 2,
      id: 'date',
      name: 'Date',
    });
    const defaultNumberColumn = TableUtil.createNumberColumn<TestRow>({ id: 'score', name: 'Score' });
    const numberColumn = TableUtil.createNumberColumn<TestRow>({ flex: 0, id: 'score', name: 'Score' });
    const defaultOptionsColumn = TableUtil.createOptionsColumn<TestRow>({
      id: 'options',
      name: 'Options',
      options: OPTION_VALUES,
    });
    const optionsColumn = TableUtil.createOptionsColumn<TestRow>({
      flex: 0,
      id: 'options',
      maxNumOptionsExpanded: 0,
      name: 'Options',
      options: OPTION_VALUES,
      shouldFilterOptions: true,
    });
    const defaultReadableColumn = TableUtil.createReadableIndexColumn<TestRow>();
    const readableColumn = TableUtil.createReadableIndexColumn<TestRow, null, string>({
      columnContext: 'index-context',
      getAriaLabel: ({ row }) => row.name,
    });
    const defaultSelectableColumn = TableUtil.createSelectableColumn<TestRow>();
    const isDisabled = ({ row }: { row: TestRow }) => row.active;
    const selectableColumn = TableUtil.createSelectableColumn<TestRow, null, string>({
      columnContext: 'select-context',
      isDisabled,
    });
    const defaultTextColumn = TableUtil.createTextColumn<TestRow>({ id: 'name', name: 'Name' });
    const advancedTextColumn = TableUtil.createTextColumn<TestRow, null, string>({
      advancedSort: true,
      columnContext: 'text-context',
      filterLabel: 'Name filter',
      flex: 0,
      id: 'name',
      name: 'Name',
    });

    expect(actionColumn).toMatchObject({
      frozen: TABLE_COLUMN_FROZEN.RIGHT,
      id: FIXED_COLUMN_ID.ACTIONS,
      isInitiallyVisible: true,
      resizable: false,
      type: 'actions',
      widthPx: 48,
    });
    expect(actionColumn.getActions).toBe(getActions);
    expect(defaultBooleanColumn.widthFlex).toBe(0.25);
    expect(booleanColumn).toMatchObject({
      columnContext: 'column-context',
      filterLabel: 'Active filter',
      id: 'active',
      type: 'boolean',
      widthFlex: 0,
    });
    expect(defaultDateColumn.dateFormat).toBe(DATE_FORMAT.DATE);
    expect(dateColumn).toMatchObject({
      dateFormat: DATE_FORMAT.DATE_TIME,
      filterLabel: 'Date filter',
      type: 'date',
      widthFlex: 2,
    });
    expect(defaultNumberColumn.widthFlex).toBe(1);
    expect(numberColumn).toMatchObject({ textAlign: 'right', widthFlex: 0 });
    expect(defaultOptionsColumn.maxNumOptionsExpanded).toBe(5);
    expect(optionsColumn).toMatchObject({
      maxNumOptionsExpanded: 0,
      options: OPTION_VALUES,
      shouldFilterOptions: true,
      type: 'options',
      widthFlex: 0,
    });
    expect(defaultReadableColumn).toMatchObject({
      frozen: TABLE_COLUMN_FROZEN.LEFT,
      id: FIXED_COLUMN_ID.READABLE_INDEX,
      type: 'readableIndex',
    });
    expect(defaultReadableColumn.getAriaLabel).toBeTypeOf('function');
    expect(defaultReadableColumn.getAriaLabel({
      dataContext: null,
      id: 'row-1',
      row: createRow(),
      rowIndex: 0,
    })).toBeNull();
    expect(defaultReadableColumn.widthPxFn(0)).toBe(26);
    expect(defaultReadableColumn.widthPxFn(100)).toBe(46);
    expect(readableColumn.columnContext).toBe('index-context');
    expect(readableColumn.getAriaLabel({
      dataContext: null,
      id: 'row-1',
      row: createRow({ name: 'Accessible name' }),
      rowIndex: 0,
    })).toBe('Accessible name');
    expect(defaultSelectableColumn).toMatchObject({
      frozen: TABLE_COLUMN_FROZEN.LEFT,
      id: FIXED_COLUMN_ID.ROW_SELECT,
      resizable: false,
      type: 'selectable',
      widthPx: 38,
    });
    expect(selectableColumn.columnContext).toBe('select-context');
    expect(selectableColumn.isDisabled({ dataContext: null, id: 'row-1', row: createRow({ active: true }), rowIndex: 0 })).toBe(true);
    expect(defaultTextColumn.comparatorFactory).toBe(TableUtil.createTextCellRowComperator);
    expect(advancedTextColumn).toMatchObject({
      columnContext: 'text-context',
      filterLabel: 'Name filter',
      widthFlex: 0,
    });
    expect(advancedTextColumn.comparatorFactory).toBe(TableUtil.createTextCellRowAdvancedComperator);
  });

  it('creates initial visual settings for the configured columns', () => {
    const columns: TableColumn<TestRow>[] = [
      {
        ...createTextColumn('name'),
        widthPx: 180,
        widthPxFn: dataLength => dataLength + 10,
      },
      {
        ...createTextColumn('id'),
        isInitiallyVisible: false,
      },
    ];

    const settings = TableUtil.createInitialVisualColumnSettings(columns);

    expect(settings).toHaveLength(2);
    expect(settings[0]).toMatchObject({
      id: 'name',
      isVisible: true,
      label: 'name',
      widthFlex: 1,
      widthPx: 180,
    });
    expect(settings[1]).toMatchObject({
      id: 'id',
      isVisible: false,
      label: 'id',
      widthFlex: 1,
    });
    expect(Reflect.get(settings[0], 'widthPxFn')).toBeTypeOf('function');
    expect(Reflect.get(settings[1], 'widthPxFn')).toBeUndefined();
  });

  it('clones condensed settings, exposes colored columns, and positions them after pinned columns', () => {
    const leftColumn: TableColumnText<TestRow> = {
      ...createTextColumn('id'),
      frozen: TABLE_COLUMN_FROZEN.LEFT,
    };
    const coloredColumn: TableColumnText<TestRow> = {
      ...createTextColumn('name'),
      cellColorGetter: () => 'red',
    };
    const standardColumn = TableUtil.createNumberColumn<TestRow>({ id: 'score', name: 'Score' });
    const rightColumn: TableColumnText<TestRow> = {
      ...createTextColumn('tags'),
      frozen: TABLE_COLUMN_FROZEN.RIGHT,
    };
    const missingSettingColumn: TableColumnText<TestRow> = {
      ...createTextColumn('options'),
      cellColorGetter: () => 'blue',
    };
    const columns: TableColumn<TestRow>[] = [
      leftColumn,
      coloredColumn,
      standardColumn,
      rightColumn,
      missingSettingColumn,
    ];
    const settings = [
      createVisualSettings('id'),
      createVisualSettings('score'),
      createVisualSettings('name', { isVisible: false, widthPx: 70 }),
      createVisualSettings('tags'),
    ];

    const condensedSettings = TableUtil.createCondensedVisualColumnSettingsFromColumnSettings(columns, settings);

    expect(condensedSettings).not.toBe(settings);
    expect(condensedSettings.map(setting => setting.id)).toEqual(['id', 'name', 'score', 'tags']);
    expect(condensedSettings.find(setting => setting.id === 'name')).toMatchObject({
      isVisible: true,
      widthPx: 140,
    });
    expect(settings.find(setting => setting.id === 'name')).toMatchObject({
      isVisible: false,
      widthPx: 70,
    });
  });

  it('moves a condensed column forward when it precedes a left-pinned column', () => {
    const leftColumn: TableColumnText<TestRow> = {
      ...createTextColumn('id'),
      frozen: TABLE_COLUMN_FROZEN.LEFT,
    };
    const coloredColumn: TableColumnText<TestRow> = {
      ...createTextColumn('name'),
      cellColorGetter: () => 'red',
    };
    const standardColumn = createTextColumn('score');
    const columns: TableColumn<TestRow>[] = [leftColumn, coloredColumn, standardColumn];
    const settings = [
      createVisualSettings('name'),
      createVisualSettings('id'),
      createVisualSettings('score'),
    ];

    const condensedSettings = TableUtil.createCondensedVisualColumnSettingsFromColumnSettings(columns, settings);

    expect(condensedSettings.map(setting => setting.id)).toEqual(['score', 'id', 'name']);
  });

  it('moves a condensed column past hidden columns without losing or duplicating columns', () => {
    const leftColumn: TableColumnText<TestRow> = {
      ...createTextColumn('id'),
      frozen: TABLE_COLUMN_FROZEN.LEFT,
    };
    const coloredColumn: TableColumnText<TestRow> = {
      ...createTextColumn('name'),
      cellColorGetter: () => 'red',
    };
    const columns: TableColumn<TestRow>[] = [leftColumn, createTextColumn('score'), createTextColumn('tags'), coloredColumn];
    const settings = [
      createVisualSettings('id'),
      createVisualSettings('score'),
      createVisualSettings('tags', { isVisible: false }),
      createVisualSettings('name'),
    ];

    const condensedSettings = TableUtil.createCondensedVisualColumnSettingsFromColumnSettings(columns, settings);

    expect(condensedSettings.map(setting => setting.id)).toEqual(['id', 'name', 'tags', 'score']);
    expect(condensedSettings.find(setting => setting.id === 'tags')).toMatchObject({ isVisible: false });
  });
});

describe('TableUtil filters and cell values', () => {
  it('creates filters for supported columns, filters options, and reads URL values', () => {
    setLocation('/?name=%22Alpha%22&active=true&score=%5B3%2C7%5D');
    const optionsColumn: TableColumnOptions<TestRow> = {
      ...TableUtil.createOptionsColumn<TestRow>({
        id: 'options',
        name: 'Options',
        options: OPTION_VALUES,
        shouldFilterOptions: true,
      }),
      valueGetter: ({ row }) => row.options,
    };
    const rowTagsColumn = TableUtil.createOptionsColumn<TestRow>({
      id: 'tags',
      name: 'Tags',
      options: OPTION_VALUES,
      shouldFilterOptions: true,
    });
    const allTagsColumn = TableUtil.createOptionsColumn<TestRow>({
      id: 'allTags',
      name: 'All tags',
      options: OPTION_VALUES,
    });
    const dateColumn: TableColumnDate<TestRow> = {
      ...TableUtil.createDateColumn<TestRow>({ id: 'date', name: 'Date' }),
      dateFormat: undefined,
    };
    const hiddenColumn: TableColumnText<TestRow> = {
      ...createTextColumn('name', 'Hidden'),
      hideInFilter: true,
      id: 'hidden',
    };
    const columns: TableColumn<TestRow>[] = [
      createTextColumn('name', 'Name'),
      TableUtil.createBooleanColumn<TestRow>({ id: 'active', name: 'Active' }),
      TableUtil.createNumberColumn<TestRow>({ id: 'score', name: 'Score' }),
      optionsColumn,
      rowTagsColumn,
      allTagsColumn,
      dateColumn,
      hiddenColumn,
      TableUtil.createActionsColumn<TestRow>({ getActions: () => [], t }),
      TableUtil.createReadableIndexColumn<TestRow>(),
      TableUtil.createSelectableColumn<TestRow>(),
    ];
    const rows = [
      createRow({ active: true, date: '2020-01-01', name: 'Alpha', options: ['a', 'b'], score: 2, tags: 'a' }),
      createRow({ active: false, date: '2020-03-01', name: 'Beta', options: 'b', score: 8, tags: ['b', 'c'] }),
    ];

    const filters = TableUtil.createFiltersFromColumns(columns, rows, null);

    expect(filters.map(filter => filter.id)).toEqual(['name', 'active', 'score', 'options', 'tags', 'allTags', 'date']);
    expect(getFilter(filters, 'name')).toBeInstanceOf(TextFilter);
    expect(getFilter(filters, 'name').label).toBe('Name');
    expect(getFilter(filters, 'name').filterValue).toBe('Alpha');
    expect(getFilter(filters, 'active').filterValue).toBe(true);
    expect(getFilter(filters, 'active').label).toBe('Active');
    expect(getFilter(filters, 'score')).toBeInstanceOf(NumberRangeFilter);
    expect(getFilter(filters, 'score').filterValue).toEqual([3, 7]);
    expect(getFilter(filters, 'options')).toBeInstanceOf(MultiSelectFilter);
    expect((getFilter(filters, 'options') as MultiSelectFilter).options).toEqual(OPTION_VALUES.slice(0, 2));
    expect((getFilter(filters, 'tags') as MultiSelectFilter).options).toEqual(OPTION_VALUES);
    expect((getFilter(filters, 'allTags') as MultiSelectFilter).options).toEqual(OPTION_VALUES);
    expect(getFilter(filters, 'date')).toBeInstanceOf(DateFilter);
    expect((getFilter(filters, 'date') as DateFilter).dateFormat).toBe(DATE_FORMAT.DATE);
  });

  it('returns no filters when columns or base rows are empty', () => {
    const rows = [createRow()];
    const columns = [createTextColumn('name')];

    expect(TableUtil.createFiltersFromColumns([], rows, null)).toEqual([]);
    expect(TableUtil.createFiltersFromColumns(columns, [], null)).toEqual([]);
  });

  it('displays and filters numeric option values without converting row values', () => {
    const options: OptionBase<number>[] = [
      { label: 'DNA sequence', value: 2 },
      { label: 'Nextclade', value: 4 },
    ];
    const column = TableUtil.createOptionsColumn<NumericOptionRow>({
      id: 'seq_format',
      name: 'Sequence format',
      options,
      shouldFilterOptions: true,
    });
    const rows: NumericOptionRow[] = [
      { seq_format: 2 },
      { seq_format: 4 },
    ];
    const filters = TableUtil.createFiltersFromColumns([column], rows, null);
    const filter = filters[0] as MultiSelectFilter;

    expect(TableUtil.getTableOptionsCellValue({
      column,
      dataContext: null,
      row: rows[0],
      rowIndex: 0,
    })).toBe('DNA sequence');
    expect(filter.options).toEqual(options);
    filter.filterValue = [2];
    expect(filter.matchRowValue(rows[0].seq_format)).toBe(true);
    expect(filter.matchRowValue(rows[1].seq_format)).toBe(false);
  });

  it('gets table cell values from row fields or value getters', () => {
    const row = createRow({ active: true, date: '2020-06-01T10:00:00.000Z', options: ['a', 'missing'], score: 5 });
    const booleanColumn = TableUtil.createBooleanColumn<TestRow>({ id: 'active', name: 'Active' });
    const booleanGetterColumn: TableColumnBoolean<TestRow> = {
      ...booleanColumn,
      valueGetter: ({ row: givenRow, rowIndex }) => givenRow.score > rowIndex,
    };
    const dateColumn = TableUtil.createDateColumn<TestRow>({ id: 'date', name: 'Date' });
    const dateGetterColumn: TableColumnDate<TestRow> = {
      ...dateColumn,
      valueGetter: () => 'custom-date',
    };
    const numberColumn = TableUtil.createNumberColumn<TestRow>({ id: 'score', name: 'Score' });
    const numberGetterColumn: TableColumnNumber<TestRow> = {
      ...numberColumn,
      valueGetter: ({ row: givenRow, rowIndex }) => givenRow.score + rowIndex,
    };
    const optionsColumn = TableUtil.createOptionsColumn<TestRow>({
      id: 'options',
      name: 'Options',
      options: OPTION_VALUES,
    });
    const optionsGetterColumn: TableColumnOptions<TestRow> = {
      ...optionsColumn,
      valueGetter: () => ['custom'],
    };
    const textColumn = createTextColumn('name');
    const textGetterColumn: TableColumnText<TestRow> = {
      ...textColumn,
      valueGetter: ({ row: givenRow }) => `Name: ${givenRow.name}`,
    };

    expect(TableUtil.getTableBooleanCellValue({ column: booleanColumn, dataContext: null, row, rowIndex: 0 })).toBe(true);
    expect(TableUtil.getTableBooleanCellValue({ column: booleanGetterColumn, dataContext: null, row, rowIndex: 6 })).toBe(false);
    expect(TableUtil.getTableBooleanCellDisplayValue({ column: booleanColumn, dataContext: null, row, rowIndex: 0, t })).toBe(t('Yes'));
    expect(TableUtil.getTableBooleanCellDisplayValue({
      column: booleanColumn,
      dataContext: null,
      row: createRow({ active: false }),
      rowIndex: 0,
      t,
    })).toBe(t('No'));

    expect(TableUtil.getTableDateCellValue({ column: dateColumn, dataContext: null, row, rowIndex: 0 })).toBe('2020-06-01');
    expect(TableUtil.getTableDateCellValue({
      column: dateColumn,
      dataContext: null,
      row: createRow({ date: '' }),
      rowIndex: 0,
    })).toBe('');
    expect(TableUtil.getTableDateCellValue({ column: dateGetterColumn, dataContext: null, row, rowIndex: 0 })).toBe('custom-date');

    expect(TableUtil.getTableNumberCellValue({ column: numberColumn, dataContext: null, row, rowIndex: 0 })).toBe(5);
    expect(TableUtil.getTableNumberCellValue({ column: numberGetterColumn, dataContext: null, row, rowIndex: 2 })).toBe(7);

    expect(TableUtil.getTableOptionsCellValue({ column: optionsColumn, dataContext: null, row, rowIndex: 0 })).toEqual(['Alpha', '']);
    expect(TableUtil.getTableOptionsCellDisplayValue({ column: optionsColumn, dataContext: null, row, rowIndex: 0 })).toBe('Alpha, ');
    expect(TableUtil.getTableOptionsCellValue({
      column: optionsColumn,
      dataContext: null,
      row: createRow({ options: 'c' }),
      rowIndex: 0,
    })).toBe('Gamma');
    expect(TableUtil.getTableOptionsCellDisplayValue({
      column: optionsColumn,
      dataContext: null,
      row: createRow({ options: 'missing' }),
      rowIndex: 0,
    })).toBe('');
    expect(TableUtil.getTableOptionsCellValue({ column: optionsGetterColumn, dataContext: null, row, rowIndex: 0 })).toEqual(['custom']);

    expect(TableUtil.getTableTextCellValue({ column: textColumn, dataContext: null, row, rowIndex: 0 })).toBe('Alpha');
    expect(TableUtil.getTableTextCellValue({ column: textGetterColumn, dataContext: null, row, rowIndex: 0 })).toBe('Name: Alpha');
  });

  it('sorts boolean, date, number, option, and text values in both directions', () => {
    const falseRow = createRow({ active: false, date: '', name: '', options: ['a', 'b'], score: 1 });
    const trueRow = createRow({ active: true, date: '2020-06-02', name: 'Beta', options: 'c', score: 2 });

    const booleanColumn = TableUtil.createBooleanColumn<TestRow>({ id: 'active', name: 'Active' });
    const booleanAscending = TableUtil.createBooleanCellRowComperator({ column: booleanColumn, dataContext: null, direction: 'asc' });
    const booleanDescending = TableUtil.createBooleanCellRowComperator({ column: booleanColumn, dataContext: null, direction: 'desc' });
    expect(booleanAscending(falseRow, trueRow)).toBe(-1);
    expect(booleanDescending(falseRow, trueRow)).toBe(1);
    expect(booleanAscending(trueRow, falseRow)).toBe(1);
    expect(booleanDescending(trueRow, falseRow)).toBe(-1);

    const dateColumn = TableUtil.createDateColumn<TestRow>({ id: 'date', name: 'Date' });
    const dateAscending = TableUtil.createDateCellRowComperator({ column: dateColumn, dataContext: null, direction: 'asc' });
    const dateDescending = TableUtil.createDateCellRowComperator({ column: dateColumn, dataContext: null, direction: 'desc' });
    expect(dateAscending(falseRow, falseRow)).toBe(0);
    expect(dateAscending(falseRow, trueRow)).toBe(-1);
    expect(dateAscending(trueRow, falseRow)).toBe(1);
    expect(dateAscending(trueRow, createRow({ date: '2020-06-03' }))).toBe(-1);
    expect(dateDescending(trueRow, falseRow)).toBe(-1);
    expect(dateDescending(falseRow, trueRow)).toBe(1);
    expect(dateDescending(trueRow, createRow({ date: '2020-06-03' }))).toBe(1);
    expect(dateAscending(createRow({ date: '2020-06-03' }), trueRow)).toBe(1);
    expect(dateDescending(createRow({ date: '2020-06-03' }), trueRow)).toBe(-1);

    const numberColumn = TableUtil.createNumberColumn<TestRow>({ id: 'score', name: 'Score' });
    const numberAscending = TableUtil.createNumberCellRowComperator({ column: numberColumn, dataContext: null, direction: 'asc' });
    const numberDescending = TableUtil.createNumberCellRowComperator({ column: numberColumn, dataContext: null, direction: 'desc' });
    expect(numberAscending(falseRow, trueRow)).toBe(-1);
    expect(numberDescending(falseRow, trueRow)).toBe(1);

    const optionsColumn = TableUtil.createOptionsColumn<TestRow>({
      id: 'options',
      name: 'Options',
      options: OPTION_VALUES,
    });
    const optionsAscending = TableUtil.createOptionsCellRowComperator({ column: optionsColumn, dataContext: null, direction: 'asc' });
    const optionsDescending = TableUtil.createOptionsCellRowComperator({ column: optionsColumn, dataContext: null, direction: 'desc' });
    expect(optionsAscending(falseRow, trueRow)).toBeLessThan(0);
    expect(optionsDescending(falseRow, trueRow)).toBeGreaterThan(0);
    expect(optionsAscending(trueRow, falseRow)).toBeGreaterThan(0);
    const undefinedOptionsColumn: TableColumnOptions<TestRow> = {
      ...optionsColumn,
      valueGetter: () => undefined,
    };
    const undefinedOptionsComparator = TableUtil.createOptionsCellRowComperator({
      column: undefinedOptionsColumn,
      dataContext: null,
      direction: 'asc',
    });
    expect(undefinedOptionsComparator(falseRow, trueRow)).toBe(0);

    const textColumn = createTextColumn('name');
    const textAscending = TableUtil.createTextCellRowComperator({ column: textColumn, dataContext: null, direction: 'asc' });
    const textDescending = TableUtil.createTextCellRowComperator({ column: textColumn, dataContext: null, direction: 'desc' });
    expect(textAscending(falseRow, trueRow)).toBeLessThan(0);
    expect(textDescending(falseRow, trueRow)).toBeGreaterThan(0);
    const undefinedTextColumn: TableColumnText<TestRow> = {
      ...textColumn,
      valueGetter: () => undefined,
    };
    expect(TableUtil.createTextCellRowComperator({
      column: undefinedTextColumn,
      dataContext: null,
      direction: 'asc',
    })(falseRow, trueRow)).toBe(0);

    const advancedColumn = TableUtil.createTextColumn<TestRow>({ advancedSort: true, id: 'name', name: 'Name' });
    const advancedAscending = TableUtil.createTextCellRowAdvancedComperator({
      column: advancedColumn,
      dataContext: null,
      direction: 'asc',
    });
    const advancedDescending = TableUtil.createTextCellRowAdvancedComperator({
      column: advancedColumn,
      dataContext: null,
      direction: 'desc',
    });
    const firstAdvancedResult = advancedAscending(
      createRow({ name: 'item2' }),
      createRow({ name: 'item10' }),
    );
    expect(firstAdvancedResult).not.toBe(0);
    expect(advancedDescending(createRow({ name: 'item2' }), createRow({ name: 'item10' }))).toBe(-firstAdvancedResult);
    expect(TableUtil.createTextCellRowAdvancedComperator({
      column: undefinedTextColumn,
      dataContext: null,
      direction: 'asc',
    })(falseRow, trueRow)).toBe(0);
  });
});

describe('TableUtil downloads', () => {
  it('exports visible downloadable columns using display, value, then raw values', () => {
    const dataContext = { prefix: 'display:' };
    const displayColumn: TableColumnText<TestRow, typeof dataContext> = {
      ...TableUtil.createTextColumn<TestRow, typeof dataContext>({ id: 'name', name: 'Display name' }),
      displayValueGetter: ({ dataContext: context, row }) => `${context.prefix}${row.name}`,
      valueGetter: ({ row }) => `value:${row.name}`,
    };
    const valueColumn: TableColumnNumber<TestRow, typeof dataContext> = {
      ...TableUtil.createNumberColumn<TestRow, typeof dataContext>({ id: 'score', name: 'Computed score' }),
      valueGetter: ({ row }) => row.score * 2,
    };
    const hiddenColumn: TableColumnText<TestRow, typeof dataContext> = {
      ...TableUtil.createTextColumn<TestRow, typeof dataContext>({ id: 'id', name: 'Hidden' }),
      hideInDownload: true,
    };
    const columns: TableColumn<TestRow, typeof dataContext>[] = [
      TableUtil.createActionsColumn<TestRow, typeof dataContext>({ getActions: () => [], t }),
      TableUtil.createTextColumn<TestRow, typeof dataContext>({ id: 'tags', name: 'Tags' }),
      hiddenColumn,
      displayColumn,
      valueColumn,
      TableUtil.createReadableIndexColumn<TestRow, typeof dataContext>(),
      TableUtil.createSelectableColumn<TestRow, typeof dataContext>(),
    ];
    const createDownloadUrl = vi.spyOn(DownloadUtil, 'createDownloadUrl').mockImplementation(() => undefined);

    TableUtil.downloadAsCSV(
      [createRow({ name: 'Alpha', score: 2, tags: 'tag one,tag two' })],
      [
        FIXED_COLUMN_ID.ACTIONS,
        'tags',
        'id',
        'name',
        'score',
        FIXED_COLUMN_ID.READABLE_INDEX,
        FIXED_COLUMN_ID.ROW_SELECT,
      ],
      columns,
      'rows.csv',
      dataContext,
    );

    const [dataUrl, fileName] = createDownloadUrl.mock.calls[0] ?? [];
    expect(fileName).toBe('rows.csv');
    expect(dataUrl).toMatch(/^data:text\/csv;base64,/);
    expect(decodeCsvDataUrl(dataUrl)).toBe('Tags,Display name,Computed score\n"tag one,tag two",display:Alpha,4\n');
  });

  it('exports option labels unless a display value getter is set', () => {
    const optionsColumn = TableUtil.createOptionsColumn<TestRow>({
      id: 'options',
      name: 'Options',
      options: OPTION_VALUES,
    });
    const optionsGetterColumn: TableColumnOptions<TestRow> = {
      ...TableUtil.createOptionsColumn<TestRow>({
        id: 'allTags',
        name: 'Computed options',
        options: OPTION_VALUES,
      }),
      valueGetter: () => 'b',
    };
    const displayOptionsColumn: TableColumnOptions<TestRow> = {
      ...TableUtil.createOptionsColumn<TestRow>({
        id: 'tags',
        name: 'Display options',
        options: OPTION_VALUES,
      }),
      displayValueGetter: () => 'b',
    };
    const createDownloadUrl = vi.spyOn(DownloadUtil, 'createDownloadUrl').mockImplementation(() => undefined);

    TableUtil.downloadAsCSV(
      [createRow({ options: ['a', 'c'] })],
      ['options', 'allTags', 'tags'],
      [optionsColumn, optionsGetterColumn, displayOptionsColumn],
      'options.csv',
    );

    const [dataUrl] = createDownloadUrl.mock.calls[0] ?? [];
    expect(decodeCsvDataUrl(dataUrl)).toBe('Options,Computed options,Display options\n"Alpha, Gamma",Beta,b\n');
  });

  it('exports an empty label for option values missing from the option list', () => {
    const optionsColumn = TableUtil.createOptionsColumn<TestRow>({
      id: 'options',
      name: 'Options',
      options: OPTION_VALUES,
    });
    const createDownloadUrl = vi.spyOn(DownloadUtil, 'createDownloadUrl').mockImplementation(() => undefined);

    TableUtil.downloadAsCSV([createRow({ options: 'missing' })], ['options'], [optionsColumn], 'missing.csv');

    const [dataUrl] = createDownloadUrl.mock.calls[0] ?? [];
    expect(decodeCsvDataUrl(dataUrl)).toBe('Options\n\n');
  });

  it('writes typed values to an Excel workbook and downloads it', async () => {
    writeXlsxFileMock.mockReturnValue({
      toBlob: async () => Promise.resolve(new Blob(['workbook'])),
    });
    const arrayBufferToBase64 = vi.spyOn(DownloadUtil, 'arrayBufferToBase64').mockReturnValue('excel-base64');
    const createDownloadUrl = vi.spyOn(DownloadUtil, 'createDownloadUrl').mockImplementation(() => undefined);
    const scoreColumn: TableColumnNumber<TestRow> = {
      ...TableUtil.createNumberColumn<TestRow>({ id: 'score', name: 'Score' }),
      valueGetter: ({ row }) => row.score + 0.5,
    };
    const dateColumn = TableUtil.createDateColumn<TestRow>({
      dateFormat: DATE_FORMAT.DATE,
      id: 'date',
      name: 'Date',
    });

    await TableUtil.downloadAsExcel([createRow()], ['score', 'date'], [scoreColumn, dateColumn], 'rows.xlsx');

    expect(writeXlsxFileMock).toHaveBeenCalledWith(
      [
        [{ type: String, value: 'Score' }, { type: String, value: 'Date' }],
        [
          { type: Number, value: 1.5 },
          { format: DATE_FORMAT.DATE, type: Date, value: new Date('2020-06-01T10:00:00.000Z') },
        ],
      ],
      {
        columns: [{ width: 20 }, { width: 20 }],
        stickyRowsCount: 1,
      },
    );
    expect(arrayBufferToBase64).toHaveBeenCalledOnce();
    expect(createDownloadUrl).toHaveBeenCalledWith(
      'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,excel-base64',
      'rows.xlsx',
    );
  });

  it('keeps empty and invalid date strings as text in Excel workbooks', async () => {
    writeXlsxFileMock.mockReturnValue({
      toBlob: async () => Promise.resolve(new Blob(['workbook'])),
    });
    vi.spyOn(DownloadUtil, 'arrayBufferToBase64').mockReturnValue('excel-base64');
    vi.spyOn(DownloadUtil, 'createDownloadUrl').mockImplementation(() => undefined);
    const dateColumn = TableUtil.createDateColumn<TestRow>({
      dateFormat: DATE_FORMAT.DATE,
      id: 'date',
      name: 'Date',
    });
    const dataRow = createRow({ date: '' });
    const invalidDataRow = createRow({ date: 'not a date' });

    await TableUtil.downloadAsExcel([dataRow, invalidDataRow], ['date'], [dateColumn], 'dates.xlsx');

    expect(writeXlsxFileMock).toHaveBeenCalledWith(
      [
        [{ type: String, value: 'Date' }],
        [{ type: String, value: '' }],
        [{ type: String, value: 'not a date' }],
      ],
      {
        columns: [{ width: 20 }],
        stickyRowsCount: 1,
      },
    );
  });

  it('uses column ids as CSV headers when a column has no header name', () => {
    const createDownloadUrl = vi.spyOn(DownloadUtil, 'createDownloadUrl').mockImplementation(() => undefined);
    const unnamedColumn = {
      ...TableUtil.createTextColumn<TestRow>({ id: 'name', name: 'Unused' }),
      headerName: undefined,
    } as TableColumn<TestRow>;

    TableUtil.downloadAsCSV([createRow({ name: 'Alpha' })], ['name'], [unnamedColumn], 'unnamed.csv');

    const [dataUrl] = createDownloadUrl.mock.calls[0] ?? [];
    expect(decodeCsvDataUrl(dataUrl)).toBe('name\nAlpha\n');
  });
  it('exports null, undefined, dates, objects and unserializable values as CSV text', () => {
    const createValueColumn = (id: 'allTags' | 'id' | 'name' | 'tags', value: unknown) => ({
      ...TableUtil.createTextColumn<TestRow>({ id, name: id }),
      valueGetter: () => value,
    }) as unknown as TableColumn<TestRow>;
    const createDownloadUrl = vi.spyOn(DownloadUtil, 'createDownloadUrl').mockImplementation(() => undefined);

    TableUtil.downloadAsCSV(
      [createRow()],
      ['name', 'tags', 'id', 'allTags'],
      [
        createValueColumn('name', null),
        createValueColumn('tags', undefined),
        createValueColumn('id', new Date('2020-06-01T10:00:00.000Z')),
        createValueColumn('allTags', () => 'not serializable'),
      ],
      'values.csv',
    );

    const [dataUrl] = createDownloadUrl.mock.calls[0] ?? [];
    expect(decodeCsvDataUrl(dataUrl)).toBe('name,tags,id,allTags\n,,2020-06-01T10:00:00.000Z,\n');
  });

  it('keeps boolean values typed as booleans in Excel exports', async () => {
    writeXlsxFileMock.mockReturnValue({
      toBlob: async () => Promise.resolve(new Blob(['workbook'])),
    });
    vi.spyOn(DownloadUtil, 'arrayBufferToBase64').mockReturnValue('excel-base64');
    vi.spyOn(DownloadUtil, 'createDownloadUrl').mockImplementation(() => undefined);
    const activeColumn = {
      ...TableUtil.createTextColumn<TestRow>({ id: 'active', name: 'Active' }),
      valueGetter: () => true,
    } as unknown as TableColumn<TestRow>;

    await TableUtil.downloadAsExcel([createRow()], ['active'], [activeColumn], 'flags.xlsx');

    expect(writeXlsxFileMock).toHaveBeenCalledWith(
      [
        [{ type: String, value: 'Active' }],
        [{ type: Boolean, value: true }],
      ],
      expect.anything(),
    );
  });
});

describe('TableUtil visible columns and movement', () => {
  it('keeps columns with data and frozen columns when a cell-data predicate is provided', () => {
    const frozenColumn: TableColumnText<TestRow> = {
      ...createTextColumn('id'),
      frozen: TABLE_COLUMN_FROZEN.LEFT,
    };
    const nameColumn = createTextColumn('name');
    const scoreColumn = TableUtil.createNumberColumn<TestRow>({ id: 'score', name: 'Score' });
    const tableColumns: TableColumn<TestRow>[] = [frozenColumn, nameColumn, scoreColumn];
    const hasCellData = vi.fn((row: TestRow, column: TableColumn<TestRow>) => {
      return column.id === 'name' && row.name.length > 0;
    });

    const visibleColumnIds = TableUtil.getColumnIdsWithData({
      dataContext: null,
      hasCellData,
      sortedData: [createRow({ name: 'Alice', score: 0 })],
      tableColumns,
      visibleColumnIds: ['id', 'name', 'score'],
    });

    expect(visibleColumnIds).toEqual(['id', 'name']);
    expect(hasCellData).toHaveBeenCalledTimes(2);
  });

  it('uses value getters or row fields when no cell-data predicate is supplied', () => {
    const frozenColumn: TableColumnText<TestRow> = {
      ...createTextColumn('id'),
      frozen: TABLE_COLUMN_FROZEN.LEFT,
    };
    const nameColumn = createTextColumn('name');
    const displayColumn: TableColumnText<TestRow> = {
      ...createTextColumn('tags'),
      id: 'display',
      valueGetter: ({ row }) => row.tags === 'a' ? 'A' : '',
    };
    const columns: TableColumn<TestRow>[] = [frozenColumn, nameColumn, displayColumn];
    const rows = [createRow({ id: 'row-1', name: '', tags: '' }), createRow({ id: 'row-2', name: 'Alice', tags: 'a' })];

    const visibleColumnIds = TableUtil.getColumnIdsWithData({
      dataContext: null,
      hasCellData: undefined,
      sortedData: rows,
      tableColumns: columns,
      visibleColumnIds: ['id', 'name', 'display'],
    });

    expect(visibleColumnIds).toEqual(['id', 'name', 'display']);
    expect(TableUtil.getColumnIdsWithData({
      dataContext: null,
      hasCellData: undefined,
      sortedData: [],
      tableColumns: columns,
      visibleColumnIds: ['id', 'name', 'display'],
    })).toEqual(['id']);
  });

  it('moves columns across visible non-frozen columns and rejects blocked moves', () => {
    const columns: TableColumn<TestRow>[] = [
      createTextColumn('id'),
      createTextColumn('name'),
      createTextColumn('tags'),
    ];
    const settings = columns.map(column => createVisualSettings(column.id));

    expect(TableUtil.handleMoveColumn([], settings, columns, columns[1], -1)).toBe(true);
    expect(settings.map(setting => setting.id)).toEqual(['name', 'id', 'tags']);
    expect(TableUtil.handleMoveColumn([], settings, columns, columns[0], 1)).toBe(true);
    expect(settings.map(setting => setting.id)).toEqual(['name', 'tags', 'id']);
    expect(TableUtil.handleMoveColumn([], settings, columns, columns[1], -1)).toBe(false);
    expect(TableUtil.handleMoveColumn([], settings, columns, undefined as never, 1)).toBe(false);
    expect(TableUtil.handleMoveColumn([], settings, columns, columns[0], 1)).toBe(false);
  });

  it('skips hidden, frozen, and unknown neighbors while moving columns', () => {
    const firstColumn = createTextColumn('id');
    const frozenColumn: TableColumnText<TestRow> = {
      ...createTextColumn('active'),
      frozen: TABLE_COLUMN_FROZEN.RIGHT,
    };
    const lastColumn = createTextColumn('name');
    const columns: TableColumn<TestRow>[] = [firstColumn, frozenColumn, lastColumn];
    const settings = [
      createVisualSettings('id'),
      createVisualSettings('ghost'),
      createVisualSettings('active'),
      createVisualSettings('name'),
    ];

    settings[1].isVisible = false;
    expect(TableUtil.handleMoveColumn([], settings, columns, firstColumn, 1)).toBe(true);
    expect(settings.map(setting => setting.id)).toEqual(['name', 'ghost', 'active', 'id']);

    const settingsWithoutTarget = [createVisualSettings('id')];
    expect(TableUtil.handleMoveColumn([], settingsWithoutTarget, columns, firstColumn, 1)).toBe(false);

    const settingsWithoutElement = [createVisualSettings('ghost')];
    expect(TableUtil.handleMoveColumn([], settingsWithoutElement, columns, firstColumn, 1)).toBe(false);

    const settingsWithoutColumn = [
      createVisualSettings('id'),
      createVisualSettings('active'),
    ];
    expect(TableUtil.handleMoveColumn([], settingsWithoutColumn, [firstColumn], firstColumn, 1)).toBe(false);
  });

  it('moves columns within dimensions, swaps visible groups, and rejects incomplete dimensions', () => {
    const columns = ['a', 'b', 'c', 'd'].map(id => createTextColumn(id as keyof TestRow));

    const sameDimensionSettings = [createVisualSettings('a'), createVisualSettings('b')];
    expect(TableUtil.handleMoveColumn(
      [createDimension('same', ['a', 'b'])],
      sameDimensionSettings,
      columns,
      columns[1],
      -1,
    )).toBe(true);
    expect(sameDimensionSettings.map(setting => setting.id)).toEqual(['b', 'a']);

    const incompleteSettings = [createVisualSettings('a'), createVisualSettings('b')];
    expect(TableUtil.handleMoveColumn(
      [createDimension('only-a', ['a'])],
      incompleteSettings,
      columns,
      columns[0],
      1,
    )).toBe(false);
    expect(incompleteSettings.map(setting => setting.id)).toEqual(['a', 'b']);

    const multipleVisibleSettings = [createVisualSettings('a'), createVisualSettings('b'), createVisualSettings('c')];
    expect(TableUtil.handleMoveColumn(
      [createDimension('multiple', ['a', 'c']), createDimension('single', ['b'])],
      multipleVisibleSettings,
      columns,
      columns[0],
      1,
    )).toBe(true);
    expect(multipleVisibleSettings.map(setting => setting.id)).toEqual(['b', 'a', 'c']);

    const swappingDimensionSettings = [createVisualSettings('a'), createVisualSettings('b'), createVisualSettings('c')];
    expect(TableUtil.handleMoveColumn(
      [createDimension('single-a', ['a']), createDimension('multiple-b', ['b', 'c'])],
      swappingDimensionSettings,
      columns,
      columns[0],
      1,
    )).toBe(true);
    expect(swappingDimensionSettings.map(setting => setting.id)).toEqual(['b', 'a', 'c']);
  });

  it('moves complete adjacent dimension groups in both directions', () => {
    const columns = ['a1', 'a2', 'b1', 'b2'].map(id => createTextColumn(id as keyof TestRow));
    const dimensions = [
      createDimension('a', ['a1', 'a2']),
      createDimension('b', ['b1', 'b2']),
    ];
    const settings = columns.map(column => createVisualSettings(column.id, {
      isVisible: column.id.endsWith('1'),
    }));

    expect(TableUtil.handleMoveColumn(dimensions, settings, columns, columns[0], 1)).toBe(true);
    expect(settings.map(setting => setting.id)).toEqual(['b1', 'b2', 'a1', 'a2']);

    const reverseSettings = columns.map(column => createVisualSettings(column.id, {
      isVisible: column.id.endsWith('1'),
    }));
    expect(TableUtil.handleMoveColumn(dimensions, reverseSettings, columns, columns[2], -1)).toBe(true);
    expect(reverseSettings.map(setting => setting.id)).toEqual(['b1', 'b2', 'a1', 'a2']);
  });

  it('swaps non-contiguous dimension members without moving the whole group', () => {
    const columns = ['a1', 'a2', 'b1', 'extra', 'b2'].map(id => createTextColumn(id as keyof TestRow));
    const dimensions = [
      createDimension('a', ['a1', 'a2']),
      createDimension('b', ['b1', 'b2']),
    ];
    const settings = [
      createVisualSettings('a1'),
      createVisualSettings('b1'),
      createVisualSettings('a2', { isVisible: false }),
      createVisualSettings('extra'),
      createVisualSettings('b2', { isVisible: false }),
    ];

    expect(TableUtil.handleMoveColumn(dimensions, settings, columns, columns[0], 1)).toBe(true);
    expect(settings.map(setting => setting.id)).toEqual(['b1', 'a1', 'a2', 'extra', 'b2']);

    const reverseSettings = [
      createVisualSettings('b1'),
      createVisualSettings('extra', { isVisible: false }),
      createVisualSettings('b2', { isVisible: false }),
      createVisualSettings('a1'),
      createVisualSettings('a2', { isVisible: false }),
    ];
    expect(TableUtil.handleMoveColumn(dimensions, reverseSettings, columns, columns[0], -1)).toBe(true);
    expect(reverseSettings.map(setting => setting.id)).toEqual(['a1', 'a2', 'extra', 'b2', 'b1']);

    const forwardSettings = [
      createVisualSettings('a1'),
      createVisualSettings('a2', { isVisible: false }),
      createVisualSettings('b1'),
      createVisualSettings('extra', { isVisible: false }),
      createVisualSettings('b2', { isVisible: false }),
    ];
    expect(TableUtil.handleMoveColumn(dimensions, forwardSettings, columns, columns[0], 1)).toBe(true);
    expect(forwardSettings.map(setting => setting.id)).toEqual(['b1', 'a1', 'a2', 'extra', 'b2']);
  });

  it('keeps every column exactly once when a dimension block swaps with a non-contiguous dimension member', () => {
    const columns = ['a1', 'a2', 'b0', 'b1', 'c', 'b2'].map(id => createTextColumn(id as keyof TestRow));
    const dimensions = [
      createDimension('a', ['a1', 'a2']),
      createDimension('b', ['b0', 'b1', 'b2']),
    ];
    const settings = [
      createVisualSettings('a1'),
      createVisualSettings('a2', { isVisible: false }),
      createVisualSettings('b0', { isVisible: false }),
      createVisualSettings('b1'),
      createVisualSettings('c'),
      createVisualSettings('b2', { isVisible: false }),
    ];

    expect(TableUtil.handleMoveColumn(dimensions, settings, columns, columns[0], 1)).toBe(true);
    expect(settings.map(setting => setting.id)).toEqual(['b1', 'b0', 'a1', 'a2', 'c', 'b2']);
  });
});

describe('TableUtil column sizing', () => {
  it('distributes flex widths and calculates pinned-column offsets', () => {
    const container = document.createElement('div');
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 500, 100));
    const widthPxFn = vi.fn((dataLength: number) => dataLength * 10);
    const tableColumns: TableColumn<TestRow>[] = [
      { ...createTextColumn('id'), frozen: TABLE_COLUMN_FROZEN.LEFT, widthFlex: 0, widthPx: 50 },
      createTextColumn('name'),
      TableUtil.createNumberColumn<TestRow>({ flex: 3, id: 'score', name: 'Score' }),
      { ...createTextColumn('tags'), widthFlex: 0, widthPxFn },
      { ...createTextColumn('active'), frozen: TABLE_COLUMN_FROZEN.RIGHT, widthFlex: 0, widthPx: 25 },
      { ...createTextColumn('date'), frozen: TABLE_COLUMN_FROZEN.RIGHT, widthFlex: 0, widthPxFn: () => 35 },
    ];
    const settings = [
      createVisualSettings('id', { widthFlex: 0, widthPx: 50 }),
      createVisualSettings('name', { widthFlex: 1, widthPx: 0 }),
      createVisualSettings('score', { widthFlex: 3, widthPx: 0 }),
      createVisualSettings('tags', { widthFlex: 0, widthPx: 0 }),
      createVisualSettings('active', { widthFlex: 0, widthPx: 25 }),
      createVisualSettings('date', { widthFlex: 0, widthPx: 0 }),
      createVisualSettings('hidden', { isVisible: false, widthFlex: 2, widthPx: 0 }),
    ];

    const settingsById = TableUtil.updateColumnSizesInVisualSettings(
      container,
      20,
      [createRow(), createRow()],
      tableColumns,
      settings,
    );

    expect(settingsById.get('id')).toMatchObject({ calculatedWidth: 50, offsetX: 0 });
    expect(settingsById.get('name')?.calculatedWidth).toBe(87.5);
    expect(settingsById.get('score')?.calculatedWidth).toBe(262.5);
    expect(settingsById.get('tags')?.calculatedWidth).toBe(20);
    expect(settingsById.get('active')).toMatchObject({ calculatedWidth: 25, offsetX: 35 });
    expect(settingsById.get('date')).toMatchObject({ calculatedWidth: 35, offsetX: 0 });
    expect(settingsById.get('hidden')?.calculatedWidth).toBe(175);
    expect(widthPxFn).toHaveBeenCalledTimes(2);
    expect(widthPxFn).toHaveBeenCalledWith(2);
  });

  it('converts resized flex columns to fixed widths and handles zero flex', () => {
    const container = document.createElement('div');
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 300, 100));
    const tableColumns: TableColumn<TestRow>[] = [
      createTextColumn('id'),
      createTextColumn('name'),
      createTextColumn('tags'),
    ];
    const settings = [
      createVisualSettings('id', { calculatedWidth: 75, hasResized: true, widthFlex: 1, widthPx: 75 }),
      createVisualSettings('name', { calculatedWidth: 120, widthFlex: 2, widthPx: 0 }),
      createVisualSettings('tags', { calculatedWidth: 0, widthFlex: 1, widthPx: 0 }),
    ];

    const settingsById = TableUtil.updateColumnSizesInVisualSettings(container, 0, [], tableColumns, settings);

    expect(settingsById.get('id')?.calculatedWidth).toBe(75);
    expect(settingsById.get('name')).toMatchObject({ calculatedWidth: 120, widthPx: 120 });
    expect(settingsById.get('name')?.widthFlex).toBeUndefined();
    expect(settingsById.get('tags')?.calculatedWidth).toBe(105);
    expect(settingsById.get('tags')?.widthFlex).toBe(1);
  });

  it('uses the existing width when resized columns have no flex widths', () => {
    const container = document.createElement('div');
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 200, 100));
    const settings = [
      createVisualSettings('name', { hasResized: true, widthFlex: 0, widthPx: 80 }),
    ];

    const settingsById = TableUtil.updateColumnSizesInVisualSettings(
      container,
      0,
      [],
      [createTextColumn('name')],
      settings,
    );

    expect(settingsById.get('name')?.calculatedWidth).toBe(80);
  });
});
