import { container } from 'tsyringe';
import { PageEventBusService } from '@gen-epix/ui-client-common/classes/services/PageEventBusService';

export class PageEventUtil {
  public static setupPageEventReporting(): void {
    container.resolve(PageEventBusService).addEventListener('error', (event) => {
      console.info('PageEvent - Error', event);
    });
    container.resolve(PageEventBusService).addEventListener('changePage', (event) => {
      console.info('PageEvent - ChangePage', event);
    });
    container.resolve(PageEventBusService).addEventListener('changeUser', (event) => {
      console.info('PageEvent - changeUser', event);
    });
    container.resolve(PageEventBusService).addEventListener('click', (event) => {
      console.info('PageEvent - click', event);
    });
  }
}
