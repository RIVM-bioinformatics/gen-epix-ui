import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { container } from 'tsyringe';

import { EventBusService } from '../../../classes/services/EventBusService';
import { renderComponent } from '../../../test/lib';

import { TreeLineListLinkToggle } from './TreeLineListLinkToggle';

const LINKED_LABEL = 'Linked';
const UNLINKED_LABEL = 'Unlinked';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const getAnimatedWrapper = (): HTMLElement => {
  const switchRoot = document.querySelector<HTMLElement>('.MuiSwitch-root');
  if (!switchRoot?.parentElement) {
    throw new Error('Switch is not rendered');
  }
  return switchRoot.parentElement;
};

const getAnimationName = () => getComputedStyle(getAnimatedWrapper()).animationName;

const renderToggle = async (isLinked: boolean) => {
  return renderComponent(<TreeLineListLinkToggle isLinked={isLinked} />);
};

describe('TreeLineListLinkToggle', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the linked label when linked', async () => {
    const screen = await renderToggle(true);

    await expect.element(screen.getByText(LINKED_LABEL)).toBeVisible();
    await expect.element(screen.getByText(UNLINKED_LABEL)).not.toBeInTheDocument();
  });

  it('renders the unlinked label when not linked', async () => {
    const screen = await renderToggle(false);

    await expect.element(screen.getByText(UNLINKED_LABEL)).toBeVisible();
    await expect.element(screen.getByText(LINKED_LABEL)).not.toBeInTheDocument();
  });

  it('does not animate on mount', async () => {
    await renderToggle(false);

    expect(getAnimationName()).toBe('none');
  });

  it('animates when the link is lost without a user-initiated unlink', async () => {
    const screen = await renderToggle(true);

    await screen.rerender(<TreeLineListLinkToggle isLinked={false} />);

    await expect.element(screen.getByText(UNLINKED_LABEL)).toBeVisible();
    await expect.poll(getAnimationName).not.toBe('none');
  });

  it('animates when the unlink event has no payload', async () => {
    const screen = await renderToggle(true);

    container.resolve(EventBusService).emit('onUnlinkLineListAndTree');
    await screen.rerender(<TreeLineListLinkToggle isLinked={false} />);

    await expect.poll(getAnimationName).not.toBe('none');
  });

  it('does not animate when the link is gained', async () => {
    const screen = await renderToggle(false);

    await screen.rerender(<TreeLineListLinkToggle isLinked />);

    await expect.element(screen.getByText(LINKED_LABEL)).toBeVisible();
    expect(getAnimationName()).toBe('none');
  });

  it('does not animate when the user initiated the unlink', async () => {
    const screen = await renderToggle(true);

    container.resolve(EventBusService).emit('onUnlinkLineListAndTree', { userInitiated: true });
    await screen.rerender(<TreeLineListLinkToggle isLinked={false} />);

    await expect.element(screen.getByText(UNLINKED_LABEL)).toBeVisible();
    expect(getAnimationName()).toBe('none');
  });

  it('does not animate when the user preference requests reduced motion', async () => {
    const matchMediaMock = vi.fn(() => ({ matches: true }));
    vi.stubGlobal('matchMedia', matchMediaMock);
    const screen = await renderToggle(true);

    await screen.rerender(<TreeLineListLinkToggle isLinked={false} />);

    await expect.element(screen.getByText(UNLINKED_LABEL)).toBeVisible();
    expect(matchMediaMock).toHaveBeenCalledWith(REDUCED_MOTION_QUERY);
    expect(getAnimationName()).toBe('none');
  });

  it('animates when matchMedia is not available', async () => {
    vi.stubGlobal('matchMedia', undefined);
    const screen = await renderToggle(true);

    await screen.rerender(<TreeLineListLinkToggle isLinked={false} />);

    await expect.poll(getAnimationName).not.toBe('none');
  });
});
