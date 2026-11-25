import type { ReactNode } from 'react';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { userEvent } from 'vitest/browser';
import { Box } from '@mui/material';

import { renderComponent } from '../../../test/lib';

import { SortableList } from './SortableList';
import type { SortableListBaseItem } from './SortableList';

type TestItem = SortableListBaseItem;

const ALPHA: TestItem = {
  id: 'alpha',
  isSelected: true,
  itemContent: 'Alpha content',
  label: 'Alpha',
};
const BETA: TestItem = {
  id: 'beta',
  isSelected: false,
  itemContent: 'Beta content',
  label: 'Beta',
};
const GAMMA: TestItem = {
  id: 'gamma',
  isSelected: true,
  itemContent: 'Gamma content',
  label: 'Gamma',
};
const ITEMS: TestItem[] = [ALPHA, BETA, GAMMA];

const TABLE_NAME = 'Change column order and visibility';
const CUSTOM_HEADER_TEXT = 'Custom header';
const OUTSIDE_TEXT = 'Outside drop zone';
const STATUS_ROLE = 'status';

const NOOP_ON_CHANGE = (): void => undefined;

const renderItemContent = (item: TestItem) => (
  <span>
    {item.itemContent}
  </span>
);

const renderCustomHeaderContent = () => (
  <span>
    {CUSTOM_HEADER_TEXT}
  </span>
);

type SortableListFixtureProps = {
  readonly items?: TestItem[];
  readonly onChange?: (items: TestItem[]) => void;
  readonly renderHeaderContent?: () => ReactNode;
};

const SortableListFixture = ({
  items = ITEMS,
  onChange = NOOP_ON_CHANGE,
  renderHeaderContent,
}: SortableListFixtureProps) => (
  <>
    <SortableList
      items={items}
      onChange={onChange}
      renderHeaderContent={renderHeaderContent}
      renderItemContent={renderItemContent}
    />
    <Box sx={{ marginTop: '400px' }}>
      <span>
        {OUTSIDE_TEXT}
      </span>
    </Box>
  </>
);

const getHandle = (screen: Awaited<ReturnType<typeof renderComponent>>, label: string) => screen.getByRole('button', { name: `Drag handle for ${label}` });

const focusHandle = (screen: Awaited<ReturnType<typeof renderComponent>>, label: string) => {
  (getHandle(screen, label).element() as HTMLElement).focus();
};

