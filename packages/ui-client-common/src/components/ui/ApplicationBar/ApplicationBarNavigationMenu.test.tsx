import { createTheme } from '@mui/material';
import {
  CommonDbCommandName,
  CommonDbPermissionType,
} from '@gen-epix/api-commondb';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import {
  MemoryRouter,
  Outlet,
  useLocation,
} from 'react-router-dom';
import {
  page,
  userEvent,
} from 'vitest/browser';

import { AuthorizationService } from '../../../classes/services/AuthorizationService';
import { RouterService } from '../../../classes/services/RouterService';
import type { ConfigBase } from '../../../models/config.models';
import { renderComponent } from '../../../test/lib';

import { ApplicationBarNavigationMenu } from './ApplicationBarNavigationMenu';

const RESTRICTED_PERMISSION = {
  command_name: CommonDbCommandName.RetrieveOrganizationAdminNameEmailsCommand,
  permission_type: CommonDbPermissionType.EXECUTE,
};

const DESKTOP_VIEWPORT = { height: 1080, width: 1920 };
const MOBILE_VIEWPORT = { height: 900, width: 600 };

const LocationProbe = () => {
  const location = useLocation();
  return (
    <div>
      {location.pathname}
    </div>
  );
};

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
          children: [
            {
              element: (
                <div>
                  {'Cases page'}
                </div>
              ),
              handle: {
                requiredPermissions: [],
                requiresUserProfile: false,
                title: 'Cases',
              },
              path: '/cases',
            },
            {
              element: (
                <div>
                  {'Hidden page'}
                </div>
              ),
              handle: {
                hidden: true,
                requiredPermissions: [],
                requiresUserProfile: false,
                title: 'Hidden',
              },
              path: '/hidden',
            },
            {
              element: (
                <div>
                  {'Restricted page'}
                </div>
              ),
              handle: {
                requiredPermissions: [RESTRICTED_PERMISSION],
                requiresUserProfile: false,
                title: 'Restricted',
              },
              path: '/restricted',
            },
            {
              element: (
                <div>
                  {'Disabled page'}
                </div>
              ),
              handle: {
                disabled: true,
                requiredPermissions: [],
                requiresUserProfile: false,
                title: 'Disabled',
              },
              path: '/disabled',
            },
            {
              element: (
                <div>
                  {'Icon page'}
                </div>
              ),
              handle: {
                icon: (
                  <span>
                    {'Icon item'}
                  </span>
                ),
                requiredPermissions: [],
                requiresUserProfile: false,
                title: 'Icon',
              },
              path: '/icon',
            },
          ],
          element: (
            <div>
              {'Home page'}
              <Outlet />
            </div>
          ),
          handle: {
            requiredPermissions: [],
            requiresUserProfile: false,
            root: true,
            title: 'Home',
          },
          path: '/',
        },
      ],
    }),
  );
};

const getNavigationElement = () => {
  const navigation = document.querySelector<HTMLElement>('nav');
  if (!navigation) {
    throw new Error('Navigation element not found');
  }
  return navigation;
};

const renderMenu = async (props: { fullWidth?: boolean } = {}, configure?: (config: ConfigBase) => void) => {
  return renderComponent(
    <>
      <ApplicationBarNavigationMenu {...props} />
      <LocationProbe />
    </>, {
      configure,
      wrapper: MemoryRouter,
    },
  );
};

