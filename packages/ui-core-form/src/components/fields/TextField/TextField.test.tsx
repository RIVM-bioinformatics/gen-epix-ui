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

import { TextField } from './TextField';

type TextForm = {
  description: null | string;
  notes: null | string;
};

const FocusTextField = ({ children }: PropsWithChildren): ReactElement => {
  const { setFocus } = useFormContext<TextForm>();

  useEffect(() => {
    setFocus('notes');
  }, [setFocus]);

  return (
    <>
      {children}
    </>
  );
};

describe('TextField', () => {
  it('renders input options and reports edits and reset changes', async () => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <TextField<TextForm, 'description'>
        autocomplete={'off'}
        label={'Description'}
        name={'description'}
        onChange={onChange}
        placeholder={'Enter a description'}
        required
        warningMessage={'Check the description'}
      />,
      { form: { defaultValues: { description: 'Initial text' } } },
    );
    const input = screen.getByRole('textbox', { name: 'Description' });

    await expect.element(input).toHaveValue('Initial text');
    await expect.element(input).toHaveAttribute('autocomplete', 'off');
    await expect.element(input).toHaveAttribute('placeholder', 'Enter a description');
    await expect.element(screen.getByText('Description *')).toBeVisible();
    await expect.element(screen.getByRole('alert')).toHaveTextContent('Check the description');

    await input.fill('Updated text');

    expect(onChange).toHaveBeenLastCalledWith('Updated text');
    await expect.element(input).toHaveValue('Updated text');

    await screen.getByTestId('TextField').hover();
    await screen.getByRole('button', { name: 'Clear text field' }).click();

    expect(onChange).toHaveBeenLastCalledWith('');
    await expect.element(input).toHaveValue('');
  });

  it('renders a multiline field with defaults and updates without an optional callback', async () => {
    const screen = await renderComponent(
      <TextField<TextForm, 'notes'>
        label={'Notes'}
        multiline
        name={'notes'}
        placeholder={'Write notes'}
        rows={4}
        type={'email'}
      />,
      {
        form: { defaultValues: { notes: null } },
        wrapper: FocusTextField,
      },
    );
    const input = screen.getByRole('textbox', { name: 'Notes' });

    await expect.element(input).toHaveValue('');
    await expect.element(input).toHaveAttribute('placeholder', 'Write notes');
    await expect.element(input).toHaveAttribute('rows', '4');
    await expect.element(input).toHaveAttribute('autocomplete', 'notes');
    await expect.element(input).toHaveFocus();

    await input.fill('A note');

    await expect.element(input).toHaveValue('A note');

    await screen.getByTestId('TextField').hover();
    await screen.getByRole('button', { name: 'Clear text field' }).click();

    await expect.element(input).toHaveValue('');
  });

  it('disables the input and clear control while loading or disabled', async () => {
    const props = {
      label: 'Description',
      name: 'description' as const,
    };
    const screen = await renderComponent(
      <TextField<TextForm, 'description'>
        {...props}
        loading
      />,
      { form: { defaultValues: { description: 'Initial text' } } },
    );
    const input = screen.getByRole('textbox', { name: 'Description' });

    await expect.element(input).toBeDisabled();
    await expect.element(screen.getByRole('progressbar')).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Clear text field' })).not.toBeInTheDocument();

    await screen.rerender(
      <TextField<TextForm, 'description'>
        {...props}
        disabled
        required
      />,
    );

    await expect.element(input).toBeDisabled();
    await expect.element(screen.getByRole('progressbar')).not.toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: 'Clear text field' })).not.toBeInTheDocument();
  });

  it('shows field errors instead of warning or info messages', async () => {
    const screen = await renderComponent(
      <TextField<TextForm, 'description'>
        infoMessage={'More information'}
        label={'Description'}
        name={'description'}
        warningMessage={'Check the description'}
      />,
      {
        form: {
          defaultValues: { description: '' },
          errors: { description: { message: 'A description is required', type: 'manual' } },
        },
      },
    );

    await expect.element(screen.getByRole('alert')).toHaveTextContent('A description is required');
    await expect.element(screen.getByRole('alert')).not.toHaveTextContent('Check the description');
    await expect.element(screen.getByRole('alert')).not.toHaveTextContent('More information');
  });
});
