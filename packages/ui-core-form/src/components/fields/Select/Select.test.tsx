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

import { Select } from './Select';

type FruitForm = {
  fruit: boolean | null | number | string;
};

type MultipleFruitForm = {
  fruits: Array<boolean | number | string> | null;
};

const FocusFruitField = ({ children }: PropsWithChildren): ReactElement => {
  const { setFocus } = useFormContext<FruitForm>();

  useEffect(() => {
    setFocus('fruit');
  }, [setFocus]);

  return (
    <>
      {children}
    </>
  );
};

describe('Select', () => {
  it('renders option labels, disables unavailable options, selects and clears a value', async () => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <Select<FruitForm, 'fruit', false>
        infoMessage={'More information'}
        label={'Fruit'}
        name={'fruit'}
        onChange={onChange}
        options={[
          { label: 'Apple', value: 'apple' },
          { disabled: true, label: 'Unavailable fruit', value: 'unavailable' },
          { label: 'Pear', value: 'pear' },
        ]}
        warningMessage={'Check the fruit'}
      />,
      { form: { defaultValues: { fruit: 'pear' } } },
    );
    const select = screen.getByRole('combobox', { name: 'Fruit' });

    await expect.element(select).toHaveTextContent('Pear');
    await expect.element(screen.getByRole('alert')).toHaveTextContent('Check the fruit');

    await select.click();
    await expect.element(screen.getByRole('option', { name: 'Unavailable fruit' })).toBeDisabled();
    await screen.getByRole('option', { name: 'Apple' }).click();

    expect(onChange).toHaveBeenLastCalledWith('apple');
    await expect.element(select).toHaveTextContent('Apple');

    await screen.getByRole('button', { name: 'Clear selection' }).click();

    expect(onChange).toHaveBeenLastCalledWith('');
    await expect.element(select).not.toHaveTextContent('Apple');
  });

  it('preserves numeric and boolean option values and distinguishes equal string representations', async () => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <Select<FruitForm, 'fruit', false>
        label={'Fruit'}
        name={'fruit'}
        onChange={onChange}
        options={[
          { label: 'Numeric one', value: 1 },
          { label: 'Text one', value: '1' },
          { label: 'False fruit', value: false },
        ]}
      />,
      { form: { defaultValues: { fruit: 1 } } },
    );
    const select = screen.getByRole('combobox', { name: 'Fruit' });

    await expect.element(select).toHaveTextContent('Numeric one');
    await select.click();
    await expect.element(screen.getByRole('option', { name: 'Text one' })).toBeVisible();
    await screen.getByRole('option', { name: 'False fruit' }).click();

    expect(onChange).toHaveBeenLastCalledWith(false);
    await expect.element(select).toHaveTextContent('False fruit');
  });

  it('handles an unset multiple value and reports selected and cleared numeric values', async () => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <Select<MultipleFruitForm, 'fruits', true>
        label={'Fruits'}
        multiple
        name={'fruits'}
        onChange={onChange}
        options={[
          { label: 'Apple', value: 1 },
          { disabled: true, label: 'Unavailable fruit', value: 2 },
        ]}
      />,
    );
    const select = screen.getByRole('combobox', { name: 'Fruits' });

    await screen.getByRole('button', { name: 'Clear selection' }).click();
    expect(onChange).toHaveBeenLastCalledWith([]);

    await select.click();
    await expect.element(screen.getByRole('option', { name: 'Unavailable fruit' })).toBeDisabled();
    await screen.getByRole('option', { name: 'Apple' }).click();

    expect(onChange).toHaveBeenLastCalledWith([1]);
    await expect.element(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute('aria-selected', 'true');
  });

  it('disables the field and clear control while loading, disabled, or required', async () => {
    const props = {
      label: 'Fruit',
      name: 'fruit' as const,
      options: [{ label: 'Apple', value: 'apple' }],
    };
    const screen = await renderComponent(
      <Select<FruitForm, 'fruit', false>
        {...props}
        loading
      />,
      { form: { defaultValues: { fruit: 'apple' } } },
    );
    const select = screen.getByRole('combobox', { name: 'Fruit' });

    await expect.element(select).toBeDisabled();
    await expect.element(screen.getByRole('progressbar')).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument();

    await screen.rerender(
      <Select<FruitForm, 'fruit', false>
        {...props}
        disabled
      />,
    );

    await expect.element(select).toBeDisabled();
    await expect.element(screen.getByRole('progressbar')).not.toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument();

    await screen.rerender(
      <Select<FruitForm, 'fruit', false>
        {...props}
        required
      />,
    );

    await expect.element(select).toBeEnabled();
    await expect.element(screen.getByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument();
  });

  it('shows field errors instead of warning or info messages and suppresses required when disabled', async () => {
    const screen = await renderComponent(
      <Select<FruitForm, 'fruit', false>
        disabled
        infoMessage={'More information'}
        label={'Fruit'}
        name={'fruit'}
        options={[{ label: 'Apple', value: 'apple' }]}
        required
        warningMessage={'Check the fruit'}
      />,
      {
        form: {
          defaultValues: { fruit: 'apple' },
          errors: { fruit: { message: 'Choose a fruit', type: 'manual' } },
        },
      },
    );

    await expect.element(screen.getByRole('combobox', { name: 'Fruit' })).toBeDisabled();
    await expect.element(screen.getByRole('alert')).toHaveTextContent('Choose a fruit');
    await expect.element(screen.getByRole('alert')).not.toHaveTextContent('Check the fruit');
    await expect.element(screen.getByRole('alert')).not.toHaveTextContent('More information');
  });

  it('focuses through the form ref, renders info, and updates without an optional callback', async () => {
    const screen = await renderComponent(
      <Select<FruitForm, 'fruit', false>
        infoMessage={'Fruit details'}
        label={'Fruit'}
        name={'fruit'}
        options={[{ label: 'Apple', value: 'apple' }]}
      />,
      {
        wrapper: FocusFruitField,
      },
    );
    const select = screen.getByRole('combobox', { name: 'Fruit' });

    await expect.element(select).toHaveFocus();
    await expect.element(screen.getByRole('alert')).toHaveTextContent('Fruit details');
    await expect.element(select).not.toHaveTextContent('Apple');

    await select.click();
    await screen.getByRole('option', { name: 'Apple' }).click();

    await expect.element(select).toHaveTextContent('Apple');
  });
});
