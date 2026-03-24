import { PageEventBusManager } from '@gen-epix/ui';

export class PageEventUtil {
  public static setupPageEventReporting(): void {
    PageEventBusManager.instance.addEventListener('error', (event) => {
      console.info('PageEvent - Error', event);
    });
    PageEventBusManager.instance.addEventListener('changePage', (event) => {
      console.info('PageEvent - ChangePage', event);
    });
    PageEventBusManager.instance.addEventListener('changeUser', (event) => {
      console.info('PageEvent - changeUser', event);
    });
    PageEventBusManager.instance.addEventListener('click', (event) => {
      console.info('PageEvent - click', event);
    });
  }
}
