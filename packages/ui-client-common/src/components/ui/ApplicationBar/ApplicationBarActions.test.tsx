import { createTheme } from '@mui/material';
import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import { MemoryRouter } from 'react-router-dom';
import {
  page,
  userEvent,
} from 'vitest/browser';

import { FeatureFlagsService } from '../../../classes/services/FeatureFlagsService';
import type { ConfigBase } from '../../../models/config.models';
import { renderComponent } from '../../../test/lib';

import { ApplicationBarActions } from './ApplicationBarActions';

const DESKTOP_VIEWPORT = { height: 1080, width: 1920 };
const NARROW_VIEWPORT = { height: 900, width: 800 };
const DEFAULT_ENVIRONMENT_MESSAGE_COLOR = 'rgb(255, 234, 0)';

const setFeatureFlags = () => {
  container.resolve(FeatureFlagsService).featureFlags = {};
};

const setNarrowViewport = async () => {
  await page.viewport(NARROW_VIEWPORT.width, NARROW_VIEWPORT.height);
};

const getMenuElement = (): HTMLElement => {
  const toggleElement = document.querySelector<HTMLElement>('button[aria-label="Toggle menu"]');
  const menuElement = document.getElementById(toggleElement?.getAttribute('aria-controls') ?? '');
  if (!menuElement) {
    throw new Error('Navigation menu not found');
  }
  return menuElement;
};

const getMenuDisplay = () => getComputedStyle(getMenuElement()).display;

describe('ApplicationBarActions', () => {
  afterEach(async () => {
    await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
  });

  it('shows the environment message from the config', async () => {
    setFeatureFlags();

    const screen = await renderComponent(
      <ApplicationBarActions />, {
        wrapper: MemoryRouter,
      },
    );

    await expect.element(screen.getByTestId('ApplicationBarActions-EnvironmentMessage')).toHaveTextContent('development');
  });

  it('omits the environment message when the config has none', async () => {
    setFeatureFlags();

    const screen = await renderComponent(
      <ApplicationBarActions />, {
        configure: (config: ConfigBase) => {
          config.getEnvironmentMessage = () => '';
        },
        wrapper: MemoryRouter,
      },
    );

    expect(screen.getByTestId('ApplicationBarActions-EnvironmentMessage').query()).toBeNull();
  });

  it('applies the environment message color from the theme override', async () => {
    setFeatureFlags();

    const screen = await renderComponent(
      <ApplicationBarActions />, {
        configure: (config: ConfigBase) => {
          config.theme = createTheme(config.theme, {
            components: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              GenEpixUiClientCommonApplicationBarActions: {
                environmentMessageColor: '#102030',
              },
            },
          });
        },
        wrapper: MemoryRouter,
      },
    );

    const environmentMessage = screen.getByTestId('ApplicationBarActions-EnvironmentMessage').element();
    expect(getComputedStyle(environmentMessage).color).toBe('rgb(16, 32, 48)');
  });

  it('falls back to the default environment message color when the theme has no override', async () => {
    setFeatureFlags();

    const screen = await renderComponent(
      <ApplicationBarActions />, {
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

    const environmentMessage = screen.getByTestId('ApplicationBarActions-EnvironmentMessage').element();
    expect(getComputedStyle(environmentMessage).color).toBe(DEFAULT_ENVIRONMENT_MESSAGE_COLOR);
  });

  it('keeps a right margin on the environment message by default', async () => {
    setFeatureFlags();

    const screen = await renderComponent(
      <ApplicationBarActions />, {
        wrapper: MemoryRouter,
      },
    );

    const environmentMessage = screen.getByTestId('ApplicationBarActions-EnvironmentMessage').element();
    expect(getComputedStyle(environmentMessage).marginRight).not.toBe('0px');
  });

  it('removes the environment message right margin when full width is requested', async () => {
    setFeatureFlags();

    const screen = await renderComponent(
      <ApplicationBarActions fullWidth />, {
        wrapper: MemoryRouter,
      },
    );

    const environmentMessage = screen.getByTestId('ApplicationBarActions-EnvironmentMessage').element();
    expect(getComputedStyle(environmentMessage).marginRight).toBe('0px');
  });

  it('hides the menu toggle on desktop viewports', async () => {
    setFeatureFlags();

    await renderComponent(
      <ApplicationBarActions />, {
        wrapper: MemoryRouter,
      },
    );

    const toggleButton = document.querySelector<HTMLElement>('button[aria-label="Toggle menu"]');
    expect(toggleButton).not.toBeNull();
    expect(getComputedStyle(toggleButton).display).toBe('none');
    expect(getMenuDisplay()).toBe('flex');
  });

  it('hides the environment message visually on narrow viewports', async () => {
    setFeatureFlags();
    await setNarrowViewport();

    const screen = await renderComponent(
      <ApplicationBarActions />, {
        wrapper: MemoryRouter,
      },
    );

    const environmentMessage = screen.getByTestId('ApplicationBarActions-EnvironmentMessage').element();
    expect(getComputedStyle(environmentMessage).visibility).toBe('hidden');
  });

  it('shows the menu toggle and hides the menu until it is toggled on narrow viewports', async () => {
    setFeatureFlags();
    await setNarrowViewport();

    const screen = await renderComponent(
      <ApplicationBarActions />, {
        wrapper: MemoryRouter,
      },
    );

    const toggleButton = screen.getByRole('button', { name: 'Toggle menu' });
    await expect.element(toggleButton).toBeVisible();
    expect(getMenuDisplay()).toBe('none');

    await toggleButton.click();
    await expect.poll(getMenuDisplay).toBe('flex');

    await toggleButton.click();
    await expect.poll(getMenuDisplay).toBe('none');
  });

  it('closes the open menu when Escape is pressed', async () => {
    setFeatureFlags();
    await setNarrowViewport();

    const screen = await renderComponent(
      <ApplicationBarActions />, {
        wrapper: MemoryRouter,
      },
    );

    await screen.getByRole('button', { name: 'Toggle menu' }).click();
    await expect.poll(getMenuDisplay).toBe('flex');

    await userEvent.keyboard('{Escape}');
    await expect.poll(getMenuDisplay).toBe('none');
  });

  it('keeps the open menu open when a key other than Escape is pressed', async () => {
    setFeatureFlags();
    await setNarrowViewport();

    const screen = await renderComponent(
      <ApplicationBarActions />, {
        wrapper: MemoryRouter,
      },
    );

    await screen.getByRole('button', { name: 'Toggle menu' }).click();
    await expect.poll(getMenuDisplay).toBe('flex');

    await userEvent.keyboard('a');
    expect(getMenuDisplay()).toBe('flex');
  });

  it('uses the primary palette color as the open menu background when the theme has no override', async () => {
    setFeatureFlags();
    await setNarrowViewport();

    const screen = await renderComponent(
      <ApplicationBarActions />, {
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

    await screen.getByRole('button', { name: 'Toggle menu' }).click();
    await expect.poll(getMenuDisplay).toBe('flex');
    expect(getComputedStyle(getMenuElement()).backgroundColor).toBe('rgb(4, 5, 6)');
  });
});
