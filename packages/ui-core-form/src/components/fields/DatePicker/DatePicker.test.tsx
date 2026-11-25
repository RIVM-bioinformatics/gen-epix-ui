import { Component } from 'react';
import type {
  PropsWithChildren,
  ReactElement,
} from 'react';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { DATE_FORMAT } from '@gen-epix/ui-core/constants/date.constants';

import { renderComponent } from '../../../test/lib';

import { DatePicker } from './DatePicker';

type DateForm = {
  date: Date | null;
};

class RenderErrorBoundary extends Component<PropsWithChildren, { message?: string }> {
  public state: { message?: string } = {};

  public static getDerivedStateFromError(error: Error) {
    return { message: error.message };
  }

  public override render(): ReactElement {
    return this.state.message
      ? (
        <div role={'alert'}>
          {this.state.message}
        </div>
      )
      : (
        <>
          {this.props.children}
        </>
      );
  }
}

describe('DatePicker', () => {
  it('renders the default date format and clears a selected date', async () => {
    const screen = await renderComponent(
      <DatePicker<DateForm, 'date'>
        infoMessage={'Choose a date'}
        label={'Date'}
        name={'date'}
        required
      />,
      { form: { defaultValues: { date: new Date(2024, 0, 15) } } },
    );
    const dateField = screen.getByRole('group', { name: 'Date' });

    await expect.element(dateField.getByRole('spinbutton', { name: 'Year' })).toHaveValue(2024);
    await expect.element(dateField.getByRole('spinbutton', { name: 'Month' })).toHaveValue(1);
    await expect.element(dateField.getByRole('spinbutton', { name: 'Day' })).toHaveValue(15);
    await expect.element(screen.getByRole('alert')).toHaveTextContent('Choose a date');
    await screen.getByTestId('DatePicker').hover();
    await screen.getByRole('button', { name: 'Clear date field' }).click();
    await expect.element(screen.getByRole('button', { exact: true, name: 'Choose date' })).toBeVisible();
  });

  it('reports a selected date through the form and callback', async () => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <DatePicker<DateForm, 'date'>
        label={'Date'}
        name={'date'}
        onChange={onChange}
      />,
      { form: { defaultValues: { date: null } } },
    );
    const dateField = screen.getByRole('group', { name: 'Date' });

    await dateField.getByRole('spinbutton', { name: 'Year' }).fill('2024');
    await dateField.getByRole('spinbutton', { name: 'Month' }).fill('02');
    await dateField.getByRole('spinbutton', { name: 'Day' }).fill('10');

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange.mock.lastCall?.[0]).toBeInstanceOf(Date);
    await expect.element(dateField.getByRole('spinbutton', { name: 'Day' })).toHaveValue(10);
  });

  it('updates the form when no optional callback is supplied', async () => {
    const screen = await renderComponent(
      <DatePicker<DateForm, 'date'>
        label={'Date'}
        name={'date'}
      />,
      { form: { defaultValues: { date: null } } },
    );
    const dateField = screen.getByRole('group', { name: 'Date' });

    await dateField.getByRole('spinbutton', { name: 'Year' }).fill('2024');
    await dateField.getByRole('spinbutton', { name: 'Month' }).fill('02');
    await dateField.getByRole('spinbutton', { name: 'Day' }).fill('10');

    await expect.element(dateField.getByRole('spinbutton', { name: 'Day' })).toHaveValue(10);
  });

  it.each([
    DATE_FORMAT.DATE,
    DATE_FORMAT.DATE_TIME,
    DATE_FORMAT.YEAR,
    DATE_FORMAT.YEAR_MONTH,
  ])('supports the %s format', async (dateFormat) => {
    const screen = await renderComponent(
      <DatePicker<DateForm, 'date'>
        dateFormat={dateFormat}
        label={'Date'}
        name={'date'}
      />,
      { form: { defaultValues: { date: new Date(2024, 0, 15) } } },
    );

    await expect.element(screen.getByTestId('DatePicker')).toBeVisible();
  });

  it('reports an unsupported runtime format through an error boundary', async () => {
    const screen = await renderComponent(
      <DatePicker<DateForm, 'date'>
        dateFormat={DATE_FORMAT.YEAR_QUARTER as never}
        label={'Date'}
        name={'date'}
      />,
      {
        form: { defaultValues: { date: null } },
        wrapper: RenderErrorBoundary,
      },
    );

    await expect.element(screen.getByRole('alert')).toHaveTextContent(`Unsupported date format: ${DATE_FORMAT.YEAR_QUARTER}`);
  });

  it('shows errors and disables the field while loading', async () => {
    const screen = await renderComponent(
      <DatePicker<DateForm, 'date'>
        disabled
        infoMessage={'More information'}
        label={'Date'}
        loading
        name={'date'}
        required
        warningMessage={'Review the date'}
      />,
      {
        form: {
          defaultValues: { date: null },
          errors: { date: { message: 'Invalid date', type: 'manual' } },
        },
      },
    );

    await expect.element(screen.getByRole('group', { name: 'Date' }).getByRole('spinbutton', { name: 'Year' })).toBeDisabled();
    await expect.element(screen.getByRole('progressbar')).toBeVisible();
    await expect.element(screen.getByRole('alert')).toHaveTextContent('Invalid date');
    await expect.element(screen.getByRole('button', { name: 'Clear date field' })).not.toBeInTheDocument();
  });

  it('shows a warning when no form error exists', async () => {
    const screen = await renderComponent(
      <DatePicker<DateForm, 'date'>
        label={'Date'}
        name={'date'}
        warningMessage={'Review the date'}
      />,
      { form: { defaultValues: { date: null } } },
    );

    await expect.element(screen.getByRole('alert')).toHaveTextContent('Review the date');
  });
});
