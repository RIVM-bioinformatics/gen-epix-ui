import {
  parseISO,
  format as dateFnsFormat,
} from 'date-fns';
import min from 'lodash/min';
import max from 'lodash/max';
import type { ReactElement } from 'react';
import type { TFunction } from 'i18next';
import difference from 'lodash/difference';
import sumBy from 'lodash/sumBy';

import { EpiDataUtil } from '../EpiDataUtil';
import { EpiCaseUtil } from '../EpiCaseUtil';
import type { Case } from '../../api';
import { ColType } from '../../api';
import {
  FILTER_MODE,
  DEFAULT_FILTER_GROUP,
} from '../../classes/abstracts/FilterAbstract';
import { BooleanFilter } from '../../classes/filters/BooleanFilter';
import { DateFilter } from '../../classes/filters/DateFilter';
import { MultiSelectFilter } from '../../classes/filters/MultiSelectFilter';
import { NumberRangeFilter } from '../../classes/filters/NumberRangeFilter';
import { TextFilter } from '../../classes/filters/TextFilter';
import type { CaseTypeRowValue } from '../../models/epi';
import type { Filters } from '../../models/filter';
import type { OptionBase } from '../../models/form';
import type {
  TableColumn,
  GetTableCellValueProps,
  TableColumnText,
  TableColumnBoolean,
  TableColumnCaseType,
  TableColumnNumber,
  TableColumnOptions,
  TableColumnDate,
  GetTableCellRowComparatorProps,
  TableColumnSettings,
  TableColumnSelectable,
  TableColumnReadableIndex,
  TableRowParams,
  TableColumnActions,
  TableColumnDimension,
  HasCellDataFn,
} from '../../models/table';
import { FIXED_COLUMN_ID } from '../../models/table';
import { DATE_FORMAT } from '../../data/date';
import { StringUtil } from '../StringUtil';

