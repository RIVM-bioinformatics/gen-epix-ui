import { PageEventBusService } from '@gen-epix/ui';

export class PageEventUtil {
  public static setupPageEventReporting(): void {
    PageEventBusService.getInstance().addEventListener('error', (event) => {
      console.info('PageEvent - Error', event);
    });
    PageEventBusService.getInstance().addEventListener('changePage', (event) => {
      console.info('PageEvent - ChangePage', event);
    });
    PageEventBusService.getInstance().addEventListener('changeUser', (event) => {
      console.info('PageEvent - changeUser', event);
    });
    PageEventBusService.getInstance().addEventListener('click', (event) => {
      console.info('PageEvent - click', event);
    });
  }
}
