import { PageEventBusManager } from '@gen-epix/ui';

export class PageEventUtil {
  public static setupPageEventReporting(): void {
    PageEventBusManager.getInstance().addEventListener('error', (event) => {
      console.info('PageEvent - Error', event);
    });
    PageEventBusManager.getInstance().addEventListener('changePage', (event) => {
      console.info('PageEvent - ChangePage', event);
    });
    PageEventBusManager.getInstance().addEventListener('changeUser', (event) => {
      console.info('PageEvent - changeUser', event);
    });
    PageEventBusManager.getInstance().addEventListener('click', (event) => {
      console.info('PageEvent - click', event);
    });
  }
}
