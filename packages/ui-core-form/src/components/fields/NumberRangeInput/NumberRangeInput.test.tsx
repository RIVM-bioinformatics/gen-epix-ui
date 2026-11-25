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

import { NumberRangeInput } from './NumberRangeInput';

type RangeForm = {
  range: [null | number, null | number] | null;
};

const FocusRange = ({ children }: PropsWithChildren) => {
  const { setFocus } = useFormContext<RangeForm>();

  useEffect(() => {
    setFocus('range');
  }, [setFocus]);

  return (
    <>
      {children}
    </>
  );
};

describe('NumberRangeInput', () => {
  it('renders labeled endpoints and reports range changes and reset', async () => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <NumberRangeInput<RangeForm, 'range'>
        infoMessage={'Enter a range'}
        label={'Range'}
        max={10}
        min={0}
        name={'range'}
        onChange={onChange}
        required
      />,
      { form: { defaultValues: { range: [2, 8] } } },
    );
    const fromInput = screen.getByTestId('RangeSlider-from-input');
    const toInput = screen.getByTestId('RangeSlider-to-input');

    await expect.element(fromInput).toHaveValue('2');
    await expect.element(toInput).toHaveValue('8');
    await expect.element(fromInput).toHaveAttribute('name', 'range-from');
    await expect.element(toInput).toHaveAttribute('name', 'range-to');
    await expect.element(screen.getByText('Enter a range')).toBeVisible();

    await fromInput.fill('invalid');
    await expect.element(fromInput).toHaveValue('2');
    expect(onChange).not.toHaveBeenCalled();
    await fromInput.fill('');
    expect(onChange).toHaveBeenLastCalledWith([null, 8]);
    await fromInput.fill('4');
    expect(onChange).toHaveBeenLastCalledWith([4, 8]);
    await toInput.fill('9');
    expect(onChange).toHaveBeenLastCalledWith([4, 9]);
    await toInput.fill('');
    expect(onChange).toHaveBeenLastCalledWith([4, null]);
    await toInput.fill('invalid');
    await expect.element(toInput).toHaveValue('');

    await screen.getByTestId('RangeSlider').hover();
    await screen.getByRole('button', { name: 'Clear number range' }).click();
    expect(onChange).toHaveBeenLastCalledWith([null, null]);
    const changeCount = onChange.mock.calls.length;
    await screen.getByTestId('RangeSlider').hover();
    await screen.getByRole('button', { name: 'Clear number range' }).click();
    expect(onChange).toHaveBeenCalledTimes(changeCount);
    await expect.element(fromInput).toHaveValue('');
    await expect.element(toInput).toHaveValue('');
  });

  it('focuses the starting endpoint when the form requests focus', async () => {
    const screen = await renderComponent(
      <NumberRangeInput<RangeForm, 'range'>
        label={'Range'}
        max={10}
        min={0}
        name={'range'}
      />,
      {
        form: { defaultValues: { range: [2, 8] } },
        wrapper: FocusRange,
      },
    );

    await expect.element(screen.getByTestId('RangeSlider-from-input')).toHaveFocus();
  });

  it.each([
    ['left endpoint below minimum', [-1, 8], 'from', [0, 8]],
    ['left endpoint above maximum', [11, 8], 'from', [10, 10]],
    ['left endpoint past right endpoint', [9, 8], 'from', [8, 9]],
    ['right endpoint above maximum', [2, 11], 'to', [2, 10]],
    ['right endpoint below minimum', [2, -1], 'to', [0, 0]],
    ['right endpoint before left endpoint', [2, 1], 'to', [1, 2]],
  ] as const)('normalizes the range when %s loses focus', async (_label, range, endpoint, expected) => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <>
        <NumberRangeInput<RangeForm, 'range'>
          label={'Range'}
          max={10}
          min={0}
          name={'range'}
          onChange={onChange}
        />
        <button type={'button'}>
          {'Finish endpoint'}
        </button>
      </>,
      { form: { defaultValues: { range } } },
    );
    const endpointInput = screen.getByTestId(`RangeSlider-${endpoint}-input`);

    await endpointInput.click();
    await screen.getByRole('button', { name: 'Finish endpoint' }).click();

    expect(onChange).toHaveBeenLastCalledWith(expected);
    await expect.element(screen.getByTestId('RangeSlider-from-input')).toHaveValue(String(expected[0]));
    await expect.element(screen.getByTestId('RangeSlider-to-input')).toHaveValue(String(expected[1]));
  });

  it.each<[string, RangeForm['range']]>([
    ['empty endpoints', [null, null]],
    ['an empty left endpoint', [null, 8]],
    ['an empty right endpoint', [2, null]],
  ])('preserves %s on blur', async (_label, range) => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <>
        <NumberRangeInput<RangeForm, 'range'>
          label={'Range'}
          max={10}
          min={0}
          name={'range'}
          onChange={onChange}
        />
        <button type={'button'}>
          {'Finish from'}
        </button>
        <button type={'button'}>
          {'Finish to'}
        </button>
      </>,
      { form: { defaultValues: { range } } },
    );

    await screen.getByTestId('RangeSlider-from-input').click();
    await screen.getByRole('button', { name: 'Finish from' }).click();
    await screen.getByTestId('RangeSlider-to-input').click();
    await screen.getByRole('button', { name: 'Finish to' }).click();

    expect(onChange).not.toHaveBeenCalled();
  });

  it.each<[string, RangeForm['range'], [null | number, null | number]]>([
    ['a non-finite left endpoint', [Number.NaN, 8], [null, 8]],
    ['a non-finite right endpoint', [2, Number.NaN], [2, null]],
    ['a missing form value', null, [null, null]],
  ])('normalizes %s on blur', async (_label, range, expected) => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <>
        <NumberRangeInput<RangeForm, 'range'>
          label={'Range'}
          max={Number.POSITIVE_INFINITY}
          min={0}
          name={'range'}
          onChange={onChange}
        />
        <button type={'button'}>
          {'Finish from'}
        </button>
        <button type={'button'}>
          {'Finish to'}
        </button>
      </>,
      { form: { defaultValues: { range } } },
    );

    await screen.getByTestId('RangeSlider-from-input').click();
    await screen.getByRole('button', { name: 'Finish from' }).click();
    await screen.getByTestId('RangeSlider-to-input').click();
    await screen.getByRole('button', { name: 'Finish to' }).click();

    expect(onChange).toHaveBeenLastCalledWith(expected);
  });

  it('updates the range from slider input and without an optional callback', async () => {
    const screen = await renderComponent(
      <>
        <NumberRangeInput<RangeForm, 'range'>
          label={'Range'}
          max={10}
          min={0}
          name={'range'}
        />
        <button type={'button'}>
          {'Finish slider'}
        </button>
      </>,
      { form: { defaultValues: { range: [2, 8] } } },
    );
    const sliderInputs = screen.baseElement.querySelectorAll<HTMLInputElement>('input[type="range"]');
    const firstSliderInput = sliderInputs[0];
    if (!firstSliderInput) {
      throw new Error('Range slider inputs were not rendered');
    }

    firstSliderInput.focus();
    firstSliderInput.dispatchEvent(new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'ArrowRight',
    }));
    await expect.element(screen.getByTestId('RangeSlider-from-input')).toHaveValue('3');
    await screen.getByRole('button', { name: 'Finish slider' }).click();
    await expect.element(screen.getByTestId('RangeSlider-from-input')).toHaveValue('3');
  });

  it('omits the slider for non-finite bounds', async () => {
    const screen = await renderComponent(
      <NumberRangeInput<RangeForm, 'range'>
        label={'Range'}
        max={Number.POSITIVE_INFINITY}
        min={0}
        name={'range'}
      />,
      { form: { defaultValues: { range: [2, 8] } } },
    );

    expect(screen.baseElement.querySelector('input[type="range"]')).toBeNull();
    await expect.element(screen.getByTestId('RangeSlider-from-input')).toBeVisible();
    await expect.element(screen.getByTestId('RangeSlider-to-input')).toBeVisible();
  });

  it('disables the endpoints and slider and hides reset while disabled', async () => {
    const screen = await renderComponent(
      <NumberRangeInput<RangeForm, 'range'>
        disabled
        label={'Range'}
        max={10}
        min={0}
        name={'range'}
      />,
      { form: { defaultValues: { range: [2, 8] } } },
    );

    await expect.element(screen.getByTestId('RangeSlider-from-input')).toBeDisabled();
    await expect.element(screen.getByTestId('RangeSlider-to-input')).toBeDisabled();
    await expect.element(screen.getByRole('slider', { name: 'Value' }).first()).toBeDisabled();
    expect(screen.baseElement.querySelector('button[aria-label="Clear number range"]')).toBeNull();
  });

  it('hides range controls and reset while loading and shows form messages', async () => {
    const screen = await renderComponent(
      <NumberRangeInput<RangeForm, 'range'>
        infoMessage={'Waiting for upload'}
        label={'Range'}
        loading
        max={10}
        min={0}
        name={'range'}
        warningMessage={'Check the range'}
      />,
      {
        form: {
          defaultValues: { range: [2, 8] },
          errors: { range: { message: 'Invalid range', type: 'manual' } },
        },
      },
    );

    expect(screen.baseElement.querySelector('[data-testid="RangeSlider-from-input"]')).toBeNull();
    expect(screen.baseElement.querySelector('[data-testid="RangeSlider-to-input"]')).toBeNull();
    expect(screen.baseElement.querySelector('button[aria-label="Clear number range"]')).toBeNull();
    await expect.element(screen.getByRole('progressbar')).toBeVisible();
    await expect.element(screen.getByText('Invalid range')).toBeVisible();
  });
});
