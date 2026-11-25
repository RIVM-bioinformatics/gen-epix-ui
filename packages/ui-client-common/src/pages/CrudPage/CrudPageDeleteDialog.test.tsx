import { createRef } from 'react';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type { GenericData } from '../../models/data.models';
import { renderComponent } from '../../test/lib';

import { CrudPageDeleteDialog } from './CrudPageDeleteDialog';
import type { CrudPageDeleteDialogRefMethods } from './CrudPageDeleteDialog';

interface TestItem extends GenericData {
  readonly name: string;
}

const itemFixture: TestItem = {
  id: 'item-1',
  name: 'Item one',
};

const getName = (item: TestItem) => item.name;

const renderDialog = async (
  onConfirm: (item: TestItem) => void = vi.fn(),
) => {
  const ref = createRef<CrudPageDeleteDialogRefMethods<TestItem>>();
  const screen = await renderComponent(
    <CrudPageDeleteDialog
      getName={getName}
      onConfirm={onConfirm}
      ref={ref}
    />,
  );
  ref.current?.open({ item: itemFixture });
  return screen;
};

describe('CrudPageDeleteDialog', () => {
  it('renders the title and confirmation message with the item name', async () => {
    const screen = await renderDialog();

    await expect.element(screen.getByRole('heading', { name: 'Delete item: Item one' })).toBeVisible();
    await expect.element(screen.getByText('Are you sure you want to delete the item "Item one"?')).toBeVisible();
  });

  it('renders the cancel and confirm actions', async () => {
    const screen = await renderDialog();

    await expect.element(screen.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Confirm' })).toBeVisible();
  });

  it('calls onConfirm with the item and closes the dialog when confirm is clicked', async () => {
    const onConfirm = vi.fn();
    const screen = await renderDialog(onConfirm);

    await screen.getByRole('button', { name: 'Confirm' }).click();

    expect(onConfirm).toHaveBeenCalledExactlyOnceWith(itemFixture);
    await expect.element(screen.getByRole('heading', { name: 'Delete item: Item one' })).not.toBeInTheDocument();
  });

  it('closes the dialog without confirming when cancel is clicked', async () => {
    const onConfirm = vi.fn();
    const screen = await renderDialog(onConfirm);

    await screen.getByRole('button', { name: 'Cancel' }).click();

    expect(onConfirm).not.toHaveBeenCalled();
    await expect.element(screen.getByRole('heading', { name: 'Delete item: Item one' })).not.toBeInTheDocument();
  });
});
