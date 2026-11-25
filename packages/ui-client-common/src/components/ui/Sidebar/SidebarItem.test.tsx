import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { userEvent } from 'vitest/browser';

import type { ConfigBase } from '../../../models/config.models';
import { renderComponent } from '../../../test/lib';

import { SidebarItem } from './SidebarItem';

const MAIN_CONTENT_ID = 'main-content';
const CUSTOM_MAIN_CONTENT_ID = 'custom-main-content';
const MAIN_CONTENT_TOP_PX = 60;
const MAIN_CONTENT_HEIGHT_PX = 300;
const RESIZED_MAIN_CONTENT_HEIGHT_PX = 450;
const SIDEBAR_WIDTH = 30;
const SPACING_PX = 8;
const TITLE = 'Filters';
const CLOSE_TOOLTIP_TEXT = 'Close sidebar';

type SidebarItemFixtureProps = {
  readonly mainContentHeightPx?: number;
  readonly mainContentId?: string;
  readonly onClose?: () => void;
  readonly open: boolean;
  readonly testIdAttributes?: Record<string, string>;
};

const NOOP_ON_CLOSE = (): void => undefined;
const NO_TEST_ID_ATTRIBUTES: Record<string, string> = {};

const SidebarItemFixture = ({
  mainContentHeightPx = MAIN_CONTENT_HEIGHT_PX,
  mainContentId = MAIN_CONTENT_ID,
  onClose = NOOP_ON_CLOSE,
  open,
  testIdAttributes = NO_TEST_ID_ATTRIBUTES,
}: SidebarItemFixtureProps) => (
  <>
    <div
      id={mainContentId}
      style={{
        height: `${mainContentHeightPx}px`,
        left: 0,
        position: 'fixed',
        top: `${MAIN_CONTENT_TOP_PX}px`,
        width: '200px',
      }}
    />
    <SidebarItem
      closeIcon={(
        <span>
          {'Close icon'}
        </span>
      )}
      closeIconTooltipText={CLOSE_TOOLTIP_TEXT}
      onClose={onClose}
      open={open}
      testIdAttributes={testIdAttributes}
      title={TITLE}
      width={SIDEBAR_WIDTH}
    >
      <p>
        {'Sidebar body'}
      </p>
    </SidebarItem>
  </>
);

describe('SidebarItem', () => {
  it('renders the title, close button and children when open', async () => {
    const screen = await renderComponent(
      <SidebarItemFixture open />,
    );

    await expect.element(screen.getByRole('heading', { level: 3, name: TITLE })).toBeVisible();
    await expect.element(screen.getByText('Close icon')).toBeVisible();
    await expect.element(screen.getByTestId('SidebarItem-CloseButton')).toBeVisible();
    await expect.element(screen.getByText('Sidebar body')).toBeVisible();
  });

  it('renders no drawer content when initially closed', async () => {
    const screen = await renderComponent(
      <SidebarItemFixture open={false} />,
    );

    expect(screen.getByTestId('SidebarItem').query()).toBeNull();
    expect(screen.getByRole('heading', { level: 3, name: TITLE }).query()).toBeNull();
  });

  it('positions the drawer using the bounding box of the main content', async () => {
    const screen = await renderComponent(
      <SidebarItemFixture open />,
    );

    await expect.element(screen.getByTestId('SidebarItem')).toHaveStyle({
      height: `${MAIN_CONTENT_HEIGHT_PX}px`,
      top: `${MAIN_CONTENT_TOP_PX}px`,
    });
  });

  it('updates the drawer position when the main content is resized', async () => {
    const screen = await renderComponent(
      <SidebarItemFixture open />,
    );

    await expect.element(screen.getByTestId('SidebarItem')).toHaveStyle({
      height: `${MAIN_CONTENT_HEIGHT_PX}px`,
    });

    await screen.rerender(
      <SidebarItemFixture
        mainContentHeightPx={RESIZED_MAIN_CONTENT_HEIGHT_PX}
        open
      />,
    );

    await expect.element(screen.getByTestId('SidebarItem')).toHaveStyle({
      height: `${RESIZED_MAIN_CONTENT_HEIGHT_PX}px`,
    });
  });

  it('looks up the main content element using the configured layout id', async () => {
    const screen = await renderComponent(
      <SidebarItemFixture
        mainContentId={CUSTOM_MAIN_CONTENT_ID}
        open
      />,
      {
        configure: (config: ConfigBase) => {
          config.layout.MAIN_CONTENT_ID = CUSTOM_MAIN_CONTENT_ID;
        },
      },
    );

    await expect.element(screen.getByTestId('SidebarItem')).toHaveStyle({
      height: `${MAIN_CONTENT_HEIGHT_PX}px`,
      top: `${MAIN_CONTENT_TOP_PX}px`,
    });
  });

  it('applies the configured width to the header', async () => {
    const screen = await renderComponent(
      <SidebarItemFixture open />,
    );

    const headerElement = screen.getByRole('heading', { level: 3, name: TITLE }).element().parentElement;
    expect(getComputedStyle(headerElement).width).toBe(`${SIDEBAR_WIDTH * SPACING_PX}px`);
  });

  it('applies custom test id attributes to the drawer root', async () => {
    const screen = await renderComponent(
      <SidebarItemFixture
        open
        testIdAttributes={{ filter: 'filters' }}
      />,
    );

    await expect.element(screen.getByTestId('SidebarItem')).toHaveAttribute('data-testid-prop-filter', 'filters');
  });

  it('calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn();
    const screen = await renderComponent(
      <SidebarItemFixture
        onClose={onClose}
        open
      />,
    );

    await userEvent.click(screen.getByTestId('SidebarItem-CloseButton'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the Escape key is pressed', async () => {
    const onClose = vi.fn();
    await renderComponent(
      <SidebarItemFixture
        onClose={onClose}
        open
      />,
    );

    await userEvent.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows the close tooltip when hovering the close button', async () => {
    const screen = await renderComponent(
      <SidebarItemFixture open />,
    );

    await userEvent.hover(screen.getByTestId('SidebarItem-CloseButton'));

    await expect.element(screen.getByRole('tooltip')).toHaveTextContent(CLOSE_TOOLTIP_TEXT);
  });

  it('removes the header and body when closed', async () => {
    const screen = await renderComponent(
      <SidebarItemFixture open />,
    );

    await expect.element(screen.getByRole('heading', { level: 3, name: TITLE })).toBeVisible();

    await screen.rerender(
      <SidebarItemFixture open={false} />,
    );

    expect(screen.getByRole('heading', { level: 3, name: TITLE }).query()).toBeNull();
    expect(screen.getByText('Sidebar body').query()).toBeNull();

    await expect.element(screen.getByTestId('SidebarItem')).not.toBeInTheDocument();
  });

  it('removes the drawer on unmount', async () => {
    const screen = await renderComponent(
      <SidebarItemFixture open />,
    );

    await expect.element(screen.getByTestId('SidebarItem')).toBeVisible();

    await screen.unmount();

    expect(document.querySelector('[data-testid="SidebarItem"]')).toBeNull();
  });
});
