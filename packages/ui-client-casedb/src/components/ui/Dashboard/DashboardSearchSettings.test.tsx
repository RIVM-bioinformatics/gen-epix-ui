import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { userEvent } from 'vitest/browser';
import type { KeyboardEvent } from 'react';

import { renderComponent } from '../../../test/lib';

import type {
  DashboardSearchMode,
  DashboardSearchSettingsProps,
} from './DashboardSearchSettings';
import { DashboardSearchSettings } from './DashboardSearchSettings';

const MENU_ITEM_NAMES: Record<DashboardSearchMode, string> = {
  'exact-match': 'Exact match',
  'fuzzy-match': 'Fuzzy match',
  'include-match': 'Include match',
  'prefix-exact-match': 'Starts with',
  'suffix-exact-match': 'Ends with',
};

let anchorElement: HTMLButtonElement;

const renderSettings = async (overrides: Partial<DashboardSearchSettingsProps> = {}) => {
  const props: DashboardSearchSettingsProps = {
    anchorEl: anchorElement,
    onChange: vi.fn(),
    onClose: vi.fn(),
    onEscapeKeyDown: vi.fn(),
    open: true,
    searchMode: 'include-match',
    ...overrides,
  };
  const screen = await renderComponent(
    <DashboardSearchSettings {...props} />,
  );
  return { props, screen };
};

const renderSettingsWithParentKeyDown = async (onParentKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void, overrides: Partial<DashboardSearchSettingsProps> = {}) => {
  const props: DashboardSearchSettingsProps = {
    anchorEl: anchorElement,
    onChange: vi.fn(),
    onClose: vi.fn(),
    onEscapeKeyDown: vi.fn(),
    open: true,
    searchMode: 'include-match',
    ...overrides,
  };
  const screen = await renderComponent(
    <div
      onKeyDown={onParentKeyDown}
      role={'presentation'}
    >
      <DashboardSearchSettings {...props} />
    </div>,
  );
  return { props, screen };
};

const expectFocused = async (element: Element) => {
  await vi.waitFor(() => {
    expect(document.activeElement).toBe(element);
  });
};

describe('DashboardSearchSettings', () => {
  beforeEach(() => {
    anchorElement = document.createElement('button');
    anchorElement.textContent = 'Anchor';
    document.body.append(anchorElement);
  });

  afterEach(() => {
    anchorElement.remove();
  });

  it('renders all search mode options and the operator help when open', async () => {
    const { screen } = await renderSettings();

    await expect.element(screen.getByRole('menuitem', { exact: true, name: 'Include match' })).toBeInTheDocument();
    await expect.element(screen.getByRole('menuitem', { exact: true, name: 'Fuzzy match' })).toBeInTheDocument();
    await expect.element(screen.getByRole('menuitem', { exact: true, name: 'Exact match' })).toBeInTheDocument();
    await expect.element(screen.getByRole('menuitem', { exact: true, name: 'Starts with' })).toBeInTheDocument();
    await expect.element(screen.getByRole('menuitem', { exact: true, name: 'Ends with' })).toBeInTheDocument();
    await expect.element(screen.getByText('Operators')).toBeInTheDocument();
    await expect.element(screen.getByText('Spaces combine terms with AND.')).toBeInTheDocument();
  });

  it('renders nothing when closed', async () => {
    await renderSettings({ open: false });

    expect(document.querySelector('[data-testid="DashboardSearchSettings"]')).toBeNull();
  });

  it('shows the check icon only on the currently selected search mode', async () => {
    const { screen } = await renderSettings({ searchMode: 'exact-match' });
    const selectedMenuItem = screen.getByRole('menuitem', { exact: true, name: 'Exact match' });
    await expect.element(selectedMenuItem).toBeInTheDocument();

    const selectedMenuItemElement = selectedMenuItem.element();
    expect(selectedMenuItemElement.querySelector('[data-testid="CheckIcon"]')).not.toBeNull();

    const otherMenuItemNames = Object.values(MENU_ITEM_NAMES).filter(name => name !== 'Exact match');
    for (const name of otherMenuItemNames) {
      const otherMenuItemElement = screen.getByRole('menuitem', { exact: true, name }).element();
      expect(otherMenuItemElement.querySelector('[data-testid="CheckIcon"]')).toBeNull();
    }
  });

  it.each([
    ['Include match', 'include-match'],
    ['Fuzzy match', 'fuzzy-match'],
    ['Exact match', 'exact-match'],
    ['Starts with', 'prefix-exact-match'],
    ['Ends with', 'suffix-exact-match'],
  ] as const)('calls onChange with the mode and onClose when "%s" is clicked', async (label, searchMode) => {
    const { props, screen } = await renderSettings({ searchMode: 'include-match' });

    await screen.getByRole('menuitem', { exact: true, name: label }).click();

    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onChange).toHaveBeenCalledWith(searchMode);
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onEscapeKeyDown).not.toHaveBeenCalled();
  });

  it('calls onEscapeKeyDown on Escape and stops the event from bubbling', async () => {
    const onParentKeyDown = vi.fn();
    const { props, screen } = await renderSettingsWithParentKeyDown(onParentKeyDown);
    const selectedMenuItemElement = screen.getByRole('menuitem', { exact: true, name: 'Include match' }).element();
    await expectFocused(selectedMenuItemElement);

    await userEvent.keyboard('{Escape}');

    expect(props.onEscapeKeyDown).toHaveBeenCalledTimes(1);
    expect(onParentKeyDown).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
    expect(props.onChange).not.toHaveBeenCalled();
  });

  it('ignores other keys and lets them bubble', async () => {
    const onParentKeyDown = vi.fn();
    const { props, screen } = await renderSettingsWithParentKeyDown(onParentKeyDown);
    const selectedMenuItemElement = screen.getByRole('menuitem', { exact: true, name: 'Include match' }).element();
    await expectFocused(selectedMenuItemElement);

    await userEvent.keyboard('{ArrowDown}');

    expect(props.onEscapeKeyDown).not.toHaveBeenCalled();
    expect(onParentKeyDown).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking outside the settings panel', async () => {
    const { props, screen } = await renderSettings();
    await expect.element(screen.getByRole('menuitem', { exact: true, name: 'Include match' })).toBeInTheDocument();

    await userEvent.click(anchorElement);

    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(props.onChange).not.toHaveBeenCalled();
  });
});
