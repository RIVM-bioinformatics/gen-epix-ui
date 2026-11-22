import { createTheme } from '@mui/material';
import type { ThemeOptions } from '@mui/material';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type { ConfigBase } from '../../../models/config.models';
import { renderComponent } from '../../../test/lib';

import { ApplicationFooterLink } from './ApplicationFooterLink';
import type { ApplicationFooterLinkProps } from './ApplicationFooterLink';

const LINK_LABEL = 'Documentation';
const LINK_HREF = 'https://example.org/docs';
const BUTTON_LABEL = 'English';

const renderLink = async (
  props: ApplicationFooterLinkProps,
  options: {
    overrideColor?: string;
    replaceTheme?: ThemeOptions;
  } = {},
) => {
  const { overrideColor, replaceTheme } = options;
  return renderComponent(
    <ul>
      <ApplicationFooterLink {...props} />
    </ul>, {
      configure: (config: ConfigBase) => {
        if (replaceTheme) {
          config.theme = createTheme(replaceTheme);
        }
        if (overrideColor) {
          config.theme = createTheme(config.theme, {
            components: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              GenEpixUiClientCommonApplicationFooterLink: {
                color: overrideColor,
              },
            },
          });
        }
      },
    },
  );
};

describe('ApplicationFooterLink', () => {
  it('renders a link that opens its href in a new tab when href is set', async () => {
    const screen = await renderLink({ children: LINK_LABEL, href: LINK_HREF });

    const link = screen.getByRole('link', { name: LINK_LABEL });
    await expect.element(link).toHaveAttribute('href', LINK_HREF);
    await expect.element(link).toHaveAttribute('target', '_blank');
    await expect.element(link).toHaveAttribute('rel', 'noreferrer');
  });

  it('calls onClick when the link with href is clicked', async () => {
    const onClick = vi.fn();
    const screen = await renderLink({ children: LINK_LABEL, href: LINK_HREF, onClick });

    await screen.getByRole('link', { name: LINK_LABEL }).click();

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders a button without a link when href is not set', async () => {
    const screen = await renderLink({ children: BUTTON_LABEL });

    await expect.element(screen.getByRole('button', { name: BUTTON_LABEL })).toBeVisible();
    expect(document.querySelector('a')).toBeNull();
  });

  it('calls onClick when the button without href is clicked', async () => {
    const onClick = vi.fn();
    const screen = await renderLink({ children: BUTTON_LABEL, onClick });

    await screen.getByRole('button', { name: BUTTON_LABEL }).click();

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('passes extra box props to the list item element', async () => {
    await renderLink({ children: BUTTON_LABEL, id: 'footer-language-item' });

    expect(document.querySelector('li#footer-language-item')).not.toBeNull();
  });

  it('uses the link color from the theme override', async () => {
    const screen = await renderLink({ children: LINK_LABEL, href: LINK_HREF }, { overrideColor: '#ff0000' });

    await expect.element(screen.getByRole('link', { name: LINK_LABEL })).toHaveStyle({ color: 'rgb(255, 0, 0)' });
  });

  it('uses the primary contrast color when the theme has no component overrides', async () => {
    const screen = await renderLink(
      { children: LINK_LABEL, href: LINK_HREF },
      { replaceTheme: { palette: { primary: { contrastText: '#00ff00', main: '#0000ff' } } } },
    );

    await expect.element(screen.getByRole('link', { name: LINK_LABEL })).toHaveStyle({ color: 'rgb(0, 255, 0)' });
  });
});
