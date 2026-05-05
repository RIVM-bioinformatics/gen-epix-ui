import {
  format as dateFnsFormat,
  parseISO,
} from 'date-fns';
import min from 'lodash/min';
import max from 'lodash/max';
import type { ReactElement } from 'react';
import type { TFunction } from 'i18next';
import difference from 'lodash/difference';
import sumBy from 'lodash/sumBy';
import type { CaseDbCase } from '@gen-epix/api-casedb';
import { CaseDbColType } from '@gen-epix/api-casedb';

import { CaseUtil } from '../../../../ui-casedb/src/utils/CaseUtil';
import {
  DEFAULT_FILTER_GROUP,
  FILTER_MODE,
} from '../../classes/abstracts/FilterAbstract';
import { BooleanFilter } from '../../classes/filters/BooleanFilter';
import { DateFilter } from '../../classes/filters/DateFilter';
import { MultiSelectFilter } from '../../classes/filters/MultiSelectFilter';
import { NumberRangeFilter } from '../../classes/filters/NumberRangeFilter';
import { TextFilter } from '../../classes/filters/TextFilter';
import type { CaseTypeRowValue } from '../../../../ui-casedb/src/models/epi';
import type { Filters } from '../../models/filter';
import type { OptionBase } from '../../models/form';
import type {
  GetTableCellRowComparatorProps,
  GetTableCellValueProps,
  HasCellDataFn,
  TableColumn,
  TableColumnActions,
  TableColumnBoolean,
  TableColumnCaseType,
  TableColumnDate,
  TableColumnDimension,
  TableColumnNumber,
  TableColumnOptions,
  TableColumnReadableIndex,
  TableColumnSelectable,
  TableColumnSettings,
  TableColumnText,
  TableRowParams,
} from '../../models/table';
import { FIXED_COLUMN_ID } from '../../models/table';
import { DATE_FORMAT } from '../../data/date';
import { StringUtil } from '../StringUtil';
import { EpiDataManager } from '../../classes/managers/EpiDataManager';

export class TableUtil {
  public static areColumnSettingsValid<TData>(tableColumns: TableColumn<TData>[], columnSettings: TableColumnSettings[]): boolean {
    if (!columnSettings?.length) {
      return false;
    }

    const tableColumnsIds = tableColumns?.map(c => c.id);
    const columnSettingsIds = columnSettings?.map(c => c.id);

    return tableColumnsIds.length === columnSettingsIds.length && difference(tableColumnsIds, columnSettingsIds).length === 0;
  }

  // Cell value getters

  public static createActionsColumn<TData>(kwArgs: { getActions: (params: TableRowParams<TData>) => ReactElement[]; t: TFunction<'translation', undefined> }): TableColumnActions<TData> {
    return {
      getActions: kwArgs.getActions,
      headerName: kwArgs.t`Actions`,
      id: FIXED_COLUMN_ID.ACTIONS,
      isInitiallyVisible: true,
      isStatic: true,
      resizable: false,
      type: 'actions',
      widthPx: 48,
    };
  }

  public static createBooleanCellRowComperator<TRowData>({ column, direction }: GetTableCellRowComparatorProps<TableColumnBoolean<TRowData>>): (a: TRowData, b: TRowData) => number {
    return (a: TRowData, b: TRowData) => {
      const aValue = TableUtil.getTableBooleanCellValue({ column, row: a, rowIndex: 0 }) ? 1 : 0;
      const bValue = TableUtil.getTableBooleanCellValue({ column, row: b, rowIndex: 0 }) ? 1 : 0;


      return direction === 'asc' ? aValue - bValue : bValue - aValue;
    };
  }

  public static createBooleanColumn<TData>(kwArgs: { filterLabel?: string; flex?: number; id?: keyof TData; name: string }): TableColumnBoolean<TData> {
    return {
      comparatorFactory: TableUtil.createBooleanCellRowComperator,
      filterLabel: kwArgs.filterLabel,
      headerName: kwArgs.name,
      id: kwArgs.id as string,
      isInitiallyVisible: true,
      type: 'boolean',
      widthFlex: kwArgs.flex ?? 0.25,
    };
  }

