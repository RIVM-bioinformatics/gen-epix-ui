import type { StoreApi } from 'zustand';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  useCallback,
  useState,
} from 'react';
import { MenuItem } from '@mui/material';
import type { CaseDbCase } from '@gen-epix/api-casedb';

import { renderComponent } from '../../../test/lib';
import { createCompleteCaseType } from '../../../test/fixtures/completeCaseType';
import { CaseDbStandardConfigUtil } from '../../../utils/CaseDbStandardConfigUtil';
import { createCaseDbDemoTheme } from '../../../theme/demoTheme';
import {
  createDashboardStore,
  DashboardStoreContext,
} from '../../../stores/dashboardStore';
import type { DashboardStore } from '../../../stores/dashboardStore';

import { ContextMenu } from './ContextMenu';

type ContextMenuConfig = Parameters<typeof ContextMenu>[0]['config'];

const EXTRA_ITEM_LABEL = 'Extra item';
const STORAGE_NAME_POST_FIX = 'context-menu';

let store: StoreApi<DashboardStore>;
let anchorElements: Element[] = [];

const createStore = () => {
  return createDashboardStore({
    caseSetId: 'case-set-1',
    completeCaseType: createCompleteCaseType(),
    config: { ...CaseDbStandardConfigUtil.createConfig(), theme: createCaseDbDemoTheme('light') },
    idSelectorCallback: (row: CaseDbCase) => row.id,
    storageNamePostFix: STORAGE_NAME_POST_FIX,
    storageVersion: 1,
  });
};

type ContextMenuHarnessProps = {
  readonly initialConfig: ContextMenuConfig | null;
  readonly onMenuClose: () => void;
  readonly withExtraItems: boolean;
};

// Mirrors the real callers, which clear their config when the menu closes.
const ContextMenuHarness = ({ initialConfig, onMenuClose, withExtraItems }: ContextMenuHarnessProps) => {
  const [config, setConfig] = useState(initialConfig);
  const onMenuCloseWithReset = useCallback(() => {
    setConfig(null);
    onMenuClose();
  }, [onMenuClose]);

  return (
    <ContextMenu
      config={config}
      getExtraItems={withExtraItems
        ? onMenuCloseCallback => (
          <MenuItem onClick={onMenuCloseCallback}>
            {EXTRA_ITEM_LABEL}
          </MenuItem>
        )
        : undefined}
      onMenuClose={onMenuCloseWithReset}
    />
  );
};

const renderContextMenu = async (
  config: ContextMenuConfig | null,
  selectedIds: string[] = [],
  withExtraItems = true,
) => {
  store.getState().setSelectedIds(selectedIds);
  const onMenuClose = vi.fn();
  const screen = await renderComponent(
    <DashboardStoreContext value={store}>
      <ContextMenuHarness
        initialConfig={config}
        onMenuClose={onMenuClose}
        withExtraItems={withExtraItems}
      />
    </DashboardStoreContext>,
  );
  return { onMenuClose, screen };
};


const createAnchorElement = (text: string) => {
  const anchorElement = document.createElement('div');
  anchorElement.textContent = text;
  document.body.append(anchorElement);
  anchorElements.push(anchorElement);
  return anchorElement;
};

const createMouseEvent = (modifiers: { ctrlKey?: boolean; metaKey?: boolean }) => {
  return new MouseEvent('click', modifiers);
};

