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
import { ApplicationFooterLinkSection } from './ApplicationFooterLinkSection';
import type { ApplicationFooterLinkSectionProps } from './ApplicationFooterLinkSection';

const SECTION_HEADER = 'Contact';
const FIRST_LINK_LABEL = 'Email us';
const SECOND_LINK_LABEL = 'Visit the website';

const renderSection = async (
  props: ApplicationFooterLinkSectionProps,
  options: {
    overrideBorder?: string;
    replaceTheme?: ThemeOptions;
  } = {},
) => {
  const { overrideBorder, replaceTheme } = options;
  return renderComponent(
    <ApplicationFooterLinkSection {...props} />, {
      configure: (config: ConfigBase) => {
        if (replaceTheme) {
          config.theme = createTheme(replaceTheme);
        }
        if (overrideBorder) {
          config.theme = createTheme(config.theme, {
            components: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              GenEpixUiClientCommonApplicationFooterLinkSection: {
                sectionBorder: overrideBorder,
              },
            },
          });
        }
      },
    },
  );
};

describe('ApplicationFooterLinkSection', () => {
  it('renders the header as a heading', async () => {
    const screen = await renderSection({
      children: (
        <ApplicationFooterLink href={'mailto:info@example.org'}>
          {FIRST_LINK_LABEL}
        </ApplicationFooterLink>
      ),
      header: SECTION_HEADER,
    });

    await expect.element(screen.getByRole('heading', { level: 2, name: SECTION_HEADER })).toBeVisible();
  });

  it('renders each link child inside the section list', async () => {
    const screen = await renderSection({
      children: [
        <ApplicationFooterLink
          href={'mailto:info@example.org'}
          key={'email'}
        >
          {FIRST_LINK_LABEL}
        </ApplicationFooterLink>,
        <ApplicationFooterLink
          href={'https://example.org'}
          key={'website'}
        >
          {SECOND_LINK_LABEL}
        </ApplicationFooterLink>,
      ],
      header: SECTION_HEADER,
    });

    await expect.element(screen.getByRole('link', { name: FIRST_LINK_LABEL })).toBeVisible();
    await expect.element(screen.getByRole('link', { name: SECOND_LINK_LABEL })).toBeVisible();
    expect(document.querySelectorAll('ul > li')).toHaveLength(2);
  });

  it('calls the onClick of a link child when it is clicked', async () => {
    const onClick = vi.fn();
    const screen = await renderSection({
      children: (
        <ApplicationFooterLink onClick={onClick}>
          {FIRST_LINK_LABEL}
        </ApplicationFooterLink>
      ),
      header: SECTION_HEADER,
    });

    await screen.getByRole('button', { name: FIRST_LINK_LABEL }).click();

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('uses the border from the theme override', async () => {
    const screen = await renderSection(
      {
        children: (
          <ApplicationFooterLink href={'https://example.org'}>
            {FIRST_LINK_LABEL}
          </ApplicationFooterLink>
        ),
        header: SECTION_HEADER,
      },
      { overrideBorder: '3px dashed rgb(1, 2, 3)' },
    );

    const heading = screen.getByRole('heading', { name: SECTION_HEADER });
    await expect.element(heading).toHaveStyle({ borderBottom: '3px dashed rgb(1, 2, 3)' });
  });

  it('uses the default border derived from the primary contrast color when the theme has no component overrides', async () => {
    const screen = await renderSection(
      {
        children: (
          <ApplicationFooterLink href={'https://example.org'}>
            {FIRST_LINK_LABEL}
          </ApplicationFooterLink>
        ),
        header: SECTION_HEADER,
      },
      { replaceTheme: { palette: { primary: { contrastText: '#00ff00', main: '#0000ff' } } } },
    );

    const heading = screen.getByRole('heading', { name: SECTION_HEADER });
    await expect.element(heading).toHaveStyle({ borderBottom: '1px solid rgb(0, 255, 0)' });
  });

  it('throws when a child is not an ApplicationFooterLink', async () => {
    await expect(renderSection({
      children: (
        <span>
          {FIRST_LINK_LABEL}
        </span>
      ),
      header: SECTION_HEADER,
    })).rejects.toThrow('ApplicationFooterLinkSection only accepts ApplicationFooterLink as children');
  });
});
