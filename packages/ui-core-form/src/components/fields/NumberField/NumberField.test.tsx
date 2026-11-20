import { useCallback } from 'react';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { useFormContext } from 'react-hook-form';

import { renderComponent } from '../../../test/lib';

import { NumberField } from './NumberField';

type NumberForm = {
  amount: null | number;
  other?: null | number;
};

const UpdateNumberForm = () => {
  const { reset, setValue } = useFormContext<NumberForm>();
  const onUpdateOther = useCallback(() => setValue('other', 1), [setValue]);
  const onResetNumbers = useCallback(() => reset({ amount: 9, other: 1 }), [reset]);

  return (
    <>
      <button
        onClick={onUpdateOther}
        type={'button'}
      >
        {'Update other'}
      </button>
      <button
        onClick={onResetNumbers}
        type={'button'}
      >
        {'Reset numbers'}
      </button>
    </>
  );
};

describe('NumberField', () => {
  it('renders the form default and commits localized input and reset changes', async () => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <>
        <NumberField<NumberForm, 'amount'>
          autocomplete={'off'}
          label={'Amount'}
          max={20}
          min={0}
          name={'amount'}
          onChange={onChange}
          placeholder={'Enter an amount'}
          required
          showSlider
          step={0.5}
          warningMessage={'Check the amount'}
        />
        <button type={'button'}>
          {'Finish edit'}
        </button>
      </>,
      { form: { defaultValues: { amount: 12.5 } } },
    );
    const input = screen.getByRole('textbox', { name: 'Amount' });
    const slider = screen.getByRole('slider', { name: 'Value' });

    await expect.element(input).toHaveValue('12,5');
    await expect.element(input).toHaveAttribute('placeholder', 'Enter an amount');
    await expect.element(input).toHaveAttribute('autocomplete', 'off');
    await expect.element(slider).toHaveAttribute('aria-valuenow', '12.5');
    await expect.element(screen.getByText('Check the amount')).toBeVisible();

    await input.click();
    await screen.getByRole('button', { name: 'Finish edit' }).click();
    expect(onChange).not.toHaveBeenCalled();

    await input.fill('14,5');
    await screen.getByRole('button', { name: 'Finish edit' }).click();
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenLastCalledWith(14.5);
    await expect.element(input).toHaveValue('14,5');
    await expect.element(slider).toHaveAttribute('aria-valuenow', '14.5');

    await screen.getByTestId('NumberField').hover();
    await screen.getByRole('button', { name: 'Clear text field' }).click();
    expect(onChange).toHaveBeenLastCalledWith(null);
    await expect.element(input).toHaveValue('');
  });

  it('commits slider changes on blur', async () => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <>
        <NumberField<NumberForm, 'amount'>
          label={'Amount'}
          max={10}
          min={0}
          name={'amount'}
          onChange={onChange}
          showSlider
          step={1}
        />
        <button type={'button'}>
          {'Finish slider'}
        </button>
      </>,
      { form: { defaultValues: { amount: 3 } } },
    );
    const slider = screen.getByRole('slider', { name: 'Value' });
    const sliderInput = screen.baseElement.querySelector<HTMLInputElement>('input[type="range"]');
    if (!sliderInput) {
      throw new Error('Slider input was not rendered');
    }

    sliderInput.focus();
    sliderInput.dispatchEvent(new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'ArrowRight',
    }));
    await expect.element(slider).toHaveAttribute('aria-valuenow', '4');
    await expect.element(screen.getByRole('textbox', { name: 'Amount' })).toHaveValue('4');
    await screen.getByRole('button', { name: 'Finish slider' }).click();

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenLastCalledWith(4);
  });

  it('shows zero and updates the form without an optional callback', async () => {
    const screen = await renderComponent(
      <>
        <NumberField<NumberForm, 'amount'>
          label={'Amount'}
          name={'amount'}
        />
        <button type={'button'}>
          {'Finish zero'}
        </button>
      </>,
      { form: { defaultValues: { amount: 0 } } },
    );
    const input = screen.getByRole('textbox', { name: 'Amount' });

    await expect.element(input).toHaveValue('0');
    await input.fill('1');
    await screen.getByRole('button', { name: 'Finish zero' }).click();
    await expect.element(input).toHaveValue('1');
  });

  it('clears invalid input on blur', async () => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <>
        <NumberField<NumberForm, 'amount'>
          label={'Amount'}
          name={'amount'}
          onChange={onChange}
        />
        <button type={'button'}>
          {'Finish invalid input'}
        </button>
      </>,
      { form: { defaultValues: { amount: 8 } } },
    );
    const input = screen.getByRole('textbox', { name: 'Amount' });

    await input.fill('not a number');
    await screen.getByRole('button', { name: 'Finish invalid input' }).click();

    expect(onChange).toHaveBeenLastCalledWith(null);
    await expect.element(input).toHaveValue('');
  });

  it('ignores unrelated form updates and synchronizes a form reset', async () => {
    const screen = await renderComponent(
      <>
        <NumberField<NumberForm, 'amount'>
          label={'Amount'}
          max={10}
          min={0}
          name={'amount'}
          required
          showSlider
          step={1}
        />
        <UpdateNumberForm />
      </>,
      { form: { defaultValues: { amount: 3, other: 0 } } },
    );
    const input = screen.getByRole('textbox', { name: 'Amount' });
    const slider = screen.getByRole('slider', { name: 'Value' });

    await screen.getByRole('button', { name: 'Update other' }).click();
    await expect.element(input).toHaveValue('3');
    await expect.element(slider).toHaveAttribute('aria-valuenow', '3');

    await screen.getByRole('button', { name: 'Reset numbers' }).click();
    await expect.element(input).toHaveValue('9');
    await expect.element(slider).toHaveAttribute('aria-valuenow', '9');
  });

  it.each([
    ['slider disabled by default', { max: 10, min: 0, step: 1 }],
    ['missing minimum', { max: 10, showSlider: true, step: 1 }],
    ['missing maximum', { min: 0, showSlider: true, step: 1 }],
    ['missing step', { max: 10, min: 0, showSlider: true }],
    ['equal bounds', { max: 5, min: 5, showSlider: true, step: 1 }],
    ['more than 250 steps', { max: 251, min: 0, showSlider: true, step: 1 }],
  ] as const)('does not render a slider when %s', async (_label, options) => {
    const screen = await renderComponent(
      <NumberField<NumberForm, 'amount'>
        label={'Amount'}
        name={'amount'}
        {...options}
      />,
      { form: { defaultValues: { amount: 5 } } },
    );

    expect(screen.baseElement.querySelector('[role="slider"]')).toBeNull();
    await expect.element(screen.getByRole('textbox', { name: 'Amount' })).toBeVisible();
  });

  it.each([
    ['below the range', -5, '0'],
    ['within the range', 5, '5'],
    ['above the range', 25, '20'],
    ['an invalid value', Number.NaN, '0'],
  ])('normalizes an initial slider value %s', async (_label, value, expected) => {
    const screen = await renderComponent(
      <NumberField<NumberForm, 'amount'>
        label={'Amount'}
        max={20}
        min={0}
        name={'amount'}
        showSlider
        step={1}
      />,
      { form: { defaultValues: { amount: value } } },
    );

    await expect.element(screen.getByRole('slider', { name: 'Value' })).toHaveAttribute('aria-valuenow', expected);
  });

  it('allows exactly 250 slider steps', async () => {
    const screen = await renderComponent(
      <NumberField<NumberForm, 'amount'>
        label={'Amount'}
        max={250}
        min={0}
        name={'amount'}
        showSlider
        step={1}
      />,
      { form: { defaultValues: { amount: 100 } } },
    );

    await expect.element(screen.getByRole('slider', { name: 'Value' })).toBeVisible();
  });

  it.each([
    ['disabled', { disabled: true }],
    ['loading', { loading: true }],
  ] as const)('disables the slider while %s', async (_label, options) => {
    const screen = await renderComponent(
      <>
        <NumberField<NumberForm, 'amount'>
          label={'Amount'}
          max={10}
          min={0}
          name={'amount'}
          showSlider
          step={1}
          {...options}
        />
        <button type={'button'}>
          {'Finish'}
        </button>
      </>,
      {
        form: {
          defaultValues: { amount: 5 },
          errors: { amount: { message: 'Invalid amount', type: 'manual' } },
        },
      },
    );
    const slider = screen.getByRole('slider', { name: 'Value' });
    const input = screen.getByRole('textbox', { name: 'Amount' });

    await expect.element(slider).toBeDisabled();
    await expect.element(input).toBeDisabled();
    await expect.element(screen.getByText('Invalid amount')).toBeVisible();
    expect(screen.baseElement.querySelector('[role="progressbar"]') !== null).toBe('loading' in options);
    await screen.getByTestId('NumberField').hover();
    expect(screen.baseElement.querySelector('button[aria-label="Clear text field"]')).toBeNull();
  });
});
