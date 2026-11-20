import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { useFormContext } from 'react-hook-form';

import { renderComponent } from '../../../test/lib';

import { RadioGroup } from './RadioGroup';

type RadioForm = {
  choice: null | string;
};

const FocusRadioGroup = ({ children }: PropsWithChildren) => {
  const { setFocus } = useFormContext<RadioForm>();

  useEffect(() => {
    setFocus('choice');
  }, [setFocus]);

  return (
    <>
      {children}
    </>
  );
};

describe('RadioGroup', () => {
  it('renders the selected option and reports a changed value', async () => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <RadioGroup<RadioForm, 'choice'>
        infoMessage={'Choose one'}
        label={'Animal'}
        name={'choice'}
        onChange={onChange}
        options={[
          { label: 'Cat', value: 'cat' },
          { label: 'Dog', value: 'dog' },
        ]}
        required
        row
      />,
      { form: { defaultValues: { choice: 'cat' } } },
    );
    const radioGroup = screen.getByRole('radiogroup', { name: 'Animal' });
    const catOption = screen.getByRole('radio', { name: 'Cat' });
    const dogOption = screen.getByRole('radio', { name: 'Dog' });

    await expect.element(radioGroup).toBeVisible();
    await expect.element(catOption).toBeChecked();
    await expect.element(screen.getByText('Choose one')).toBeVisible();
    await dogOption.click();

    expect(onChange).toHaveBeenCalledExactlyOnceWith('dog');
    await expect.element(dogOption).toBeChecked();
    await expect.element(catOption).not.toBeChecked();
  });

  it('updates the form when no optional callback is supplied', async () => {
    const screen = await renderComponent(
      <RadioGroup<RadioForm, 'choice'>
        label={'Animal'}
        name={'choice'}
        options={[
          { label: 'Cat', value: 'cat' },
          { label: 'Dog', value: 'dog' },
        ]}
      />,
      { form: { defaultValues: { choice: null } } },
    );

    await screen.getByRole('radio', { name: 'Dog' }).click();
    await expect.element(screen.getByRole('radio', { name: 'Dog' })).toBeChecked();
  });

  it('disables options and displays required and error states', async () => {
    const screen = await renderComponent(
      <RadioGroup<RadioForm, 'choice'>
        disabled
        label={'Animal'}
        name={'choice'}
        options={[{ label: 'Cat', value: 'cat' }]}
        required
        warningMessage={'Select an animal'}
      />,
      {
        form: {
          defaultValues: { choice: null },
          errors: { choice: { message: 'An animal is required', type: 'manual' } },
        },
      },
    );

    await expect.element(screen.getByRole('radio', { name: 'Cat' })).toBeDisabled();
    await expect.element(screen.getByText('Animal *')).toBeVisible();
    await expect.element(screen.getByText('An animal is required')).toBeVisible();
  });

  it('supports empty options when the form requests focus', async () => {
    const screen = await renderComponent(
      <RadioGroup<RadioForm, 'choice'>
        label={'Animal'}
        name={'choice'}
        options={[]}
      />,
      {
        form: { defaultValues: { choice: null } },
        wrapper: FocusRadioGroup,
      },
    );

    await expect.element(screen.getByRole('radiogroup', { name: 'Animal' })).toHaveAttribute('role', 'radiogroup');
    expect(screen.baseElement.querySelectorAll('input[type="radio"]')).toHaveLength(0);
  });
});