export class TableUtil {
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
          id: column.id,
          label: column.filterLabel ?? column.headerName,
          filterMode: FILTER_MODE.FRONTEND,
          filterPriority: DEFAULT_FILTER_GROUP,
        }));
      } else if (column.type === 'boolean') {
        filters.push(new BooleanFilter({
          id: column.id,
          label: column.filterLabel ?? column.headerName,
          filterMode: FILTER_MODE.FRONTEND,
          filterPriority: DEFAULT_FILTER_GROUP,
        }));
      } else if (column.type === 'number') {
        const values = baseRows.map(row => (row as { [key: string]: number })[column.id]);
        filters.push(new NumberRangeFilter({
          id: column.id,
          label: column.filterLabel ?? column.headerName,
          filterMode: FILTER_MODE.FRONTEND,
          filterPriority: DEFAULT_FILTER_GROUP,
          min: min(values),
          max: max(values),
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
          id: column.id,
          label: column.filterLabel ?? column.headerName,
          filterMode: FILTER_MODE.FRONTEND,
          filterPriority: DEFAULT_FILTER_GROUP,
          options,
          maxNumOptionsExpanded: column.maxNumOptionsExpanded,
        }));
      } else if (column.type === 'date') {
        const values = baseRows.map(row => (row as { [key: string]: string })[column.id]).filter(x => !!x).map(x => parseISO(x));
        const minDate = new Date(Math.min.apply(null, values as unknown as number[]));
        const maxDate = new Date(Math.max.apply(null, values as unknown as number[]));
        return filters.push(new DateFilter({
          id: column.id,
          label: column.filterLabel ?? column.headerName,
          filterMode: FILTER_MODE.FRONTEND,
          filterPriority: DEFAULT_FILTER_GROUP,
          dateParser: parseISO,
          minDate,
          maxDate,
          dateFormat: column.dateFormat ?? DATE_FORMAT.DATE,
        }));
      }
    });

    const searchParams = new URL(document.location.href).searchParams;
    filters.forEach((filter) => {
      let value = searchParams.get(filter.id) as unknown;
      if (!value) {
        return;
      }
      filter.setFilterValue(filter.fromURLSearchParameterValue(value as string));
    });

    return filters;
  }

  // Cell value getters

  public static getTableTextCellValue<TRowData>({ row, column, rowIndex }: GetTableCellValueProps<TRowData, TableColumnText<TRowData>>): string {
    if (column.valueGetter) {
      return column.valueGetter({ row, id: column.id, rowIndex });
    }
    return row[column.id as keyof TRowData] as string;
  }

  public static getTableBooleanCellValue<TRowData>({ row, column, rowIndex }: GetTableCellValueProps<TRowData, TableColumnBoolean<TRowData>>): boolean {
    if (column.valueGetter) {
      return column.valueGetter({ row, id: column.id, rowIndex });
    }
    return (row[column.id as keyof TRowData] as boolean);
  }

  public static getTableCaseTypeCellValue<TRowData>({ row, column, rowIndex }: GetTableCellValueProps<TRowData, TableColumnCaseType<TRowData>>): CaseTypeRowValue {
    if (column.valueGetter) {
      return column.valueGetter({ row, id: column.id, rowIndex });
    }
    return EpiCaseUtil.getRowValue(row as Case, column.caseTypeColumn, column.completeCaseType);
  }

  public static getTableNumberCellValue<TRowData>({ row, column, rowIndex }: GetTableCellValueProps<TRowData, TableColumnNumber<TRowData>>): number {
    if (column.valueGetter) {
      return column.valueGetter({ row, id: column.id, rowIndex });
    }
    return row[column.id as keyof TRowData] as number;
  }

  public static getTableOptionsCellValue<TRowData>({ row, column, rowIndex }: GetTableCellValueProps<TRowData, TableColumnOptions<TRowData>>): string | string[] {
    if (column.valueGetter) {
      return column.valueGetter({ row, id: column.id, rowIndex });
    }
    const values = row[column.id as keyof TRowData] as string | string[];
    if (Array.isArray(values)) {
      return values.map(value => column.options.find(o => o.value === value)?.label ?? '');
    }
    return column.options.find(o => o.value === values)?.label ?? '';
  }

  public static getTableDateCellValue<TRowData>({ row, column, rowIndex }: GetTableCellValueProps<TRowData, TableColumnDate<TRowData>>): string {
    if (column.valueGetter) {
      return column.valueGetter({ row, id: column.id, rowIndex });
    }
    const value = row[column.id as keyof TRowData] as string;
    if (!value) {
      return '';
    }
    return dateFnsFormat(value, column.dateFormat);
  }

  public static getTableBooleanCellDisplayValue<TRowData>({ row, column, rowIndex, t }: GetTableCellValueProps<TRowData, TableColumnBoolean<TRowData>>): string {
    const value = TableUtil.getTableBooleanCellValue({ row, column, rowIndex });
    return value ? t('Yes') : t('No');
  }

  public static getTableOptionsCellDisplayValue<TRowData>({ row, column, rowIndex }: GetTableCellValueProps<TRowData, TableColumnOptions<TRowData>>): string {
    const value = TableUtil.getTableOptionsCellValue({ row, column, rowIndex });
    return Array.isArray(value) ? value.join(', ') : value;
  }

  public static getTableCaseTypeCellDisplayValue<TRowData>({ row, column, rowIndex }: GetTableCellValueProps<TRowData, TableColumnCaseType<TRowData>>): string {
    const value = TableUtil.getTableCaseTypeCellValue({ row, column, rowIndex });
    return value.short;
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

  public static createTextCellRowAdvancedComperator<TRowData>({ column, direction }: GetTableCellRowComparatorProps<TableColumnText<TRowData>>): (a: TRowData, b: TRowData) => number {
    return (a: TRowData, b: TRowData) => {
      const aValue = TableUtil.getTableTextCellValue({ column, row: a, rowIndex: 0 });
      const bValue = TableUtil.getTableTextCellValue({ column, row: b, rowIndex: 0 });
      const result = StringUtil.advancedSortComperator(aValue ?? '', bValue ?? '');
      return direction === 'asc' ? result : -result;
    };
  }

  public static createBooleanCellRowComperator<TRowData>({ column, direction }: GetTableCellRowComparatorProps<TableColumnBoolean<TRowData>>): (a: TRowData, b: TRowData) => number {
    return (a: TRowData, b: TRowData) => {
      const aValue = TableUtil.getTableBooleanCellValue({ column, row: a, rowIndex: 0 }) ? 1 : 0;
      const bValue = TableUtil.getTableBooleanCellValue({ column, row: b, rowIndex: 0 }) ? 1 : 0;


      return direction === 'asc' ? aValue - bValue : bValue - aValue;
    };
  }

  public static createCaseTypeCellRowComperator<TRowData>({ column, direction }: GetTableCellRowComparatorProps<TableColumnCaseType<TRowData>>): (a: TRowData, b: TRowData) => number {
    return (a: TRowData, b: TRowData) => {
      const aValue = TableUtil.getTableCaseTypeCellValue({ column, row: a, rowIndex: 0 });
      const bValue = TableUtil.getTableCaseTypeCellValue({ column, row: b, rowIndex: 0 });
      const col = column.completeCaseType.cols[column.caseTypeColumn.col_id];

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

      if (col.col_type === ColType.ORDINAL) {
        const conceptSetConceptIds = EpiDataUtil.data.conceptsIdsBySetId[col.concept_set_id];
        return (conceptSetConceptIds.indexOf(aValue.raw) - conceptSetConceptIds.indexOf(bValue.raw)) * directionMultiplier;
      }

      if (([ColType.DECIMAL_0, ColType.DECIMAL_1, ColType.DECIMAL_2, ColType.DECIMAL_3, ColType.DECIMAL_4, ColType.DECIMAL_4, ColType.DECIMAL_5, ColType.DECIMAL_6] as ColType[]).includes(col.col_type)) {
        return (+aValue.raw - +bValue.raw) * directionMultiplier;
      }

      return aValue.short.localeCompare(bValue.short) * directionMultiplier;
    };
  }

  public static createNumberCellRowComperator<TRowData>({ column, direction }: GetTableCellRowComparatorProps<TableColumnNumber<TRowData>>): (a: TRowData, b: TRowData) => number {
    return (a: TRowData, b: TRowData) => {
      const aValue = TableUtil.getTableNumberCellValue({ column, row: a, rowIndex: 0 });
      const bValue = TableUtil.getTableNumberCellValue({ column, row: b, rowIndex: 0 });
      return direction === 'asc' ? aValue - bValue : bValue - aValue;
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

  public static createInitialColumnSettings<TData>(tableColumns: TableColumn<TData>[]): TableColumnSettings[] {
    return tableColumns.map<TableColumnSettings>(column => ({
      id: column.id,
      isVisible: column.isInitiallyVisible,
      widthPx: column.widthPx,
      widthPxFn: column.widthPxFn,
      widthFlex: column.widthFlex,
      label: column.headerName,
    }));
  }

  // Column creation helpers
  public static createTextColumn<TData>(kwArgs: { id?: keyof TData; name: string; filterLabel?: string; flex?: number }): TableColumnText<TData> {
    return {
      id: kwArgs.id as string,
      headerName: kwArgs.name,
      type: 'text',
      widthFlex: kwArgs.flex ?? 1,
      filterLabel: kwArgs.filterLabel,
      comparatorFactory: TableUtil.createTextCellRowComperator,
      isInitiallyVisible: true,
    };
  }

  public static createBooleanColumn<TData>(kwArgs: { id?: keyof TData; name: string; filterLabel?: string; flex?: number }): TableColumnBoolean<TData> {
    return {
      id: kwArgs.id as string,
      headerName: kwArgs.name,
      type: 'boolean',
      widthFlex: kwArgs.flex ?? 0.25,
      filterLabel: kwArgs.filterLabel,
      comparatorFactory: TableUtil.createBooleanCellRowComperator,
      isInitiallyVisible: true,
    };
  }

  public static createNumberColumn<TData>(kwArgs: { id?: keyof TData; name: string; filterLabel?: string; flex?: number }): TableColumnNumber<TData> {
    return {
      id: kwArgs.id as string,
      headerName: kwArgs.name,
      widthFlex: kwArgs.flex ?? 1,
      type: 'number',
      filterLabel: kwArgs.filterLabel,
      comparatorFactory: TableUtil.createNumberCellRowComperator,
      textAlign: 'right',
      isInitiallyVisible: true,
    };
  }

  public static createSelectableColumn<TData>(): TableColumnSelectable<TData> {
    return {
      id: FIXED_COLUMN_ID.ROW_SELECT,
      type: 'selectable',
      isInitiallyVisible: true,
      isStatic: true,
      frozen: true,
      resizable: false,
      disableEllipsis: true,
      widthPx: 38,
    };
  }

  public static createReadableIndexColumn<TData>(): TableColumnReadableIndex<TData> {
    return {
      id: FIXED_COLUMN_ID.READABLE_INDEX,
      type: 'readableIndex',
      isInitiallyVisible: true,
      headerName: '',
      isStatic: true,
      frozen: true,
      resizable: false,
      disableEllipsis: true,
      widthPxFn: (dataLength) => (dataLength.toString().length * 10) + 16,
      textAlign: 'right',
    };
  }

  public static createDateColumn<TData>(kwArgs: { id?: keyof TData; name: string; filterLabel?: string; flex?: number; dateFormat?: typeof DATE_FORMAT[keyof typeof DATE_FORMAT] }): TableColumnDate<TData> {
    return {
      id: kwArgs.id as string,
      headerName: kwArgs.name,
      type: 'date',
      widthFlex: kwArgs.flex ?? 0.5,
      dateFormat: kwArgs.dateFormat ?? DATE_FORMAT.DATE,
      filterLabel: kwArgs.filterLabel,
      comparatorFactory: TableUtil.createDateCellRowComperator,
      isInitiallyVisible: true,
    };
  }

  public static createOptionsColumn<TData>(kwArgs: { id?: keyof TData; name: string; options: OptionBase<string>[]; filterLabel?: string; flex?: number; shouldFilterOptions?: boolean; maxNumOptionsExpanded?: number }): TableColumnOptions<TData> {
    return {
      id: kwArgs.id as string,
      headerName: kwArgs.name,
      type: 'options',
      widthFlex: kwArgs.flex ?? 1,
      options: kwArgs.options,
      shouldFilterOptions: kwArgs.shouldFilterOptions,
      maxNumOptionsExpanded: kwArgs.maxNumOptionsExpanded ?? 5,
      filterLabel: kwArgs.filterLabel,
      comparatorFactory: TableUtil.createOptionsCellRowComperator,
      isInitiallyVisible: true,
    };
  }

  public static createActionsColumn<TData>(kwArgs: { t: TFunction<'translation', undefined>; getActions: (params: TableRowParams<TData>) => ReactElement[] }): TableColumnActions<TData> {
    return {
      id: FIXED_COLUMN_ID.ACTIONS,
      headerName: kwArgs.t`Actions`,
      type: 'actions',
      getActions: kwArgs.getActions,
      resizable: false,
      isStatic: true,
      isInitiallyVisible: true,
      widthPx: 48,
    };
  }

  public static areColumnSettingsValid<TData>(tableColumns: TableColumn<TData>[], columnSettings: TableColumnSettings[]): boolean {
    if (!columnSettings?.length) {
      return false;
    }

    const tableColumnsIds = tableColumns?.map(c => c.id);
    const columnSettingsIds = columnSettings?.map(c => c.id);

    return tableColumnsIds.length === columnSettingsIds.length && difference(tableColumnsIds, columnSettingsIds).length === 0;
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

  public static getColumnIdsWithData<TRowData>(params: { visibleColumnIds: string[]; tableColumns: TableColumn<TRowData>[]; sortedData: TRowData[]; hasCellData: HasCellDataFn<TRowData> }): string[] {
    const { visibleColumnIds, tableColumns, sortedData, hasCellData } = params;
    const columns = visibleColumnIds.map(id => tableColumns.find(c => c.id === id));
    let newVisibleColumnIds: string[];
    if (hasCellData) {
      newVisibleColumnIds = columns.filter(column => {
        if (column.isStatic) {
          return true;
        }
        return sortedData.every((row, rowIndex) => hasCellData(row, column, rowIndex));
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

  public static handleMoveColumn<TRowData>(
    columnDimensions: TableColumnDimension[],
    tableColumnSettings: TableColumnSettings[], // Will be mutated
    tableColumns: TableColumn<TRowData>[],
    elementTableColumn: TableColumn<TRowData>,
    direction: 1 | -1,
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
    direction: 1 | -1,
  ): boolean {

    const elementDimension = columnDimensions?.find(dimension => dimension.columnIds.includes(elementSettingsColumn.id));
    const swappingElementDimension = columnDimensions?.find(dimension => dimension.columnIds.includes(swappingElementSettingsColumn.id));

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
