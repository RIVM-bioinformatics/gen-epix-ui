import { EventBusAbstract } from '../abstracts/EventBusAbstract';

export type TableEvent = {
  columnVisibilityChange: string[];
  columnOrderChange: string[];
  openColumnOrderDialog: void;
  reset: void;
  destroy: void;
};

export class TableEventBus extends EventBusAbstract<TableEvent> {

}
