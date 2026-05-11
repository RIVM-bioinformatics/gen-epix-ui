import type { CommonDbUser } from '@gen-epix/api-commondb';

import { ConfigManager } from '../ConfigManager';
import { EventBusAbstract } from '../../abstracts/EventBusAbstract';
import { HmrUtil } from '../../../utils/HmrUtil';
import { WindowManager } from '../WindowManager';

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

export class PageEventBusManager extends EventBusAbstract<EpiEvent> {
  private static __instance: PageEventBusManager;

  private lastPageEventPayload: string = null;

  private constructor() {
    super();
    this.setupClickEventListener();
  }

  public static getInstance(): PageEventBusManager {
    PageEventBusManager.__instance = HmrUtil.getHmrSingleton('pageEventBusManager', PageEventBusManager.__instance, () => new PageEventBusManager());
    return PageEventBusManager.__instance;
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
      location: WindowManager.getInstance().window.location,
      pageName: document.querySelector('[data-page-container]')?.getAttribute('data-testid'),
    };
  }

  private setupClickEventListener(): void {
    if (!ConfigManager.getInstance().config.enablePageEvents) {
      return;
    }
    WindowManager.getInstance().window.addEventListener('click', (event: Event): void => {

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
        return child as HTMLElement;
      }
    }
    return null;
  }
}
