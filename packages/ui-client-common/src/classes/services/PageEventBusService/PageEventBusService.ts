import type { CommonDbUser } from '@gen-epix/api-commondb';
import { EventBusAbstract } from '@gen-epix/ui-core/classes/abstracts/EventBusAbstract';
import type { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';
import {
  inject,
  singleton,
} from 'tsyringe';

import {
  CONFIG_TOKEN,
  WINDOW_SERVICE_TOKEN,
} from '../../../constants/config.constants';
import type { ConfigBase } from '../../../models/config.models';

type EpiEvent = {
  changePage: Page;
  changeUser: CommonDbUser;
  click: {
    context?: string;
    label: string;
    page?: Page;
    type: 'button' | 'link' | 'table-row-index' | 'table-row';
  };
  error: Error;
};

type Page = {
  location: Location;
  pageName: string;
};

@singleton()
export class PageEventBusService extends EventBusAbstract<EpiEvent> {
  private lastPageEventPayload: string = null;
  private readonly windowService: WindowService;

  public constructor(
    @inject(CONFIG_TOKEN) config: ConfigBase,
    @inject(WINDOW_SERVICE_TOKEN) windowService: WindowService,
  ) {
    super();
    this.windowService = windowService;
    this.setupClickEventListener(config.enablePageEvents);
  }


  public emit<TEventName extends keyof EpiEvent>(eventName: TEventName, payload?: EpiEvent[TEventName]): void {
    if (eventName === 'changePage') {
      if (this.lastPageEventPayload === (payload as EpiEvent['changePage']).pageName) {
        return;
      }
      this.lastPageEventPayload = (payload as EpiEvent['changePage']).pageName;
    }

    if (eventName === 'click' && !(payload as EpiEvent['click']).page) {
      (payload as EpiEvent['click']).page = this.getPage();
    }

    super.emit(eventName, payload);
  }

  public getPage(): Page {
    return {
      location: this.windowService.window.location,
      pageName: document.querySelector('[data-page-container]')?.getAttribute('data-testid'),
    };
  }

  private setupClickEventListener(enablePageEvents: boolean): void {
    if (!enablePageEvents) {
      return;
    }
    this.windowService.window.addEventListener('click', (event: Event): void => {

      const closestButton = (event.target as HTMLElement).closest('button');
      const closestLink = (event.target as HTMLElement).closest('a');
      const closestElement = closestButton || closestLink;

      if (closestElement) {
        const context = closestElement?.closest('[data-testid]')?.getAttribute('data-testid') ?? '';

        const buttonTitle = closestElement.getAttribute('aria-label') ?? closestElement.getAttribute('title');
        if (buttonTitle) {
          this.emit('click', {
            context,
            label: buttonTitle,
            type: closestButton ? 'button' : 'link',
          });
        } else {
          const childTextNode = this.traverseDom(closestElement, (el) => el.nodeType === Node.TEXT_NODE);
          if (childTextNode?.nodeValue) {
            this.emit('click', {
              context,
              label: childTextNode?.nodeValue,
              type: closestButton ? 'button' : 'link',
            });
          } else {
            const nodeWithText = this.traverseDom(closestElement, (el) => !!el.innerText);
            if (nodeWithText?.innerText) {
              this.emit('click', {
                context,
                label: nodeWithText?.innerText.split('\n')[0],
                type: closestButton ? 'button' : 'link',
              });
            }
          }
        }
      }
    });
  }

  private traverseDom(element: HTMLElement, predicate: (element: HTMLElement) => boolean): HTMLElement {
    if (predicate(element)) {
      return element;
    }
    for (const child of Array.from(element.childNodes)) {
      const found = this.traverseDom(child as HTMLElement, predicate);
      if (found) {
        return found;
      }
    }
    return null;
  }
}