  public static createCaseTypeCellRowComperator<TRowData>({ column, direction }: GetTableCellRowComparatorProps<TableColumnCaseType<TRowData>>): (a: TRowData, b: TRowData) => number {
    return (a: TRowData, b: TRowData) => {
      const aValue = TableUtil.getTableCaseTypeCellValue({ column, row: a, rowIndex: 0 });
      const bValue = TableUtil.getTableCaseTypeCellValue({ column, row: b, rowIndex: 0 });
      const refCol = column.completeCaseType.ref_cols[column.col.ref_col_id];

      const directionMultiplier = direction === 'asc' ? 1 : -1;

      if (aValue.raw === bValue.raw) {
        return 0;
      }
      if (aValue.isMissing) {
        return 1;
      }
      if (bValue.isMissing) {
        return -1;
      }

      if (refCol.col_type === CaseDbColType.ORDINAL) {
        const conceptSetConceptIds = EpiDataManager.getInstance().data.conceptsIdsBySetId[refCol.concept_set_id];
        return (conceptSetConceptIds.indexOf(aValue.raw) - conceptSetConceptIds.indexOf(bValue.raw)) * directionMultiplier;
      }

      if (([CaseDbColType.DECIMAL_0, CaseDbColType.DECIMAL_1, CaseDbColType.DECIMAL_2, CaseDbColType.DECIMAL_3, CaseDbColType.DECIMAL_4, CaseDbColType.DECIMAL_4, CaseDbColType.DECIMAL_5, CaseDbColType.DECIMAL_6] as CaseDbColType[]).includes(refCol.col_type)) {
        return (+aValue.raw - +bValue.raw) * directionMultiplier;
      }

      return aValue.short.localeCompare(bValue.short) * directionMultiplier;
    };
  }

  public static createDateCellRowComperator<TRowData>({ column, direction }: GetTableCellRowComparatorProps<TableColumnDate<TRowData>>): (a: TRowData, b: TRowData) => number {
    return (a: TRowData, b: TRowData) => {
      const aValue = a[column.id as keyof TRowData] as string;
      const bValue = b[column.id as keyof TRowData] as string;

      if (aValue === bValue) {
        return 0;
      }
      if (aValue && !bValue) {
        return direction === 'asc' ? 1 : -1;
      }
      if (bValue && !aValue) {
        return direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1;
      }
      return direction === 'asc' ? -1 : 1;
    };
  }

  public static createDateColumn<TData>(kwArgs: { dateFormat?: typeof DATE_FORMAT[keyof typeof DATE_FORMAT]; filterLabel?: string; flex?: number; id?: keyof TData; name: string }): TableColumnDate<TData> {
    return {
      comparatorFactory: TableUtil.createDateCellRowComperator,
      dateFormat: kwArgs.dateFormat ?? DATE_FORMAT.DATE,
      filterLabel: kwArgs.filterLabel,
      headerName: kwArgs.name,
      id: kwArgs.id as string,
      isInitiallyVisible: true,
      type: 'date',
      widthFlex: kwArgs.flex ?? 0.5,
    };
  }

