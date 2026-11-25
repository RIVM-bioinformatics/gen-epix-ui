import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { userEvent } from 'vitest/browser';

import { renderComponent } from '../../../test/lib';

import { SidebarMenuItem } from './SidebarMenuItem';
import type { SidebarMenuItemProps } from './SidebarMenuItem';

const TITLE = 'Filters';
const ICON_TEXT = 'Filter icon';
const DEFAULT_MARGIN_TOP_PX = 16;
const BADGE_CONTENT = 3;
const BADGE_CONTENT_TEXT = 'new';
const BADGE_SELECTOR = '.MuiBadge-badge';

type SidebarMenuItemFixtureProps = Partial<Omit<SidebarMenuItemProps, 'icon' | 'onClick' | 'title'>> & {
  readonly onClick?: () => void;
};

const NOOP_ON_CLICK = (): void => undefined;
const NO_TEST_ID_ATTRIBUTES: Record<string, string> = {};

const SidebarMenuItemFixture = ({
  onClick = NOOP_ON_CLICK,
  testIdAttributes = NO_TEST_ID_ATTRIBUTES,
  ...rest
}: SidebarMenuItemFixtureProps) => (
  <SidebarMenuItem
    icon={(
      <span>
        {ICON_TEXT}
      </span>
    )}
    onClick={onClick}
    testIdAttributes={testIdAttributes}
    title={TITLE}
    {...rest}
  />
);

describe('SidebarMenuItem', () => {
  it('renders an icon button labelled with the title and shows the icon', async () => {
    const screen = await renderComponent(
      <SidebarMenuItemFixture />,
    );

    await expect.element(screen.getByRole('button', { name: TITLE })).toBeVisible();
    await expect.element(screen.getByText(ICON_TEXT)).toBeVisible();
  });

  it('calls onClick when the button is clicked', async () => {
    const onClick = vi.fn();
    const screen = await renderComponent(
      <SidebarMenuItemFixture onClick={onClick} />,
    );

    await userEvent.click(screen.getByRole('button', { name: TITLE }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows the title in a tooltip when hovering the button', async () => {
    const screen = await renderComponent(
      <SidebarMenuItemFixture />,
    );

    await userEvent.hover(screen.getByRole('button', { name: TITLE }));

    await expect.element(screen.getByRole('tooltip')).toHaveTextContent(TITLE);
  });

  it('shows the badge content when provided as a number', async () => {
    const screen = await renderComponent(
      <SidebarMenuItemFixture badgeContent={BADGE_CONTENT} />,
    );

    await expect.element(screen.getByText(String(BADGE_CONTENT))).toBeVisible();
  });

  it('shows the badge content when provided as a string', async () => {
    const screen = await renderComponent(
      <SidebarMenuItemFixture badgeContent={BADGE_CONTENT_TEXT} />,
    );

    await expect.element(screen.getByText(BADGE_CONTENT_TEXT)).toBeVisible();
  });

  it('hides the badge when no badge content is provided', async () => {
    const screen = await renderComponent(
      <SidebarMenuItemFixture />,
    );

    const badgeElement = screen.getByTestId('SidebarMenuItem').element().querySelector(BADGE_SELECTOR);
    expect(badgeElement?.classList.contains('MuiBadge-invisible')).toBe(true);
  });

  it('uses the secondary badge color by default', async () => {
    const screen = await renderComponent(
      <SidebarMenuItemFixture badgeContent={BADGE_CONTENT} />,
    );

    const badgeElement = screen.getByTestId('SidebarMenuItem').element().querySelector(BADGE_SELECTOR);
    expect(badgeElement?.classList.contains('MuiBadge-colorSecondary')).toBe(true);
  });

  it('applies the provided badge color', async () => {
    const screen = await renderComponent(
      <SidebarMenuItemFixture
        badgeColor={'error'}
        badgeContent={BADGE_CONTENT}
      />,
    );

    const badgeElement = screen.getByTestId('SidebarMenuItem').element().querySelector(BADGE_SELECTOR);
    expect(badgeElement?.classList.contains('MuiBadge-colorError')).toBe(true);
  });

  it('removes the top margin when rendered as the first item', async () => {
    const screen = await renderComponent(
      <SidebarMenuItemFixture first />,
    );

    const buttonElement = screen.getByRole('button', { name: TITLE }).element();
    expect(getComputedStyle(buttonElement).marginTop).toBe('0px');
  });

  it('applies a top margin when not rendered as the first item', async () => {
    const screen = await renderComponent(
      <SidebarMenuItemFixture />,
    );

    const buttonElement = screen.getByRole('button', { name: TITLE }).element();
    expect(getComputedStyle(buttonElement).marginTop).toBe(`${DEFAULT_MARGIN_TOP_PX}px`);
  });

  it('applies custom test id attributes to the button', async () => {
    const screen = await renderComponent(
      <SidebarMenuItemFixture testIdAttributes={{ section: 'filters' }} />,
    );

    await expect.element(screen.getByTestId('SidebarMenuItem')).toHaveAttribute('data-testid-prop-section', 'filters');
  });
});
