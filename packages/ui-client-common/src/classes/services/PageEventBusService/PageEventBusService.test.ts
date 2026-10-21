import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';

import type { ConfigBase } from '../../../models/config.models';

import { PageEventBusService } from './PageEventBusService';

const clickListeners: EventListenerOrEventListenerObject[] = [];

const createService = (enablePageEvents: boolean): PageEventBusService => {
  const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
  const priorCallCount = addEventListenerSpy.mock.calls.length;
  const service = new PageEventBusService(
    { enablePageEvents } as ConfigBase,
    WindowService.getInstance(),
  );

  for (const [eventName, listener] of addEventListenerSpy.mock.calls.slice(priorCallCount)) {
    if (eventName === 'click') {
      clickListeners.push(listener);
    }
  }
  return service;
};

const addPageContainer = (pageName: string): HTMLDivElement => {
  const pageContainer = document.createElement('div');
  pageContainer.setAttribute('data-page-container', '');
  pageContainer.setAttribute('data-testid', pageName);
  document.body.append(pageContainer);
  return pageContainer;
};

const click = (element: HTMLElement): void => {
  element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
};

describe('PageEventBusService', () => {
  afterEach(() => {
    for (const listener of clickListeners) {
      window.removeEventListener('click', listener);
    }
    clickListeners.length = 0;
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it('does not register a click listener when page events are disabled', () => {
    const service = createService(false);
    const clickListener = vi.fn();
    service.addEventListener('click', clickListener);
    const button = document.createElement('button');
    button.setAttribute('aria-label', 'Save');
    document.body.append(button);

    click(button);

    expect(clickListeners).toEqual([]);
    expect(clickListener).not.toHaveBeenCalled();
  });

  it('emits labeled button clicks with context and current page information', () => {
    addPageContainer('CasesPage');
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-testid', 'CasesToolbar');
    const button = document.createElement('button');
    button.setAttribute('aria-label', 'Save case');
    wrapper.append(button);
    document.body.append(wrapper);
    const service = createService(true);
    const clickListener = vi.fn();
    service.addEventListener('click', clickListener);

    click(button);

    expect(clickListener).toHaveBeenCalledExactlyOnceWith({
      context: 'CasesToolbar',
      label: 'Save case',
      page: {
        location: window.location,
        pageName: 'CasesPage',
      },
      type: 'button',
    });
  });

  it('uses a link title when there is no aria label', () => {
    const link = document.createElement('a');
    link.href = '#';
    link.title = 'Open cases';
    document.body.append(link);
    const service = createService(true);
    const clickListener = vi.fn();
    service.addEventListener('click', clickListener);

    click(link);

    expect(clickListener).toHaveBeenCalledWith(expect.objectContaining({
      label: 'Open cases',
      type: 'link',
    }));
  });

  it('finds text nested in descendant elements', () => {
    const button = document.createElement('button');
    const span = document.createElement('span');
    const strong = document.createElement('strong');
    strong.append(document.createTextNode('Nested action'));
    span.append(strong);
    button.append(span);
    document.body.append(button);
    const service = createService(true);
    const clickListener = vi.fn();
    service.addEventListener('click', clickListener);

    click(button);

    expect(clickListener).toHaveBeenCalledWith(expect.objectContaining({
      label: 'Nested action',
      type: 'button',
    }));

    const link = document.createElement('a');
    const linkSpan = document.createElement('span');
    linkSpan.append(document.createTextNode('Nested link'));
    link.append(linkSpan);
    document.body.append(link);

    click(link);

    expect(clickListener).toHaveBeenNthCalledWith(2, expect.objectContaining({
      label: 'Nested link',
      type: 'link',
    }));
  });

  it('uses the first line of descendant innerText when no text node is available', () => {
    const button = document.createElement('button');
    const span = document.createElement('span');
    Object.defineProperty(span, 'innerText', {
      configurable: true,
      value: 'First line\nSecond line',
    });
    button.append(span);
    document.body.append(button);
    const service = createService(true);
    const clickListener = vi.fn();
    service.addEventListener('click', clickListener);

    click(button);

    expect(clickListener).toHaveBeenCalledWith(expect.objectContaining({
      label: 'First line',
      type: 'button',
    }));

    const link = document.createElement('a');
    const linkSpan = document.createElement('span');
    Object.defineProperty(linkSpan, 'innerText', {
      configurable: true,
      value: 'Link first line\nLink second line',
    });
    link.append(linkSpan);
    document.body.append(link);

    click(link);

    expect(clickListener).toHaveBeenNthCalledWith(2, expect.objectContaining({
      label: 'Link first line',
      type: 'link',
    }));
  });

  it('does not emit clicks outside controls or controls without a label', () => {
    const service = createService(true);
    const clickListener = vi.fn();
    service.addEventListener('click', clickListener);
    const emptyButton = document.createElement('button');
    document.body.append(emptyButton);

    click(document.body);
    click(emptyButton);

    expect(clickListener).not.toHaveBeenCalled();
  });

  it('suppresses repeated page-change events for the same page name', () => {
    const service = createService(false);
    const pageChangeListener = vi.fn();
    service.addEventListener('changePage', pageChangeListener);
    const firstPage = { location: window.location, pageName: 'CasesPage' };

    service.emit('changePage', firstPage);
    service.emit('changePage', { location: window.location, pageName: 'CasesPage' });
    service.emit('changePage', { location: window.location, pageName: 'UsersPage' });

    expect(pageChangeListener).toHaveBeenCalledTimes(2);
    expect(pageChangeListener).toHaveBeenNthCalledWith(1, firstPage);
    expect(pageChangeListener).toHaveBeenNthCalledWith(2, { location: window.location, pageName: 'UsersPage' });
  });

  it('adds current page details to click events that do not provide a page', () => {
    addPageContainer('UsersPage');
    const service = createService(false);
    const clickListener = vi.fn();
    service.addEventListener('click', clickListener);

    service.emit('click', {
      label: 'Open users',
      type: 'link',
    });

    expect(clickListener).toHaveBeenCalledWith({
      context: undefined,
      label: 'Open users',
      page: {
        location: window.location,
        pageName: 'UsersPage',
      },
      type: 'link',
    });
  });

  it('preserves page details already provided by a click event', () => {
    const service = createService(false);
    const clickListener = vi.fn();
    service.addEventListener('click', clickListener);
    const page = { location: window.location, pageName: 'ProvidedPage' };

    service.emit('click', {
      label: 'Open page',
      page,
      type: 'link',
    });

    expect(clickListener).toHaveBeenCalledWith({
      label: 'Open page',
      page,
      type: 'link',
    });
  });

  it('returns the current location and optional page container name', () => {
    const service = createService(false);

    expect(service.getPage()).toEqual({
      location: window.location,
      pageName: undefined,
    });

    addPageContainer('LandingPage');
    expect(service.getPage()).toEqual({
      location: window.location,
      pageName: 'LandingPage',
    });
  });
});
