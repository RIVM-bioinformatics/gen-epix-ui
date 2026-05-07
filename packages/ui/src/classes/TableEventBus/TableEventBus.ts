import type { HasCellDataFn } from '../../models/table';
import { EventBusAbstract } from '../abstracts/EventBusAbstract';

export type TableEvent<TRowData = unknown, TContext = null> = {
  columnOrderChange: string[];
  columnVisibilityChange: string[];
  destroy: void;
  openColumnsEditorDialog: HasCellDataFn<TRowData, TContext>;
  reset: void;
};

export class TableEventBus<TRowData = unknown, TContext = null> extends EventBusAbstract<TableEvent<TRowData, TContext>> {

}
