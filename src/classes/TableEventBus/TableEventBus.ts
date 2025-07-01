import type { HasCellDataFn } from '../../models/table';
import { EventBusAbstract } from '../abstracts/EventBusAbstract';

export type TableEvent = {
  columnVisibilityChange: string[];
  columnOrderChange: string[];
  openColumnsEditorDialog: HasCellDataFn<unknown>;
  reset: void;
  destroy: void;
};

export class TableEventBus extends EventBusAbstract<TableEvent> {

}
