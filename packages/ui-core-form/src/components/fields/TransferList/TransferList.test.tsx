import type {
  PropsWithChildren,
  ReactElement,
} from 'react';
import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { renderComponent } from '../../../test/lib';

import { TransferList } from './TransferList';

type TransferForm = {
  selected: null | string[];
};

const FocusTransferList = ({ children }: PropsWithChildren): ReactElement => {
  const { setFocus } = useFormContext<TransferForm>();

  useEffect(() => {
    setFocus('selected');
  }, [setFocus]);

  return (
    <>
      {children}
    </>
  );
};

const options = [
  { label: 'Apple', value: 'apple' },
  { label: 'Pear', value: 'pear' },
];

describe('TransferList', () => {
  it('moves selected and all options, clears, and resets to the form default', async () => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <TransferList<TransferForm, 'selected'>
        label={'Fruits'}
        name={'selected'}
        onChange={onChange}
        options={options}
      />,
      { form: { defaultValues: { selected: ['apple'] } } },
    );
    const moveSelectedRight = screen.getByRole('button', { name: 'move selected right' });
    const moveSelectedLeft = screen.getByRole('button', { name: 'move selected left' });
    const moveAllRight = screen.getByRole('button', { name: 'move all right' });
    const moveAllLeft = screen.getByRole('button', { name: 'move all left' });

    await expect.element(moveSelectedRight).toBeDisabled();
    await expect.element(moveSelectedLeft).toBeDisabled();

    const pear = screen.getByText('Pear');
    await pear.click();
    await pear.click();
    await expect.element(moveSelectedRight).toBeDisabled();
    await pear.click();
    await expect.element(moveSelectedRight).toBeEnabled();
    await moveSelectedRight.click();
    expect(onChange).toHaveBeenLastCalledWith(['apple', 'pear']);
    await expect.element(screen.getByText('Pear')).toBeVisible();

    await screen.getByText('Apple').click();
    await moveSelectedLeft.click();
    expect(onChange).toHaveBeenLastCalledWith(['pear']);

    await moveAllRight.click();
    expect(onChange).toHaveBeenLastCalledWith(['apple', 'pear']);
    await moveAllLeft.click();
    expect(onChange).toHaveBeenLastCalledWith([]);

    await screen.getByRole('button', { name: 'clear' }).click();
    expect(onChange).toHaveBeenLastCalledWith([]);

    await moveAllRight.click();
    await screen.getByRole('button', { name: 'Reset selection' }).click();
    await expect.element(screen.getByText('Apple')).toBeVisible();
    await screen.getByText('Apple').click();
    await moveSelectedLeft.click();
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it('handles an unset value, filters case-insensitively and safely supports special or unlabeled options', async () => {
    const screen = await renderComponent(
      <TransferList<TransferForm, 'selected'>
        infoMessage={'Choose fruits'}
        label={'Fruits'}
        name={'selected'}
        options={[
          { label: 'Prototype fruit', value: '__proto__' },
          { value: 'unlabeled' },
          { label: 'Pear', value: 'pear' },
        ]}
      />,
      {
        form: { defaultValues: { selected: null } },
        wrapper: FocusTransferList,
      },
    );
    const filter = screen.getByRole('textbox', { name: 'Filter' });

    await expect.element(filter).toHaveFocus();
    await expect.element(screen.getByRole('alert')).toHaveTextContent('Choose fruits');
    await expect.element(screen.getByText('Prototype fruit')).toBeVisible();
    await filter.fill('PROTOTYPE');

    await expect.element(screen.getByText('Prototype fruit')).toBeVisible();
    await expect.element(screen.getByText('Pear')).not.toBeInTheDocument();
    await screen.getByText('Prototype fruit').click();
    await screen.getByRole('button', { name: 'move selected right' }).click();
    await expect.element(screen.getByText('Prototype fruit')).toBeVisible();
  });

  it('does not clear the final selection when the field is required', async () => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <TransferList<TransferForm, 'selected'>
        label={'Fruits'}
        name={'selected'}
        onChange={onChange}
        options={options}
        required
      />,
      { form: { defaultValues: { selected: ['apple'] } } },
    );

    await expect.element(screen.getByText('Fruits *')).toBeVisible();
    await screen.getByText('Apple').click();
    await screen.getByRole('button', { name: 'move selected left' }).click();

    expect(onChange).not.toHaveBeenCalled();
    await expect.element(screen.getByText('Apple')).toBeVisible();
    await screen.getByRole('button', { name: 'clear' }).click();
    expect(onChange).not.toHaveBeenCalled();

    await screen.getByText('Pear').click();
    await screen.getByRole('button', { name: 'move selected right' }).click();
    expect(onChange).toHaveBeenLastCalledWith(['apple', 'pear']);
  });

  it('disables list controls during loading or when disabled', async () => {
    const screen = await renderComponent(
      <TransferList<TransferForm, 'selected'>
        label={'Fruits'}
        loading
        name={'selected'}
        options={options}
      />,
      { form: { defaultValues: { selected: [] } } },
    );
    const filter = screen.getByRole('textbox', { name: 'Filter' });

    await expect.element(filter).toBeDisabled();
    await expect.element(screen.getByRole('checkbox', { name: 'Apple' })).toBeDisabled();
    await expect.element(screen.getByRole('button', { name: 'move all right' })).toBeDisabled();
    await expect.element(screen.getByRole('progressbar')).toBeVisible();

    await screen.rerender(
      <TransferList<TransferForm, 'selected'>
        disabled
        label={'Fruits'}
        name={'selected'}
        options={options}
      />,
    );

    await expect.element(filter).toBeDisabled();
    await expect.element(screen.getByRole('checkbox', { name: 'Apple' })).toBeDisabled();
    await expect.element(screen.getByRole('progressbar')).not.toBeInTheDocument();
  });

  it('disables all move controls when there are no options', async () => {
    const screen = await renderComponent(
      <TransferList<TransferForm, 'selected'>
        label={'Fruits'}
        name={'selected'}
        options={[]}
      />,
      { form: { defaultValues: { selected: [] } } },
    );

    await expect.element(screen.getByRole('button', { name: 'move selected right' })).toBeDisabled();
    await expect.element(screen.getByRole('button', { name: 'move selected left' })).toBeDisabled();
    await expect.element(screen.getByRole('button', { name: 'move all right' })).toBeDisabled();
    await expect.element(screen.getByRole('button', { name: 'move all left' })).toBeDisabled();
    await expect.element(screen.getByRole('button', { name: 'Reset selection' })).toBeDisabled();
  });

  it('shows field errors instead of warning or info messages', async () => {
    const screen = await renderComponent(
      <TransferList<TransferForm, 'selected'>
        infoMessage={'More information'}
        label={'Fruits'}
        name={'selected'}
        options={options}
        warningMessage={'Check the selection'}
      />,
      {
        form: {
          defaultValues: { selected: [] },
          errors: { selected: { message: 'Select at least one fruit', type: 'manual' } },
        },
      },
    );

    await expect.element(screen.getByRole('alert')).toHaveTextContent('Select at least one fruit');
    await expect.element(screen.getByRole('alert')).not.toHaveTextContent('Check the selection');
    await expect.element(screen.getByRole('alert')).not.toHaveTextContent('More information');
  });
});