  public static createFiltersFromColumns<TData>(columns: TableColumn<TData>[], baseRows: TData[]): Filters {
    if (!columns?.length || !baseRows?.length) {
      return [];
    }

    const filters: Filters = [];
    columns.forEach(column => {
      if (column.hideInFilter) {
        return;
      }
      if (column.type === 'text') {
        filters.push(new TextFilter({
          filterMode: FILTER_MODE.FRONTEND,
          filterPriority: DEFAULT_FILTER_GROUP,
          id: column.id,
          label: column.filterLabel ?? column.headerName,
        }));
      } else if (column.type === 'boolean') {
        filters.push(new BooleanFilter({
          filterMode: FILTER_MODE.FRONTEND,
          filterPriority: DEFAULT_FILTER_GROUP,
          id: column.id,
          label: column.filterLabel ?? column.headerName,
        }));
      } else if (column.type === 'number') {
        const values = baseRows.map(row => (row as { [key: string]: number })[column.id]);
        filters.push(new NumberRangeFilter({
          filterMode: FILTER_MODE.FRONTEND,
          filterPriority: DEFAULT_FILTER_GROUP,
          id: column.id,
          label: column.filterLabel ?? column.headerName,
          max: max(values),
          min: min(values),
        }));
      } else if (column.type === 'options') {
        let options: OptionBase<string>[];

        if (column.shouldFilterOptions) {
          const possibleOptions = baseRows.map((row, index) => {
            const rowValue = column.valueGetter ? column.valueGetter({ id: column.id, row, rowIndex: index }) : row[column.id as keyof TData];
            if (!Array.isArray(rowValue)) {
              return [rowValue] as string[];
            }
            return rowValue;
          }).flat();
          options = column.options.filter(o => possibleOptions.includes(o.value));
        } else {
          options = column.options;
        }

        filters.push(new MultiSelectFilter({
          filterMode: FILTER_MODE.FRONTEND,
          filterPriority: DEFAULT_FILTER_GROUP,
          id: column.id,
          label: column.filterLabel ?? column.headerName,
          maxNumOptionsExpanded: column.maxNumOptionsExpanded,
          options,
        }));
      } else if (column.type === 'date') {
        const values = baseRows.map(row => (row as { [key: string]: string })[column.id]).filter(x => !!x).map(x => parseISO(x));
        const minDate = new Date(Math.min.apply(null, values as unknown as number[]));
        const maxDate = new Date(Math.max.apply(null, values as unknown as number[]));
        return filters.push(new DateFilter({
          dateFormat: column.dateFormat ?? DATE_FORMAT.DATE,
          dateParser: parseISO,
          filterMode: FILTER_MODE.FRONTEND,
          filterPriority: DEFAULT_FILTER_GROUP,
          id: column.id,
          label: column.filterLabel ?? column.headerName,
          maxDate,
          minDate,
        }));
      }
    });

    const searchParams = new URL(document.location.href).searchParams;
    filters.forEach((filter) => {
      const value = searchParams.get(filter.id) as unknown;
      if (!value) {
        return;
      }
      filter.setFilterValue(filter.fromURLSearchParameterValue(value as string));
    });

    return filters;
  }

  public static createInitialColumnSettings<TData>(tableColumns: TableColumn<TData>[]): TableColumnSettings[] {
    return tableColumns.map<TableColumnSettings>(column => ({
      id: column.id,
      isVisible: column.isInitiallyVisible,
      label: column.headerName,
      widthFlex: column.widthFlex,
      widthPx: column.widthPx,
      widthPxFn: column.widthPxFn,
    }));
  }

  public static createNumberCellRowComperator<TRowData>({ column, direction }: GetTableCellRowComparatorProps<TableColumnNumber<TRowData>>): (a: TRowData, b: TRowData) => number {
    return (a: TRowData, b: TRowData) => {
      const aValue = TableUtil.getTableNumberCellValue({ column, row: a, rowIndex: 0 });
      const bValue = TableUtil.getTableNumberCellValue({ column, row: b, rowIndex: 0 });
      return direction === 'asc' ? aValue - bValue : bValue - aValue;
    };
  }

  public static createNumberColumn<TData>(kwArgs: { filterLabel?: string; flex?: number; id?: keyof TData; name: string }): TableColumnNumber<TData> {
    return {
      comparatorFactory: TableUtil.createNumberCellRowComperator,
      filterLabel: kwArgs.filterLabel,
      headerName: kwArgs.name,
      id: kwArgs.id as string,
      isInitiallyVisible: true,
      textAlign: 'right',
      type: 'number',
      widthFlex: kwArgs.flex ?? 1,
    };
  }

  public static createOptionsCellRowComperator<TRowData>({ column, direction }: GetTableCellRowComparatorProps<TableColumnOptions<TRowData>>): (a: TRowData, b: TRowData) => number {
    return (a: TRowData, b: TRowData) => {
      const aValue = TableUtil.getTableOptionsCellValue({ column, row: a, rowIndex: 0 });
      const bValue = TableUtil.getTableOptionsCellValue({ column, row: b, rowIndex: 0 });

      const stringifiedAValue = (Array.isArray(aValue) ? aValue.join(', ') : aValue) ?? '';
      const stringifiedBValue = (Array.isArray(bValue) ? bValue.join(', ') : bValue) ?? '';

      return direction === 'asc' ? stringifiedAValue.localeCompare(stringifiedBValue) : stringifiedBValue.localeCompare(stringifiedAValue);
    };
  }

