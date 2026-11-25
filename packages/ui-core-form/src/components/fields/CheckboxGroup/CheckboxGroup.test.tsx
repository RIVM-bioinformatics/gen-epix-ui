import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { renderComponent } from '../../../test/lib';

import { CheckboxGroup } from './CheckboxGroup';

type CheckboxForm = {
  fruits: Array<number | string> | null;
};

describe('CheckboxGroup', () => {
  it('removes duplicate selections and reports subsequent selections', async () => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <CheckboxGroup<CheckboxForm, 'fruits'>
        label={'Fruits'}
        name={'fruits'}
        onChange={onChange}
        options={[
          { label: 'Apple', value: 'apple' },
          { label: 'Pear', value: 42 },
        ]}
        required
        row
      />,
      { form: { defaultValues: { fruits: ['apple', 'apple'] } } },
    );
    const appleCheckbox = screen.getByRole('checkbox', { name: 'Apple' });

    await expect.element(appleCheckbox).toBeChecked();
    await appleCheckbox.click();
    expect(onChange).toHaveBeenLastCalledWith([]);
    await expect.element(appleCheckbox).not.toBeChecked();

    await appleCheckbox.click();
    expect(onChange).toHaveBeenLastCalledWith(['apple']);
    await expect.element(appleCheckbox).toBeChecked();
  });

  it('handles a missing initial value and disabled options without a callback', async () => {
    const screen = await renderComponent(
      <CheckboxGroup<CheckboxForm, 'fruits'>
        label={'Fruits'}
        name={'fruits'}
        options={[
          { disabled: true, label: 'Disabled fruit', value: 'disabled' },
          { label: 'Available fruit', value: 'available' },
        ]}
      />,
    );
    const disabledCheckbox = screen.getByRole('checkbox', { name: 'Disabled fruit' });
    const availableCheckbox = screen.getByRole('checkbox', { name: 'Available fruit' });

    await expect.element(disabledCheckbox).toBeDisabled();
    await expect.element(disabledCheckbox).not.toBeChecked();
    await availableCheckbox.click();
    await expect.element(availableCheckbox).toBeChecked();
  });

  it('clears a populated selection from the reset button', async () => {
    const screen = await renderComponent(
      <CheckboxGroup<CheckboxForm, 'fruits'>
        label={'Fruits'}
        name={'fruits'}
        options={[{ label: 'Apple', value: 'apple' }]}
      />,
      { form: { defaultValues: { fruits: ['apple'] } } },
    );

    await screen.getByTestId('CheckboxGroup').hover();
    await screen.getByRole('button', { name: 'Clear checkbox selection' }).click();
    await expect.element(screen.getByRole('checkbox', { name: 'Apple' })).not.toBeChecked();
  });

  it('shows info and warning messages and renders an empty option list', async () => {
    const screen = await renderComponent(
      <CheckboxGroup<CheckboxForm, 'fruits'>
        infoMessage={'Choose any fruit'}
        label={'Fruits'}
        name={'fruits'}
        options={[]}
        warningMessage={'Review your selection'}
      />,
      { form: { defaultValues: { fruits: [] } } },
    );

    await expect.element(screen.getByRole('alert')).toHaveTextContent('Review your selection');
    await expect.element(screen.getByRole('group')).toBeVisible();
    await expect.element(screen.getByRole('checkbox')).not.toBeInTheDocument();
  });

  it('shows errors and hides reset for a disabled field', async () => {
    const disabledScreen = await renderComponent(
      <CheckboxGroup<CheckboxForm, 'fruits'>
        disabled
        label={'Disabled fruits'}
        name={'fruits'}
        options={[{ label: 'Apple', value: 'apple' }]}
        required
      />,
      {
        form: {
          defaultValues: { fruits: ['apple'] },
          errors: { fruits: { message: 'Invalid selection', type: 'manual' } },
        },
      },
    );

    await expect.element(disabledScreen.getByRole('alert')).toHaveTextContent('Invalid selection');
    await expect.element(disabledScreen.getByRole('button', { name: 'Clear checkbox selection' })).not.toBeInTheDocument();
    await expect.element(disabledScreen.getByRole('checkbox', { name: 'Apple' })).toBeDisabled();
  });

  it('shows a loading indicator and disables reset while loading', async () => {
    const loadingScreen = await renderComponent(
      <CheckboxGroup<CheckboxForm, 'fruits'>
        infoMessage={'More information'}
        label={'Loading fruits'}
        loading
        name={'fruits'}
        options={[{ label: 'Apple', value: 'apple' }]}
        warningMessage={'Review your selection'}
      />,
      { form: { defaultValues: { fruits: ['apple'] } } },
    );

    await expect.element(loadingScreen.getByRole('progressbar')).toBeVisible();
    await expect.element(loadingScreen.getByRole('alert')).toHaveTextContent('Review your selection');
    await expect.element(loadingScreen.getByRole('button', { name: 'Clear checkbox selection' })).toBeDisabled();
    await expect.element(loadingScreen.getByRole('checkbox', { name: 'Apple' })).not.toBeInTheDocument();
  });
});