describe('ContextMenu', () => {
  beforeEach(() => {
    store = createStore();
  });

  afterEach(() => {
    store.getState().destroy();
    localStorage.removeItem(`GENEPIX-TableStore-${STORAGE_NAME_POST_FIX}`);
    anchorElements.forEach(anchorElement => anchorElement.remove());
    anchorElements = [];
  });

  it('does not render the menu when there is no config', async () => {
    await renderContextMenu(null);

    expect(document.querySelector('[role="menu"]')).toBeNull();
  });

  it('renders the menu items and the extra items at the given position', async () => {
    const { screen } = await renderContextMenu({ caseIds: ['case-1'], position: { left: 20, top: 20 } });

    await expect.element(screen.getByRole('menu')).toBeVisible();
    await expect.element(screen.getByRole('menuitem', { exact: true, name: EXTRA_ITEM_LABEL })).toBeVisible();
    await expect.element(screen.getByRole('menuitem', { exact: true, name: 'Select rows' })).toBeVisible();
    await expect.element(screen.getByRole('menuitem', { exact: true, name: 'Add to selected rows' })).toBeVisible();
    await expect.element(screen.getByRole('menuitem', { exact: true, name: 'Remove from selected rows' })).toBeVisible();
    await expect.element(screen.getByRole('menuitem', { exact: true, name: 'Refine selected rows (intersect)' })).toBeVisible();
  });

  it('disables all selection items when there are no case ids', async () => {
    const { screen } = await renderContextMenu({ caseIds: [], position: { left: 20, top: 20 } });

    await expect.element(screen.getByRole('menuitem', { exact: true, name: 'Select rows' })).toHaveAttribute('aria-disabled', 'true');
    await expect.element(screen.getByRole('menuitem', { exact: true, name: 'Add to selected rows' })).toHaveAttribute('aria-disabled', 'true');
    await expect.element(screen.getByRole('menuitem', { exact: true, name: 'Remove from selected rows' })).toHaveAttribute('aria-disabled', 'true');
    await expect.element(screen.getByRole('menuitem', { exact: true, name: 'Refine selected rows (intersect)' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('parses the case ids from the anchor element and anchors the menu to it', async () => {
    const anchorElement = createAnchorElement('case-1,case-2');
    const { onMenuClose, screen } = await renderContextMenu({
      anchorElement,
      parseIdsFromAnchorElement: element => (element.textContent ?? '').split(','),
    });

    await expect.element(screen.getByRole('menu')).toBeVisible();
    await screen.getByRole('menuitem', { exact: true, name: 'Select rows' }).click();

    expect(store.getState().selectedIds).toEqual(['case-1', 'case-2']);
    expect(onMenuClose).toHaveBeenCalledTimes(1);
  });

  it('selects only the component rows when Select rows is clicked', async () => {
    const { onMenuClose, screen } = await renderContextMenu({ caseIds: ['case-1', 'case-2'], position: { left: 20, top: 20 } }, ['case-3']);

    await screen.getByRole('menuitem', { exact: true, name: 'Select rows' }).click();

    expect(store.getState().selectedIds).toEqual(['case-1', 'case-2']);
    expect(onMenuClose).toHaveBeenCalledTimes(1);
  });

  it('adds the component rows to the selection', async () => {
    const { onMenuClose, screen } = await renderContextMenu({ caseIds: ['case-1', 'case-2'], position: { left: 20, top: 20 } }, ['case-3']);

    await expect.element(screen.getByRole('menuitem', { exact: true, name: 'Add to selected rows' })).not.toHaveAttribute('aria-disabled', 'true');
    await screen.getByRole('menuitem', { exact: true, name: 'Add to selected rows' }).click();

    expect(store.getState().selectedIds).toEqual(['case-3', 'case-1', 'case-2']);
    expect(onMenuClose).toHaveBeenCalledTimes(1);
  });

  it('disables adding to the selection when all component rows are already selected', async () => {
    const { screen } = await renderContextMenu({ caseIds: ['case-1'], position: { left: 20, top: 20 } }, ['case-1']);

    await expect.element(screen.getByRole('menuitem', { exact: true, name: 'Add to selected rows' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('removes the component rows from the selection', async () => {
    const { onMenuClose, screen } = await renderContextMenu({ caseIds: ['case-1', 'case-2'], position: { left: 20, top: 20 } }, ['case-1', 'case-2', 'case-3']);

    await expect.element(screen.getByRole('menuitem', { exact: true, name: 'Remove from selected rows' })).not.toHaveAttribute('aria-disabled', 'true');
    await screen.getByRole('menuitem', { exact: true, name: 'Remove from selected rows' }).click();

    expect(store.getState().selectedIds).toEqual(['case-3']);
    expect(onMenuClose).toHaveBeenCalledTimes(1);
  });

  it('disables removing from the selection when no component rows are selected', async () => {
    const { screen } = await renderContextMenu({ caseIds: ['case-1'], position: { left: 20, top: 20 } }, ['case-2']);

    await expect.element(screen.getByRole('menuitem', { exact: true, name: 'Remove from selected rows' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('refines the selection to the component rows', async () => {
    const { onMenuClose, screen } = await renderContextMenu({ caseIds: ['case-1', 'case-2'], position: { left: 20, top: 20 } }, ['case-2', 'case-3']);

    await expect.element(screen.getByRole('menuitem', { exact: true, name: 'Refine selected rows (intersect)' })).not.toHaveAttribute('aria-disabled', 'true');
    await screen.getByRole('menuitem', { exact: true, name: 'Refine selected rows (intersect)' }).click();

    expect(store.getState().selectedIds).toEqual(['case-2']);
    expect(onMenuClose).toHaveBeenCalledTimes(1);
  });

  it('disables refining when the selection is already equal to the component rows', async () => {
    const { screen } = await renderContextMenu({ caseIds: ['case-1'], position: { left: 20, top: 20 } }, ['case-1']);

    await expect.element(screen.getByRole('menuitem', { exact: true, name: 'Refine selected rows (intersect)' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('renders only the built-in items when no extra items are given', async () => {
    const { screen } = await renderContextMenu({ caseIds: ['case-1'], position: { left: 20, top: 20 } }, [], false);

    await expect.element(screen.getByRole('menuitem', { exact: true, name: 'Select rows' })).toBeVisible();
    expect(screen.getByRole('menuitem', { exact: true, name: EXTRA_ITEM_LABEL }).query()).toBeNull();
  });

  it('calls the close callback from an extra item', async () => {
    const { onMenuClose, screen } = await renderContextMenu({ caseIds: ['case-1'], position: { left: 20, top: 20 } });

    await screen.getByRole('menuitem', { exact: true, name: EXTRA_ITEM_LABEL }).click();

    expect(onMenuClose).toHaveBeenCalledTimes(1);
  });

  it('adds the component rows to the selection on ctrl-click and closes the menu', async () => {
    const { onMenuClose } = await renderContextMenu({
      caseIds: ['case-1'],
      mouseEvent: createMouseEvent({ ctrlKey: true }),
      position: { left: 20, top: 20 },
    }, ['case-2']);

    await expect.poll(() => store.getState().selectedIds).toEqual(['case-2', 'case-1']);
    expect(onMenuClose).toHaveBeenCalledTimes(1);
  });

  it('removes the component rows from the selection on meta-click and closes the menu', async () => {
    const { onMenuClose } = await renderContextMenu({
      caseIds: ['case-1'],
      mouseEvent: createMouseEvent({ metaKey: true }),
      position: { left: 20, top: 20 },
    }, ['case-1', 'case-2']);

    await expect.poll(() => store.getState().selectedIds).toEqual(['case-2']);
    expect(onMenuClose).toHaveBeenCalledTimes(1);
  });

  it('does not change the selection on ctrl-click when there are no component rows', async () => {
    const { onMenuClose } = await renderContextMenu({
      caseIds: [],
      mouseEvent: createMouseEvent({ ctrlKey: true }),
      position: { left: 20, top: 20 },
    }, ['case-2']);

    await expect.poll(() => store.getState().selectedIds).toEqual(['case-2']);
    expect(onMenuClose).not.toHaveBeenCalled();
  });

  it('ignores a click without a ctrl or meta key', async () => {
    const { onMenuClose } = await renderContextMenu({
      caseIds: ['case-1'],
      mouseEvent: createMouseEvent({}),
      position: { left: 20, top: 20 },
    }, ['case-2']);

    await expect.poll(() => store.getState().selectedIds).toEqual(['case-2']);
    expect(onMenuClose).not.toHaveBeenCalled();
  });
});