  public static createOptionsColumn<TData>(kwArgs: { filterLabel?: string; flex?: number; id?: keyof TData; maxNumOptionsExpanded?: number; name: string; options: OptionBase<string>[]; shouldFilterOptions?: boolean }): TableColumnOptions<TData> {
    return {
      comparatorFactory: TableUtil.createOptionsCellRowComperator,
      filterLabel: kwArgs.filterLabel,
      headerName: kwArgs.name,
      id: kwArgs.id as string,
      isInitiallyVisible: true,
      maxNumOptionsExpanded: kwArgs.maxNumOptionsExpanded ?? 5,
      options: kwArgs.options,
      shouldFilterOptions: kwArgs.shouldFilterOptions,
      type: 'options',
      widthFlex: kwArgs.flex ?? 1,
    };
  }

  public static createReadableIndexColumn<TData>(kwArgs: { getAriaLabel?: (params: TableRowParams<TData>) => string } = {}): TableColumnReadableIndex<TData> {
    return {
      disableEllipsis: true,
      frozen: true,
      getAriaLabel: kwArgs.getAriaLabel ?? (() => null),
      headerName: '',
      id: FIXED_COLUMN_ID.READABLE_INDEX,
      isInitiallyVisible: true,
      isStatic: true,
      resizable: false,
      textAlign: 'right',
      type: 'readableIndex',
      widthPxFn: (dataLength) => (dataLength.toString().length * 10) + 16,
    };
  }

  public static createSelectableColumn<TData>(kwArgs: { isDisabled?: (params: TableRowParams<TData>) => boolean } = {}): TableColumnSelectable<TData> {
    return {
      disableEllipsis: true,
      frozen: true,
      id: FIXED_COLUMN_ID.ROW_SELECT,
      isDisabled: kwArgs.isDisabled,
      isInitiallyVisible: true,
      isStatic: true,
      resizable: false,
      type: 'selectable',
      widthPx: 38,
    };
  }

  public static createTextCellRowAdvancedComperator<TRowData>({ column, direction }: GetTableCellRowComparatorProps<TableColumnText<TRowData>>): (a: TRowData, b: TRowData) => number {
    return (a: TRowData, b: TRowData) => {
      const aValue = TableUtil.getTableTextCellValue({ column, row: a, rowIndex: 0 });
      const bValue = TableUtil.getTableTextCellValue({ column, row: b, rowIndex: 0 });
      const result = StringUtil.advancedSortComperator(aValue ?? '', bValue ?? '');
      return direction === 'asc' ? result : -result;
    };
  }

  // Cell row comparators
  public static createTextCellRowComperator<TRowData>({ column, direction }: GetTableCellRowComparatorProps<TableColumnText<TRowData>>): (a: TRowData, b: TRowData) => number {
    return (a: TRowData, b: TRowData) => {
      const aValue = TableUtil.getTableTextCellValue({ column, row: a, rowIndex: 0 });
      const bValue = TableUtil.getTableTextCellValue({ column, row: b, rowIndex: 0 });
      const result = (aValue ?? '').localeCompare(bValue ?? '');
      return direction === 'asc' ? result : -result;
    };
  }

  // Column creation helpers
  public static createTextColumn<TData>(kwArgs: { advancedSort?: boolean; filterLabel?: string; flex?: number; id?: keyof TData; name: string }): TableColumnText<TData> {
    return {
      comparatorFactory: kwArgs.advancedSort ? TableUtil.createTextCellRowAdvancedComperator : TableUtil.createTextCellRowComperator,
      filterLabel: kwArgs.filterLabel,
      headerName: kwArgs.name,
      id: kwArgs.id as string,
      isInitiallyVisible: true,
      type: 'text',
      widthFlex: kwArgs.flex ?? 1,
    };
  }

  public static getColumnIdsWithData<TRowData>(params: { hasCellData: HasCellDataFn<TRowData>; sortedData: TRowData[]; tableColumns: TableColumn<TRowData>[]; visibleColumnIds: string[] }): string[] {
    const { hasCellData, sortedData, tableColumns, visibleColumnIds } = params;
    const columns = visibleColumnIds.map(id => tableColumns.find(c => c.id === id));
    let newVisibleColumnIds: string[];
    if (hasCellData) {
      newVisibleColumnIds = columns.filter(column => {
        if (column.isStatic) {
          return true;
        }
        return sortedData.some((row, rowIndex) => hasCellData(row, column, rowIndex));
      }).map(c => c.id);
    } else {
      newVisibleColumnIds = columns.filter(column => {
        if (column.isStatic) {
          return true;
        }
        return sortedData.some((row, rowIndex) => {
          if (column.valueGetter) {
            return column.valueGetter({
              id: column.id,
              row,
              rowIndex,
            });
          }
          return row[column.id as keyof TRowData] !== undefined;
        });
      }).map(c => c.id);
    }
    return newVisibleColumnIds;
  }

