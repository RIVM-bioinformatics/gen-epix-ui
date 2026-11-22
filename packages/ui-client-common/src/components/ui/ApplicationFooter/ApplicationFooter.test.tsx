import { createTheme } from '@mui/material';
import type { ThemeOptions } from '@mui/material';
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  page,
  userEvent,
} from 'vitest/browser';

import type {
  ConfigBase,
  FooterConfig,
} from '../../../models/config.models';
import { renderComponent } from '../../../test/lib';

import { ApplicationFooter } from './ApplicationFooter';
import type { ApplicationFooterProps } from './ApplicationFooter';

const DESKTOP_VIEWPORT = { height: 1080, width: 1920 };
const NARROW_VIEWPORT = { height: 900, width: 800 };
const CONTACT_EMAIL = 'ids-bioinformatics@rivm.nl';
const COPYRIGHT_LABEL = 'Copyright';
const LANGUAGE_LABEL = 'English';
const TOGGLE_LABEL = 'Toggle footer menu';

const createFooterConfig = (onLanguageClick: () => void): FooterConfig => ({
  sections: [
    {
      header: 'Contact',
      items: [
        {
          href: `mailto:${CONTACT_EMAIL}`,
          label: CONTACT_EMAIL,
        },
      ],
    },
    {
      header: 'About',
      items: [
        {
          href: 'https://github.com/RIVM-bioinformatics/gen-epix',
          label: COPYRIGHT_LABEL,
        },
      ],
    },
    {
      header: 'Languages',
      items: [
        {
          label: LANGUAGE_LABEL,
          onClick: onLanguageClick,
        },
      ],
    },
  ],
});

const renderFooter = async (
  props: ApplicationFooterProps = {},
  options: {
    onLanguageClick?: () => void;
    overrideFooterBackground?: string;
    replaceTheme?: ThemeOptions;
  } = {},
) => {
  const { onLanguageClick = () => undefined, overrideFooterBackground, replaceTheme } = options;
  return renderComponent(
    <ApplicationFooter {...props} />, {
      configure: (config: ConfigBase) => {
        config.createFooter = () => createFooterConfig(onLanguageClick);
        if (replaceTheme) {
          config.theme = createTheme(replaceTheme);
        }
        if (overrideFooterBackground) {
          config.theme = createTheme(config.theme, {
            components: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              GenEpixUiClientCommonApplicationFooter: {
                background: overrideFooterBackground,
              },
            },
          });
        }
      },
    },
  );
};

const getFooterElement = (): HTMLElement => {
  const footerElement = document.querySelector<HTMLElement>('footer');
  if (!footerElement) {
    throw new Error('Footer element not found');
  }
  return footerElement;
};

describe('ApplicationFooter', () => {
  afterEach(async () => {
    await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
  });

  it('renders a heading for each configured section', async () => {
    const screen = await renderFooter();

    await expect.element(screen.getByRole('heading', { name: 'Contact' })).toBeVisible();
    await expect.element(screen.getByRole('heading', { name: 'About' })).toBeVisible();
    await expect.element(screen.getByRole('heading', { name: 'Languages' })).toBeVisible();
  });

  it('renders items with an href as external links that open in a new tab', async () => {
    const screen = await renderFooter();

    const contactLink = screen.getByRole('link', { name: CONTACT_EMAIL });
    await expect.element(contactLink).toHaveAttribute('href', `mailto:${CONTACT_EMAIL}`);
    await expect.element(contactLink).toHaveAttribute('target', '_blank');
    await expect.element(contactLink).toHaveAttribute('rel', 'noreferrer');

    await expect.element(screen.getByRole('link', { name: COPYRIGHT_LABEL })).toHaveAttribute('href', 'https://github.com/RIVM-bioinformatics/gen-epix');
  });

  it('renders items without an href as buttons that run their click handler', async () => {
    const onLanguageClick = vi.fn();
    const screen = await renderFooter({}, { onLanguageClick });

    const languageButton = screen.getByRole('button', { name: LANGUAGE_LABEL });
    await expect.element(languageButton).toBeVisible();
    await languageButton.click();

    expect(onLanguageClick).toHaveBeenCalledTimes(1);
  });

  it('constrains the content width by default', async () => {
    await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
    await renderFooter();

    const container = getFooterElement().querySelector<HTMLElement>('.MuiContainer-root');
    expect(getComputedStyle(container).maxWidth).not.toBe('none');
  });

  it('removes the content max width when fullWidth is set', async () => {
    await page.viewport(DESKTOP_VIEWPORT.width, DESKTOP_VIEWPORT.height);
    await renderFooter({ fullWidth: true });

    const container = getFooterElement().querySelector<HTMLElement>('.MuiContainer-root');
    expect(getComputedStyle(container).maxWidth).toBe('none');
  });

  it('uses the primary palette color as background when the theme has no component overrides', async () => {
    await renderFooter({}, { replaceTheme: { palette: { primary: { main: '#405060' } } } });

    expect(getComputedStyle(getFooterElement()).backgroundColor).toBe('rgb(64, 80, 96)');
  });

  it('uses the background from the theme override', async () => {
    await renderFooter({}, { overrideFooterBackground: '#102030' });

    expect(getComputedStyle(getFooterElement()).backgroundColor).toBe('rgb(16, 32, 48)');
  });

  it('shows the link sections only after the menu toggle is clicked on narrow screens', async () => {
    await page.viewport(NARROW_VIEWPORT.width, NARROW_VIEWPORT.height);
    const screen = await renderFooter();

    await expect.element(screen.getByText(COPYRIGHT_LABEL)).not.toBeVisible();

    await screen.getByRole('button', { name: TOGGLE_LABEL }).click();

    await expect.element(screen.getByText(COPYRIGHT_LABEL)).toBeVisible();
  });

  it('hides the link sections when the menu toggle is clicked again', async () => {
    await page.viewport(NARROW_VIEWPORT.width, NARROW_VIEWPORT.height);
    const screen = await renderFooter();
    const toggleButton = screen.getByRole('button', { name: TOGGLE_LABEL });

    await toggleButton.click();
    await expect.element(screen.getByText(COPYRIGHT_LABEL)).toBeVisible();
    await toggleButton.click();

    await expect.element(screen.getByText(COPYRIGHT_LABEL)).not.toBeVisible();
  });

  it('closes the open menu when Escape is pressed', async () => {
    await page.viewport(NARROW_VIEWPORT.width, NARROW_VIEWPORT.height);
    const screen = await renderFooter();

    await screen.getByRole('button', { name: TOGGLE_LABEL }).click();
    await expect.element(screen.getByText(COPYRIGHT_LABEL)).toBeVisible();
    await userEvent.keyboard('{Escape}');

    await expect.element(screen.getByText(COPYRIGHT_LABEL)).not.toBeVisible();
  });

  it('keeps the open menu open when a key other than Escape is pressed', async () => {
    await page.viewport(NARROW_VIEWPORT.width, NARROW_VIEWPORT.height);
    const screen = await renderFooter();

    await screen.getByRole('button', { name: TOGGLE_LABEL }).click();
    await userEvent.keyboard('a');

    await expect.element(screen.getByText(COPYRIGHT_LABEL)).toBeVisible();
  });
});
