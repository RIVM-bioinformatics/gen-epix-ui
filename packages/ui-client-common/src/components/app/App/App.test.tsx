import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';

import { API_BASE_TOKEN } from '../../../constants/api.constants';
import { RouterService } from '../../../classes/services/RouterService';
import type { ConfigBase } from '../../../models/config.models';
import {
  mockApiRequest,
  renderComponent,
} from '../../../test/lib';

import { App } from './App';

const FEATURE_FLAGS_RESPONSE = {
  feature_flags: {},
};

const TOUCH_ICON_URL = 'https://icons.test.invalid/touch.png';

let addedIconLink: HTMLLinkElement | undefined;
let removedIconLinks: HTMLLinkElement[] = [];

const registerRouter = () => {
  container.registerInstance(
    RouterService,
    new RouterService({
      adminRoutes: [],
      homePageComponent: () => (
        <div>
          {'Home page'}
        </div>
      ),
      routes: [
        {
          element: (
            <div>
              {'Application routes'}
            </div>
          ),
          path: '/',
        },
      ],
    }),
  );
};

const addIconLink = (href: string) => {
  const link = document.createElement('link');
  link.rel = 'icon';
  link.href = href;
  document.head.prepend(link);
  addedIconLink = link;
  return link;
};

describe('App', () => {
  afterEach(() => {
    addedIconLink?.remove();
    addedIconLink = undefined;
    document.head.append(...removedIconLinks);
    removedIconLinks = [];
  });

  it('renders the router once the feature flags have loaded', async () => {
    mockApiRequest('GET', '/v1/retrieve/feature_flags', () => Response.json(FEATURE_FLAGS_RESPONSE));
    registerRouter();

    const screen = await renderComponent(
      <App />,
    );

    await expect.element(screen.getByText('Application routes')).toBeInTheDocument();
  });

  it('applies the configured request timeout and registers the API request hooks', async () => {
    mockApiRequest('GET', '/v1/retrieve/feature_flags', () => Response.json(FEATURE_FLAGS_RESPONSE));
    registerRouter();

    await renderComponent(
      <App />, {
        configure: (config: ConfigBase) => {
          config.defaultRequestTimeout = 12345;
        },
      },
    );

    const api = container.resolve(API_BASE_TOKEN);
    expect(api.defaultRequestTimeout).toBe(12345);
    expect(api.onRequest).toHaveLength(2);
    expect(api.onResponseFulfilled).toHaveLength(2);
    expect(api.onResponseRejected).toHaveLength(2);
  });

  it('sets the touch icon href on the existing icon link', async () => {
    mockApiRequest('GET', '/v1/retrieve/feature_flags', () => Response.json(FEATURE_FLAGS_RESPONSE));
    registerRouter();
    const link = addIconLink('/original-icon.png');

    await renderComponent(
      <App />, {
        configure: (config: ConfigBase) => {
          config.getTouchIconUrl = () => TOUCH_ICON_URL;
        },
      },
    );

    expect(link.getAttribute('href')).toBe(TOUCH_ICON_URL);
  });

  it('keeps the icon link unchanged when no touch icon url is configured', async () => {
    mockApiRequest('GET', '/v1/retrieve/feature_flags', () => Response.json(FEATURE_FLAGS_RESPONSE));
    registerRouter();
    const link = addIconLink('/original-icon.png');

    await renderComponent(
      <App />, {
        configure: (config: ConfigBase) => {
          config.getTouchIconUrl = () => '';
        },
      },
    );

    expect(link.getAttribute('href')).toBe('/original-icon.png');
  });

  it('renders without an icon link even when a touch icon url is configured', async () => {
    mockApiRequest('GET', '/v1/retrieve/feature_flags', () => Response.json(FEATURE_FLAGS_RESPONSE));
    registerRouter();
    removedIconLinks = [...document.head.querySelectorAll<HTMLLinkElement>('link[rel="icon"]')];
    removedIconLinks.forEach((link) => link.remove());

    const screen = await renderComponent(
      <App />, {
        configure: (config: ConfigBase) => {
          config.getTouchIconUrl = () => TOUCH_ICON_URL;
        },
      },
    );

    await expect.element(screen.getByText('Application routes')).toBeInTheDocument();
    expect(document.head.querySelector('link[rel="icon"]')).toBeNull();
  });

  it('marks the document with the detected scrollbar setting', async () => {
    mockApiRequest('GET', '/v1/retrieve/feature_flags', () => Response.json(FEATURE_FLAGS_RESPONSE));
    registerRouter();

    await renderComponent(
      <App />,
    );

    expect(document.documentElement.getAttribute('data-scrollbar-setting')).toMatch(/^(always|overlay)$/);
  });
});