  public static getTableBooleanCellDisplayValue<TRowData>({ column, row, rowIndex, t }: GetTableCellValueProps<TRowData, TableColumnBoolean<TRowData>>): string {
    const value = TableUtil.getTableBooleanCellValue({ column, row, rowIndex });
    return value ? t('Yes') : t('No');
  }

  public static getTableBooleanCellValue<TRowData>({ column, row, rowIndex }: GetTableCellValueProps<TRowData, TableColumnBoolean<TRowData>>): boolean {
    if (column.valueGetter) {
      return column.valueGetter({ id: column.id, row, rowIndex });
    }
    return (row[column.id as keyof TRowData] as boolean);
  }

  public static getTableCaseTypeCellDisplayValue<TRowData>({ column, row, rowIndex }: GetTableCellValueProps<TRowData, TableColumnCaseType<TRowData>>): string {
    const value = TableUtil.getTableCaseTypeCellValue({ column, row, rowIndex });
    return value.short;
  }

  public static getTableCaseTypeCellValue<TRowData>({ column, row, rowIndex }: GetTableCellValueProps<TRowData, TableColumnCaseType<TRowData>>): CaseTypeRowValue {
    if (column.valueGetter) {
      return column.valueGetter({ id: column.id, row, rowIndex });
    }
    return CaseUtil.getRowValue((row as CaseDbCase).content, column.col, column.completeCaseType);
  }

  public static getTableDateCellValue<TRowData>({ column, row, rowIndex }: GetTableCellValueProps<TRowData, TableColumnDate<TRowData>>): string {
    if (column.valueGetter) {
      return column.valueGetter({ id: column.id, row, rowIndex });
    }
    const value = row[column.id as keyof TRowData] as string;
    if (!value) {
      return '';
    }
    return dateFnsFormat(value, column.dateFormat);
  }

  public static getTableNumberCellValue<TRowData>({ column, row, rowIndex }: GetTableCellValueProps<TRowData, TableColumnNumber<TRowData>>): number {
    if (column.valueGetter) {
      return column.valueGetter({ id: column.id, row, rowIndex });
    }
    return row[column.id as keyof TRowData] as number;
  }

  public static getTableOptionsCellDisplayValue<TRowData>({ column, row, rowIndex }: GetTableCellValueProps<TRowData, TableColumnOptions<TRowData>>): string {
    const value = TableUtil.getTableOptionsCellValue({ column, row, rowIndex });
    return Array.isArray(value) ? value.join(', ') : value;
  }

  public static getTableOptionsCellValue<TRowData>({ column, row, rowIndex }: GetTableCellValueProps<TRowData, TableColumnOptions<TRowData>>): string | string[] {
    if (column.valueGetter) {
      return column.valueGetter({ id: column.id, row, rowIndex });
    }
    const values = row[column.id as keyof TRowData] as string | string[];
    if (Array.isArray(values)) {
      return values.map(value => column.options.find(o => o.value === value)?.label ?? '');
    }
    return column.options.find(o => o.value === values)?.label ?? '';
  }

