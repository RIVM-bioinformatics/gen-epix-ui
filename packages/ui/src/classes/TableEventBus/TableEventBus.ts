import type { HasCellDataFn } from '../../models/table';
import { EventBusAbstract } from '../abstracts/EventBusAbstract';

export type TableEvent<TRowData = unknown, TDataContext = null> = {
  columnOrderChange: string[];
  columnVisibilityChange: string[];
  destroy: void;
  openColumnsEditorDialog: HasCellDataFn<TRowData, TDataContext>;
  reset: void;
};

export class TableEventBus<TRowData = unknown, TDataContext = null> extends EventBusAbstract<TableEvent<TRowData, TDataContext>> {

}
