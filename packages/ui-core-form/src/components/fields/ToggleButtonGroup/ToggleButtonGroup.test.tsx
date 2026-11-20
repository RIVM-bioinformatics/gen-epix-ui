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

import { ToggleButtonGroup } from './ToggleButtonGroup';

type ToggleForm = {
  choice: boolean | null | number | string;
};

const FocusToggleGroup = ({ children }: PropsWithChildren): ReactElement => {
  const { setFocus } = useFormContext<ToggleForm>();

  useEffect(() => {
    setFocus('choice');
  }, [setFocus]);

  return (
    <>
      {children}
    </>
  );
};

describe('ToggleButtonGroup', () => {
  it('selects typed values and applies the vertical orientation when row is false', async () => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <ToggleButtonGroup<ToggleForm, 'choice'>
        name={'choice'}
        onChange={onChange}
        options={[
          { label: 'Numeric one', value: 1 },
          { label: 'Text one', value: '1' },
          { label: 'False choice', value: false },
        ]}
        row={false}
      />,
      { form: { defaultValues: { choice: 1 } } },
    );
    const group = screen.getByRole('group');
    const numericChoice = screen.getByRole('button', { name: 'Numeric one' });
    const falseChoice = screen.getByRole('button', { name: 'False choice' });

    await expect.element(group).toHaveClass('MuiToggleButtonGroup-vertical');
    await expect.element(numericChoice).toHaveAttribute('aria-pressed', 'true');
    await screen.getByRole('button', { name: 'False choice' }).click();

    expect(onChange).toHaveBeenLastCalledWith(false);
    await expect.element(falseChoice).toHaveAttribute('aria-pressed', 'true');
    await expect.element(numericChoice).toHaveAttribute('aria-pressed', 'false');
  });

  it('does not clear a required selection', async () => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <ToggleButtonGroup<ToggleForm, 'choice'>
        name={'choice'}
        onChange={onChange}
        options={[
          { label: 'First choice', value: 'first' },
          { label: 'Second choice', value: 'second' },
        ]}
        required
      />,
      { form: { defaultValues: { choice: null } } },
    );
    const firstChoice = screen.getByRole('button', { name: 'First choice' });

    await firstChoice.click();
    expect(onChange).toHaveBeenCalledExactlyOnceWith('first');
    await expect.element(firstChoice).toHaveAttribute('aria-pressed', 'true');

    await firstChoice.click();

    expect(onChange).toHaveBeenCalledExactlyOnceWith('first');
    await expect.element(firstChoice).toHaveAttribute('aria-pressed', 'true');
  });

  it('focuses the first button and supports selecting and clearing without an optional callback', async () => {
    const screen = await renderComponent(
      <ToggleButtonGroup<ToggleForm, 'choice'>
        name={'choice'}
        options={[{ label: 'First choice', value: 'first' }]}
      />,
      {
        form: { defaultValues: { choice: null } },
        wrapper: FocusToggleGroup,
      },
    );
    const firstChoice = screen.getByRole('button', { name: 'First choice' });

    await expect.element(firstChoice).toHaveFocus();
    await firstChoice.click();
    await expect.element(firstChoice).toHaveAttribute('aria-pressed', 'true');
    await firstChoice.click();
    await expect.element(firstChoice).toHaveAttribute('aria-pressed', 'false');
  });

  it('defaults to horizontal orientation and disables options while showing warnings', async () => {
    const screen = await renderComponent(
      <ToggleButtonGroup<ToggleForm, 'choice'>
        disabled
        name={'choice'}
        options={[{ label: 'Disabled choice', value: 'disabled' }]}
        warningMessage={'Check the choice'}
      />,
      { form: { defaultValues: { choice: null } } },
    );

    await expect.element(screen.getByRole('group')).toHaveClass('MuiToggleButtonGroup-horizontal');
    await expect.element(screen.getByRole('button', { name: 'Disabled choice' })).toBeDisabled();
    await expect.element(screen.getByRole('alert')).toHaveTextContent('Check the choice');
  });

  it('shows field errors instead of warning or info messages', async () => {
    const screen = await renderComponent(
      <ToggleButtonGroup<ToggleForm, 'choice'>
        infoMessage={'More information'}
        name={'choice'}
        options={[{ label: 'First choice', value: 'first' }]}
        warningMessage={'Check the choice'}
      />,
      {
        form: {
          defaultValues: { choice: null },
          errors: { choice: { message: 'Choose a value', type: 'manual' } },
        },
      },
    );

    await expect.element(screen.getByRole('alert')).toHaveTextContent('Choose a value');
    await expect.element(screen.getByRole('alert')).not.toHaveTextContent('Check the choice');
    await expect.element(screen.getByRole('alert')).not.toHaveTextContent('More information');
  });
});
