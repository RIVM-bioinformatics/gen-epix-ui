import { EventBusAbstract } from '../abstracts/EventBusAbstract';

export type TableEvent = {
  columnVisibilityChange: string[];
  openColumnOrderDialog: void;
  reset: void;
  destroy: void;
};

export class TableEventBus extends EventBusAbstract<TableEvent> {

}
