import type { HasCellDataFn } from '../../models/table';
import { EventBusAbstract } from '../abstracts/EventBusAbstract';

export type TableEvent = {
  columnOrderChange: string[];
  columnVisibilityChange: string[];
  destroy: void;
  openColumnsEditorDialog: HasCellDataFn<unknown>;
  reset: void;
};

export class TableEventBus extends EventBusAbstract<TableEvent> {

}
