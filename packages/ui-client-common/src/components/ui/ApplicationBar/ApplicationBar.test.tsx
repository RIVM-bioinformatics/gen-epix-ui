import { createTheme } from '@mui/material';
import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import { MemoryRouter } from 'react-router-dom';

import { FeatureFlagsService } from '../../../classes/services/FeatureFlagsService';
import { RouterService } from '../../../classes/services/RouterService';
import type { ConfigBase } from '../../../models/config.models';
import { renderComponent } from '../../../test/lib';
import { outagesStore } from '../../../stores/outagesStore';

import { ApplicationBar } from './ApplicationBar';

const APPLICATION_NAME = 'Test application';

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
          ],
          element: (
            <div>
              {'Home page'}
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

const setFeatureFlags = () => {
  container.resolve(FeatureFlagsService).featureFlags = {};
};

describe('ApplicationBar', () => {
  afterEach(() => {
    outagesStore.getState().setCategorizedOutages({
      activeOutages: [],
      soonActiveOutages: [],
      visibleOutages: [],
    });
  });

  it('renders the application name instead of navigation when single action is requested', async () => {
    setFeatureFlags();
    registerRouter();

    const screen = await renderComponent(
      <ApplicationBar singleAction />, {
        configure: (config: ConfigBase) => {
          config.applicationName = APPLICATION_NAME;
        },
      },
    );

    await expect.element(screen.getByRole('heading', { name: APPLICATION_NAME })).toBeInTheDocument();
    expect(screen.getByRole('navigation').query()).toBeNull();
    expect(screen.getByRole('button', { name: 'Account' }).query()).toBeNull();
  });

  it('renders the navigation menu and actions when single action is not requested', async () => {
    setFeatureFlags();
    registerRouter();

    const screen = await renderComponent(
      <ApplicationBar />, {
        wrapper: MemoryRouter,
      },
    );

    await expect.element(screen.getByRole('navigation')).toBeInTheDocument();
    await expect.element(screen.getByRole('link', { name: 'Cases' })).toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: 'Account' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: APPLICATION_NAME }).query()).toBeNull();
  });

  it('constrains the content width by default', async () => {
    setFeatureFlags();
    registerRouter();

    await renderComponent(
      <ApplicationBar />, {
        wrapper: MemoryRouter,
      },
    );

    expect(document.querySelector('.MuiContainer-maxWidthXl')).not.toBeNull();
  });

  it('applies the background from the application bar theme override', async () => {
    setFeatureFlags();
    registerRouter();

    await renderComponent(
      <ApplicationBar />, {
        configure: (config: ConfigBase) => {
          config.theme = createTheme(config.theme, {
            components: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              GenEpixUiClientCommonApplicationBar: {
                background: '#010203',
              },
            },
          });
        },
        wrapper: MemoryRouter,
      },
    );

    const appBar = document.querySelector('.MuiAppBar-root');
    expect(appBar).not.toBeNull();
    expect(getComputedStyle(appBar).backgroundColor).toBe('rgb(1, 2, 3)');
  });

  it('falls back to the primary palette color when the theme has no application bar override', async () => {
    setFeatureFlags();
    registerRouter();

    await renderComponent(
      <ApplicationBar />, {
        configure: (config: ConfigBase) => {
          config.theme = createTheme({
            palette: {
              primary: {
                contrastText: '#070809',
                main: '#040506',
              },
            },
          });
        },
        wrapper: MemoryRouter,
      },
    );

    const appBar = document.querySelector('.MuiAppBar-root');
    expect(appBar).not.toBeNull();
    expect(getComputedStyle(appBar).backgroundColor).toBe('rgb(4, 5, 6)');
  });

  it('removes the width constraint when full width is requested', async () => {
    setFeatureFlags();
    registerRouter();

    await renderComponent(
      <ApplicationBar fullWidth />, {
        wrapper: MemoryRouter,
      },
    );

    expect(document.querySelector('.MuiContainer-maxWidthXl')).toBeNull();
    expect(document.querySelector('.MuiContainer-root')).not.toBeNull();
  });
});