  public static getTableSettingsMap<TRowData>(
    container: HTMLDivElement,
    scrollbarSize: number,
    sortedData: TRowData[],
    tableColumns: TableColumn<TRowData>[],
    tableColumnSettings: TableColumnSettings[],
    visibleTableSettingsColumns: TableColumnSettings[],
  ): Map<string, TableColumnSettings> {
    const tableColumnMap = new Map(tableColumns.map(c => [c.id, c]));

    // As soon as the user resizes a column width widthFlex, we need to convert all columns to widthPx
    const hasResizedColumn = visibleTableSettingsColumns.some(column => column.hasResized);
    const hasFlexColumn = visibleTableSettingsColumns.some(column => column.widthFlex);
    if (hasResizedColumn && hasFlexColumn) {
      tableColumnSettings.forEach(column => {
        if (!column.widthPx && column.calculatedWidth) {
          column.widthPx = column.calculatedWidth;
          column.widthFlex = undefined;
        }
      });
    }

    // Divide the available width between the columns
    const totalFlexWidth = sumBy(visibleTableSettingsColumns, column => column.hasResized ? 0 : column.widthFlex) ?? 0;
    const totalFixedWidth = sumBy(visibleTableSettingsColumns, column => tableColumnMap.get(column.id)?.widthPxFn ? tableColumnMap.get(column.id)?.widthPxFn(sortedData.length) : column.widthPx) ?? 0;
    const totalAvailableWidth = container.getBoundingClientRect().width - scrollbarSize;
    const availableFlexWidth = totalAvailableWidth - totalFixedWidth;
    const flexRatio = totalFlexWidth > 0 ? availableFlexWidth / totalFlexWidth : 1;

    let totalOffset = 0;
    tableColumnSettings.forEach(column => {
      const tableColumn = tableColumns.find(c => c.id === column.id);
      let width: number;
      if (column.hasResized) {
        width = column.widthPx;
      } else if (column.widthFlex) {
        width = column.widthFlex * flexRatio;
      } else if (tableColumnMap.get(column.id)?.widthPxFn) {
        width = tableColumnMap.get(column.id)?.widthPxFn(sortedData.length);
      } else {
        width = column.widthPx;
      }
      column.calculatedWidth = width;
      column.offsetX = tableColumn.frozen ? totalOffset : 0;
      totalOffset += width;
    });

    return new Map(tableColumnSettings.map(c => [c.id, c]));
  }

  public static getTableTextCellValue<TRowData>({ column, row, rowIndex }: GetTableCellValueProps<TRowData, TableColumnText<TRowData>>): string {
    if (column.valueGetter) {
      return column.valueGetter({ id: column.id, row, rowIndex });
    }
    return row[column.id as keyof TRowData] as string;
  }

  public static handleMoveColumn<TRowData>(
    columnDimensions: TableColumnDimension[],
    tableColumnSettings: TableColumnSettings[], // Will be mutated
    tableColumns: TableColumn<TRowData>[],
    elementTableColumn: TableColumn<TRowData>,
    direction: -1 | 1,
  ): boolean {
    if (!elementTableColumn || elementTableColumn.frozen || elementTableColumn.isStatic) {
      return false;
    }

    const elementIndex = tableColumnSettings.findIndex(c => c.id === elementTableColumn.id);
    const elementSettingsColumn = tableColumnSettings[elementIndex];
    if (!elementSettingsColumn) {
      return false;
    }

    // find next/previous visible column
    let swappingElementIndex: number;
    let swappingElementTableColumn: TableColumn<TRowData>;
    let swappingElementSettingsColumn: TableColumnSettings;
    for (let i = elementIndex + direction; i >= 0 && i < tableColumnSettings.length; i += direction) {
      swappingElementSettingsColumn = tableColumnSettings[i];
      if (!swappingElementSettingsColumn?.isVisible) {
        continue;
      }
      swappingElementTableColumn = tableColumns.find(c => c.id === tableColumnSettings[i].id);
      if (swappingElementTableColumn && !swappingElementTableColumn.frozen && !swappingElementTableColumn.isStatic) {
        swappingElementIndex = i;
        break;
      }
    }

    if (!swappingElementSettingsColumn || !swappingElementTableColumn || swappingElementTableColumn.frozen || swappingElementTableColumn.isStatic || swappingElementIndex === undefined) {
      return false;
    }

    // Simple swap if there are no dimensions
    if (!columnDimensions?.length) {
      TableUtil.swapTwoTableColumns(tableColumnSettings, elementIndex, swappingElementIndex);
      return true;
    }

    return TableUtil.handleMoveColumnAcrossDimensions(
      columnDimensions,
      tableColumnSettings,
      elementSettingsColumn,
      swappingElementSettingsColumn,
      elementIndex,
      swappingElementIndex,
      direction,
    );
  }

