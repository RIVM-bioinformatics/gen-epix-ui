import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { renderComponent } from '../../../test/lib';

import { DatePickerInputAdornment } from './DatePickerInputAdornment';

describe('DatePickerInputAdornment', () => {
  it('renders the reset button and forwards clicks to the current callback', async () => {
    const onResetButtonClick = vi.fn();
    const screen = await renderComponent(
      <DatePickerInputAdornment
        disabled={false}
        loading={false}
        onResetButtonClick={onResetButtonClick}
        position={'end'}
      >
        {'Calendar'}
      </DatePickerInputAdornment>,
    );

    await expect.element(screen.getByText('Calendar')).toBeVisible();
    await screen.getByRole('button', { name: 'Clear date field' }).click();

    expect(onResetButtonClick).toHaveBeenCalledOnce();
  });

  it.each([
    { disabled: true, loading: false },
    { disabled: false, loading: true },
  ])('omits the reset button when disabled or loading', async ({ disabled, loading }) => {
    const screen = await renderComponent(
      <DatePickerInputAdornment
        disabled={disabled}
        loading={loading}
        onResetButtonClick={vi.fn()}
        position={'end'}
      >
        {'Calendar'}
      </DatePickerInputAdornment>,
    );

    await expect.element(screen.getByText('Calendar')).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Clear date field' })).not.toBeInTheDocument();
  });
});
