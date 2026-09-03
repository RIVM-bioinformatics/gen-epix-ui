import { EventBusAbstract } from '@gen-epix/ui-core/classes/abstracts/EventBusAbstract';

import type { HasCellDataFn } from '../../models/table';

export type TableEvent<TRowData = unknown, TDataContext = null> = {
  columnOrderChange: string[];
  columnVisibilityChange: string[];
  condensedChange: boolean;
  destroy: void;
  openColumnsEditorDialog: HasCellDataFn<TRowData, TDataContext>;
  reset: void;
};

export class TableEventBus<TRowData = unknown, TDataContext = null> extends EventBusAbstract<TableEvent<TRowData, TDataContext>> {

}