describe('SortableList', () => {
  it('renders the default headers and a row per item with its checkbox, content and drag handle', async () => {
    const screen = await renderComponent(
      <SortableListFixture />,
    );

    await expect.element(screen.getByRole('table', { name: TABLE_NAME })).toBeVisible();
    await expect.element(screen.getByText('Visible')).toBeVisible();
    await expect.element(screen.getByText('Column')).toBeVisible();

    await expect.element(screen.getByRole('checkbox', { name: 'Visibility for Alpha' })).toBeChecked();
    await expect.element(screen.getByRole('checkbox', { name: 'Visibility for Beta' })).not.toBeChecked();
    await expect.element(screen.getByRole('checkbox', { name: 'Visibility for Gamma' })).toBeChecked();

    await expect.element(screen.getByText('Alpha content')).toBeVisible();
    await expect.element(screen.getByText('Beta content')).toBeVisible();
    await expect.element(screen.getByText('Gamma content')).toBeVisible();

    await expect.element(getHandle(screen, 'Alpha')).toBeVisible();
    await expect.element(getHandle(screen, 'Beta')).toBeVisible();
    await expect.element(getHandle(screen, 'Gamma')).toBeVisible();
  });

  it('renders custom header content instead of the default column header', async () => {
    const screen = await renderComponent(
      <SortableListFixture renderHeaderContent={renderCustomHeaderContent} />,
    );

    await expect.element(screen.getByText(CUSTOM_HEADER_TEXT)).toBeVisible();
    await expect.element(screen.getByText('Visible')).toBeVisible();
    expect(screen.getByText('Column').elements()).toHaveLength(0);
  });

  it('calls onChange with the toggled visibility when a checkbox is clicked', async () => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <SortableListFixture onChange={onChange} />,
    );

    await userEvent.click(screen.getByRole('checkbox', { name: 'Visibility for Beta' }));
    expect(onChange).toHaveBeenLastCalledWith([
      ALPHA,
      { ...BETA, isSelected: true },
      GAMMA,
    ]);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Visibility for Alpha' }));
    expect(onChange).toHaveBeenLastCalledWith([
      { ...ALPHA, isSelected: false },
      BETA,
      GAMMA,
    ]);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('reorders items when an item is moved down with the keyboard', async () => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <SortableListFixture onChange={onChange} />,
    );

    focusHandle(screen, 'Alpha');
    await userEvent.keyboard(' ');
    await userEvent.keyboard('{ArrowDown}');
    await expect.element(screen.getByRole(STATUS_ROLE)).toHaveTextContent('Alpha moved to position 2 of 3.');

    await userEvent.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith([BETA, ALPHA, GAMMA]);
    expect(onChange).toHaveBeenCalledTimes(1);
    await expect.element(screen.getByRole(STATUS_ROLE)).toHaveTextContent('Alpha dropped at position 2 of 3.');
  });

  it('keeps the order and announces the cancellation when a keyboard drag is cancelled with Escape', async () => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <SortableListFixture onChange={onChange} />,
    );

    focusHandle(screen, 'Alpha');
    await userEvent.keyboard(' ');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Escape}');

    await expect.element(screen.getByRole(STATUS_ROLE)).toHaveTextContent('Reordering Alpha cancelled. Alpha returned to position 1 of 3.');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps the order when a keyboard drag is dropped on its own position', async () => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <SortableListFixture onChange={onChange} />,
    );

    focusHandle(screen, 'Alpha');
    await userEvent.keyboard(' ');
    await userEvent.keyboard(' ');

    await expect.element(screen.getByRole(STATUS_ROLE)).toHaveTextContent('Alpha dropped at position 1 of 3.');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('reorders items when a pointer drag is dropped on another item', async () => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <SortableListFixture onChange={onChange} />,
    );

    await userEvent.dragAndDrop(getHandle(screen, 'Alpha'), getHandle(screen, 'Gamma'), { steps: 10 });

    expect(onChange).toHaveBeenCalledWith([BETA, GAMMA, ALPHA]);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('keeps the order when a pointer drag is dropped outside the list', async () => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <SortableListFixture onChange={onChange} />,
    );

    await userEvent.dragAndDrop(getHandle(screen, 'Alpha'), screen.getByText(OUTSIDE_TEXT), { steps: 10 });

    await expect.element(screen.getByRole(STATUS_ROLE)).toHaveTextContent('Alpha returned to position 1 of 3.');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not change the order when the dragged item disappears during a keyboard drag that is cancelled', async () => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <SortableListFixture onChange={onChange} />,
    );

    focusHandle(screen, 'Alpha');
    await userEvent.keyboard(' ');
    await userEvent.keyboard('{ArrowDown}');
    await screen.rerender(
      <SortableListFixture
        items={[BETA, GAMMA]}
        onChange={onChange}
      />,
    );
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Escape}');

    expect(onChange).not.toHaveBeenCalled();
  });

  it('does not change the order when the dragged item disappears during a keyboard drag that is dropped', async () => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <SortableListFixture onChange={onChange} />,
    );

    focusHandle(screen, 'Alpha');
    await userEvent.keyboard(' ');
    await userEvent.keyboard('{ArrowDown}');
    await screen.rerender(
      <SortableListFixture
        items={[BETA, GAMMA]}
        onChange={onChange}
      />,
    );
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard(' ');

    expect(onChange).not.toHaveBeenCalled();
  });
});
