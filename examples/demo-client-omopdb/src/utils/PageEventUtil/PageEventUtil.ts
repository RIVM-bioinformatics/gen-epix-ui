import { container as rootContainer } from 'tsyringe';
import { PageEventBusService } from '@gen-epix/ui-client-common/classes/services/PageEventBusService';

export class PageEventUtil {
  public static setupPageEventReporting(): void {
    rootContainer.resolve(PageEventBusService).addEventListener('error', (event) => {
      console.info('PageEvent - Error', event);
    });
    rootContainer.resolve(PageEventBusService).addEventListener('changePage', (event) => {
      console.info('PageEvent - ChangePage', event);
    });
    rootContainer.resolve(PageEventBusService).addEventListener('changeUser', (event) => {
      console.info('PageEvent - changeUser', event);
    });
    rootContainer.resolve(PageEventBusService).addEventListener('click', (event) => {
      console.info('PageEvent - click', event);
    });
  }
}
