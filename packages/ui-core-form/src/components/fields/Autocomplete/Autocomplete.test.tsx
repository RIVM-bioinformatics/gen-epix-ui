import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { renderComponent } from '../../../test/lib';

import { Autocomplete } from './Autocomplete';

type MultipleValueForm = {
  fruits: string[];
};

type SingleValueForm = {
  fruit: null | string;
};

describe('Autocomplete', () => {
  it('sorts and filters options safely, then reports a single selection', async () => {
    const onChange = vi.fn();
    const options = [
      { label: 'Zulu', value: 'zulu' },
      { value: 'unlabeled' },
      { label: 'Apple', value: 'apple' },
    ];
    const screen = await renderComponent(
      <Autocomplete<SingleValueForm, 'fruit', false>
        label={'Fruit'}
        name={'fruit'}
        onChange={onChange}
        options={options}
        required
        shouldSortOptions
      />,
      { form: { defaultValues: { fruit: null } } },
    );
    const input = screen.getByRole('combobox', { name: 'Fruit' });

    await input.click();
    await expect.element(screen.getByRole('listbox')).toHaveTextContent('AppleZulu');
    await input.fill('app');
    await expect.element(screen.getByRole('option', { name: 'Apple' })).toBeVisible();
    await screen.getByRole('option', { name: 'Apple' }).click();

    expect(onChange).toHaveBeenCalledWith('apple');
    await expect.element(input).toHaveValue('Apple');
    expect(options.map(option => option.value)).toEqual(['zulu', 'unlabeled', 'apple']);
  });

  it('selects and deselects all enabled values while preserving disabled selections', async () => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <Autocomplete<MultipleValueForm, 'fruits', true>
        groupValues
        label={'Fruits'}
        multiple
        name={'fruits'}
        onChange={onChange}
        options={[
          { groupByValue: 'Fresh', label: 'Apple', value: 'apple' },
          { groupByValue: 'Fresh', label: 'Banana', value: 'banana' },
          { disabled: true, groupByValue: 'Other', label: 'Disabled fruit', value: 'disabled' },
        ]}
      />,
      { form: { defaultValues: { fruits: ['apple', 'disabled'] } } },
    );
    const input = screen.getByRole('combobox', { name: 'Fruits' });

    await input.click();
    await expect.element(screen.getByText('Select all')).toBeVisible();
    await expect.element(screen.getByText('Fresh')).toBeVisible();
    await expect.element(screen.getByRole('option', { name: 'Disabled fruit' })).toHaveAttribute('aria-disabled', 'true');

    await screen.getByText('Select all').click();
    expect(onChange).toHaveBeenLastCalledWith(['apple', 'disabled', 'banana']);
    await screen.getByText('Select all').click();
    expect(onChange).toHaveBeenLastCalledWith(['disabled']);
  });

  it('shows loading and warning states and honors the filled variant', async () => {
    const screen = await renderComponent(
      <Autocomplete<SingleValueForm, 'fruit', false>
        label={'Fruit'}
        loading
        name={'fruit'}
        options={[{ label: 'Apple', value: 'apple' }]}
        required
        textFieldVariant={'filled'}
        warningMessage={'Check the fruit'}
      />,
      { form: { defaultValues: { fruit: 'apple' } } },
    );
    const input = screen.getByRole('combobox', { name: 'Fruit' });

    await expect.element(input).toBeDisabled();
    await expect.element(input).toHaveValue('Loading...');
    await expect.element(screen.getByRole('progressbar')).toBeVisible();
    await expect.element(screen.getByRole('alert')).toHaveTextContent('Check the fruit');
    expect(screen.container.querySelector('input')?.parentElement?.className).toContain('MuiFilledInput-root');
  });

  it('shows form errors instead of warnings and keeps disabled required fields optional', async () => {
    const screen = await renderComponent(
      <Autocomplete<SingleValueForm, 'fruit', false>
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
          defaultValues: { fruit: null },
          errors: { fruit: { message: 'Choose a valid fruit', type: 'manual' } },
        },
      },
    );
    const input = screen.getByRole('combobox', { name: 'Fruit' });

    await expect.element(input).toBeDisabled();
    await expect.element(input).not.toHaveAttribute('required');
    await expect.element(screen.getByRole('alert')).toHaveTextContent('Choose a valid fruit');
  });

  it('allows multiple values without the select-all menu', async () => {
    const screen = await renderComponent(
      <Autocomplete<MultipleValueForm, 'fruits', true>
        hideSelectAll
        label={'Fruits'}
        multiple
        name={'fruits'}
        options={[{ label: 'Apple', value: 'apple' }]}
      />,
      { form: { defaultValues: { fruits: [] } } },
    );
    const input = screen.getByRole('combobox', { name: 'Fruits' });

    await input.click();
    await input.fill('app');
    await expect.element(screen.getByRole('option', { name: 'Apple' })).toBeVisible();
    await expect.element(screen.getByText('Select all')).not.toBeInTheDocument();
    await screen.getByRole('option', { name: 'Apple' }).click();
    await expect.element(screen.getByTestId('Autocomplete').getByText('Apple', { exact: true })).toBeVisible();
  });

  it('renders a non-array field value as one selected chip in multiple mode', async () => {
    const screen = await renderComponent(
      <Autocomplete<SingleValueForm, 'fruit', true>
        label={'Fruit'}
        multiple
        name={'fruit'}
        options={[{ label: 'Apple', value: 'apple' }]}
      />,
      { form: { defaultValues: { fruit: 'apple' } } },
    );

    await expect.element(screen.getByTestId('Autocomplete').getByText('Apple', { exact: true })).toBeVisible();
  });
});