describe('ApplicationBarNavigationMenu', () => {
  beforeEach(() => {
    registerRouter();
    container.resolve(AuthorizationService).apiPermissions = [];
  });

  afterEach(async () => {
    await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
  });

  it('renders the root route and its visible children as navigation links', async () => {
    const screen = await renderMenu();

    await expect.element(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    await expect.element(screen.getByRole('link', { name: 'Cases' })).toBeInTheDocument();
    await expect.element(screen.getByRole('link', { name: 'Disabled' })).toBeInTheDocument();
  });

  it('does not render hidden routes', async () => {
    const screen = await renderMenu();

    await expect.element(screen.getByRole('link', { name: 'Cases' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Hidden' }).query()).toBeNull();
  });

  it('does not render routes whose required permissions the user lacks', async () => {
    const screen = await renderMenu();

    await expect.element(screen.getByRole('link', { name: 'Cases' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Restricted' }).query()).toBeNull();
  });

  it('renders routes whose required permissions the user has', async () => {
    container.resolve(AuthorizationService).apiPermissions = [RESTRICTED_PERMISSION];
    const screen = await renderMenu();

    await expect.element(screen.getByRole('link', { name: 'Restricted' })).toBeInTheDocument();
  });

  it('renders the icon instead of the title when the route has an icon', async () => {
    const screen = await renderMenu();

    await expect.element(screen.getByText('Icon item')).toBeInTheDocument();
    expect(screen.getByText('Icon', { exact: true }).query()).toBeNull();
  });

  it('marks disabled routes as aria-disabled and removes them from the tab order', async () => {
    const screen = await renderMenu();

    const disabledLink = screen.getByRole('link', { name: 'Disabled' }).element();
    expect(disabledLink.getAttribute('aria-disabled')).toBe('true');
    expect(disabledLink.getAttribute('tabindex')).toBe('-1');
  });

  it('does not mark enabled routes as aria-disabled', async () => {
    const screen = await renderMenu();

    const casesLink = screen.getByRole('link', { name: 'Cases' }).element();
    expect(casesLink.hasAttribute('aria-disabled')).toBe(false);
    expect(casesLink.hasAttribute('tabindex')).toBe(false);
  });

  it('navigates to the route when an enabled link is clicked', async () => {
    const screen = await renderMenu();

    await screen.getByRole('link', { name: 'Cases' }).click();

    await expect.element(screen.getByText('/cases', { exact: true })).toBeInTheDocument();
  });

  it('does not navigate when a disabled link is clicked', async () => {
    const screen = await renderMenu();

    const disabledLink = screen.getByRole('link', { name: 'Disabled' }).element() as HTMLElement;
    disabledLink.click();

    await expect.element(screen.getByText('/', { exact: true })).toBeInTheDocument();
    expect(screen.getByText('/disabled', { exact: true }).query()).toBeNull();
  });

  it('applies the default horizontal margin when fullWidth is not set', async () => {
    const screen = await renderMenu();

    const list = screen.getByRole('list').element();
    expect(getComputedStyle(list).marginLeft).toBe('16px');
  });

  it('removes the horizontal margin when fullWidth is set', async () => {
    const screen = await renderMenu({ fullWidth: true });

    const list = screen.getByRole('list').element();
    expect(getComputedStyle(list).marginLeft).toBe('0px');
  });

  it('uses the theme primary contrast color for the toggle button by default', async () => {
    await page.viewport(MOBILE_VIEWPORT.width, MOBILE_VIEWPORT.height);
    const screen = await renderMenu();

    const toggleButton = screen.getByRole('button', { name: 'Toggle navigation menu' }).element();
    expect(getComputedStyle(toggleButton).color).toBe('rgb(255, 255, 255)');
  });

  it('applies the navigation menu theme override', async () => {
    await page.viewport(MOBILE_VIEWPORT.width, MOBILE_VIEWPORT.height);
    const screen = await renderMenu({}, (config: ConfigBase) => {
      config.theme = createTheme(config.theme, {
        components: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          GenEpixUiClientCommonApplicationBarNavigationMenu: {
            primaryColor: '#010203',
          },
        },
      });
    });

    const toggleButton = screen.getByRole('button', { name: 'Toggle navigation menu' }).element();
    expect(getComputedStyle(toggleButton).color).toBe('rgb(1, 2, 3)');
  });

  it('opens and closes the navigation on small screens when the toggle button is clicked', async () => {
    await page.viewport(MOBILE_VIEWPORT.width, MOBILE_VIEWPORT.height);
    const screen = await renderMenu();

    const navigation = getNavigationElement();
    expect(getComputedStyle(navigation).display).toBe('none');

    await screen.getByRole('button', { name: 'Toggle navigation menu' }).click();
    expect(getComputedStyle(navigation).display).toBe('block');

    await screen.getByRole('button', { name: 'Toggle navigation menu' }).click();
    expect(getComputedStyle(navigation).display).toBe('none');
  });

  it('closes the open navigation when Escape is pressed', async () => {
    await page.viewport(MOBILE_VIEWPORT.width, MOBILE_VIEWPORT.height);
    const screen = await renderMenu();

    const navigation = getNavigationElement();
    await screen.getByRole('button', { name: 'Toggle navigation menu' }).click();
    expect(getComputedStyle(navigation).display).toBe('block');

    await userEvent.keyboard('{Escape}');

    await expect.poll(() => getComputedStyle(navigation).display).toBe('none');
  });

  it('keeps the open navigation open when a key other than Escape is pressed', async () => {
    await page.viewport(MOBILE_VIEWPORT.width, MOBILE_VIEWPORT.height);
    const screen = await renderMenu();

    const navigation = getNavigationElement();
    await screen.getByRole('button', { name: 'Toggle navigation menu' }).click();

    await userEvent.keyboard('a');

    expect(getComputedStyle(navigation).display).toBe('block');
  });
});