  private static handleMoveColumnAcrossDimensions(
    columnDimensions: TableColumnDimension[],
    tableColumnSettings: TableColumnSettings[], // Will be mutated
    elementSettingsColumn: TableColumnSettings,
    swappingElementSettingsColumn: TableColumnSettings,
    elementIndex: number,
    swappingElementIndex: number,
    direction: -1 | 1,
  ): boolean {

    const elementDimension = columnDimensions?.find(columnDimension => columnDimension.columnIds.includes(elementSettingsColumn.id));
    const swappingElementDimension = columnDimensions?.find(columnDimension => columnDimension.columnIds.includes(swappingElementSettingsColumn.id));

    if (columnDimensions?.length && (!elementDimension || !swappingElementDimension)) {
      return false;
    }

    if (elementDimension.id === swappingElementDimension.id) {
      // if the columns are in the same dimension
      TableUtil.swapTwoTableColumns(tableColumnSettings, elementIndex, swappingElementIndex);
      return true;
    }

    const elementDimensionVisibleColumnCount = elementDimension.columnIds.filter(id => tableColumnSettings.find(c => c.id === id)?.isVisible).length;
    const swappingElementDimensionVisibleColumnCount = swappingElementDimension.columnIds.filter(id => tableColumnSettings.find(c => c.id === id)?.isVisible).length;

    if (elementDimensionVisibleColumnCount > 1 || swappingElementDimensionVisibleColumnCount > 1) {
      // if there is more than one visible column in the dimension
      TableUtil.swapTwoTableColumns(tableColumnSettings, elementIndex, swappingElementIndex);
      return true;
    }

    const elementDimensionColumnsCount = elementDimension.columnIds.length;
    const elementDimensionIndices = elementDimension.columnIds.map(id => tableColumnSettings.findIndex(c => c.id === id));
    const elementDimensionMinIndex = Math.min(...elementDimensionIndices);
    const elementDimensionMaxIndex = Math.max(...elementDimensionIndices);
    if (elementDimensionMaxIndex - elementDimensionMinIndex !== elementDimensionColumnsCount - 1) {
      // if the columns are NOT next to each other in the dimension
      TableUtil.swapTwoTableColumns(tableColumnSettings, elementIndex, swappingElementIndex);
      return true;
    }

    const swappingElementDimensionIndices = swappingElementDimension.columnIds.map(id => tableColumnSettings.findIndex(c => c.id === id));
    const swappingElementDimensionMinIndex = Math.min(...swappingElementDimensionIndices);
    const swappingElementDimensionMaxIndex = Math.max(...swappingElementDimensionIndices);

    const elementDimensionSettingColumns = elementDimension.columnIds.map(id => tableColumnSettings.find(c => c.id === id));
    const swappingElementSettingsColumns = swappingElementDimension.columnIds.map(id => tableColumnSettings.find(c => c.id === id));
    const swappingElementSettingsColumnsCount = swappingElementSettingsColumns.length;

    if (swappingElementDimensionMaxIndex - swappingElementDimensionMinIndex === swappingElementDimension.columnIds.length - 1) {
      // The swapping element columns are next to each other in the dimension

      // Swap all columns within the element dimension with the all the columns in the swapping element dimension
      tableColumnSettings.splice(elementDimensionMinIndex, elementDimensionColumnsCount, ...swappingElementSettingsColumns);
      if (direction === 1) {
        tableColumnSettings.splice(
          (swappingElementDimensionMinIndex - elementDimensionColumnsCount) + swappingElementSettingsColumnsCount,
          swappingElementSettingsColumnsCount,
          ...elementDimensionSettingColumns,
        );
      } else {
        tableColumnSettings.splice(
          swappingElementDimensionMinIndex,
          swappingElementSettingsColumnsCount,
          ...elementDimensionSettingColumns,
        );
      }
    } else {
      // The swapping element columns are NOT next to each other in the dimension

      // Swap all columns within the element dimension with the swapping element
      tableColumnSettings.splice(elementDimensionMinIndex, elementDimensionColumnsCount, swappingElementSettingsColumn);
      if (direction === 1) {
        tableColumnSettings.splice(
          swappingElementDimensionMinIndex - (elementDimensionColumnsCount - 1),
          1,
          ...elementDimensionSettingColumns,
        );
      } else {
        tableColumnSettings.splice(
          swappingElementDimensionMinIndex,
          1,
          ...elementDimensionSettingColumns,
        );
      }
    }
    return true;
  }

  private static swapTwoTableColumns(tableColumnSettings: TableColumnSettings[], elementIndex: number, swappingElementIndex: number): void {
    tableColumnSettings[elementIndex] = tableColumnSettings.splice(swappingElementIndex, 1, tableColumnSettings[elementIndex])[0];
  }
}
