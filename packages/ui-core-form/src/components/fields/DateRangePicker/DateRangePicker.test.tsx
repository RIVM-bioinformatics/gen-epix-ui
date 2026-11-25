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

import { DateRangePicker } from './DateRangePicker';

type DateRangeForm = {
  dates: [Date | null, Date | null];
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

describe('DateRangePicker', () => {
  it('renders empty values by default and clears both dates', async () => {
    const screen = await renderComponent(
      <DateRangePicker<DateRangeForm, 'dates'>
        dateFormat={DATE_FORMAT.DATE}
        label={'Date range'}
        name={'dates'}
      />,
    );

    await expect.element(screen.getByRole('group', { name: 'From' })).toBeVisible();
    await expect.element(screen.getByRole('group', { name: 'To' })).toBeVisible();
    await screen.getByTestId('DateRangePicker').hover();
    await screen.getByRole('button', { name: 'Clear date range' }).click();
    await expect.element(screen.getByRole('button', { exact: true, name: 'Choose date' }).first()).toBeVisible();
  });

  it('uses the opposite endpoint as a bound when explicit bounds are omitted', async () => {
    const screen = await renderComponent(
      <>
        <DateRangePicker<DateRangeForm, 'dates'>
          dateFormat={DATE_FORMAT.DATE}
          label={'Date range'}
          name={'dates'}
        />
        <button type={'button'}>
          {'Finish from date'}
        </button>
        <button type={'button'}>
          {'Finish to date'}
        </button>
      </>,
      { form: { defaultValues: { dates: [null, new Date(2024, 0, 20)] } } },
    );
    const fromDate = screen.getByRole('group', { name: 'From' });
    const toDate = screen.getByRole('group', { name: 'To' });

    await expect.element(screen.getByRole('group', { name: 'From' })).toBeVisible();
    await expect.element(screen.getByRole('group', { name: 'To' })).toBeVisible();
    await fromDate.getByRole('spinbutton', { name: 'Year' }).fill('2024');
    await fromDate.getByRole('spinbutton', { name: 'Month' }).fill('01');
    await fromDate.getByRole('spinbutton', { name: 'Day' }).fill('15');
    await screen.getByRole('button', { name: 'Finish from date' }).click();
    await toDate.getByRole('spinbutton', { name: 'Day' }).fill('25');
    await screen.getByRole('button', { name: 'Finish to date' }).click();
  });

  it('normalizes and reports a selected date range', async () => {
    const onChange = vi.fn((value: [Date | null, Date | null]) => value);
    const screen = await renderComponent(
      <DateRangePicker<DateRangeForm, 'dates'>
        dateFormat={DATE_FORMAT.DATE}
        label={'Date range'}
        name={'dates'}
        onChange={onChange}
      />,
      {
        form: {
          defaultValues: {
            dates: [
              new Date(2024, 0, 10, 12, 34, 56, 789),
              new Date(2024, 0, 20, 12, 34, 56, 789),
            ],
          },
        },
      },
    );
    const fromDate = screen.getByRole('group', { name: 'From' });

    await fromDate.getByRole('spinbutton', { name: 'Day' }).fill('15');

    expect(onChange).toHaveBeenCalledOnce();
    const [startDate, endDate] = onChange.mock.lastCall?.[0] ?? [null, null];
    expect(startDate).toBeInstanceOf(Date);
    expect(startDate?.getDate()).toBe(15);
    expect(startDate?.getHours()).toBe(0);
    expect(startDate?.getMilliseconds()).toBe(0);
    expect(endDate).toBeInstanceOf(Date);
    expect(endDate?.getHours()).toBe(23);
    expect(endDate?.getMilliseconds()).toBe(999);
  });

  it('clamps both endpoints to explicit minimum and maximum dates on blur', async () => {
    const onChange = vi.fn((value: [Date | null, Date | null]) => value);
    const screen = await renderComponent(
      <>
        <DateRangePicker<DateRangeForm, 'dates'>
          dateFormat={DATE_FORMAT.DATE}
          label={'Date range'}
          maxDate={new Date(2024, 0, 25)}
          minDate={new Date(2024, 0, 10)}
          name={'dates'}
          onChange={onChange}
        />
        <button type={'button'}>
          {'Finish from date'}
        </button>
        <button type={'button'}>
          {'Finish to date'}
        </button>
      </>,
      { form: { defaultValues: { dates: [new Date(2024, 0, 15), new Date(2024, 0, 20)] } } },
    );
    const fromDate = screen.getByRole('group', { name: 'From' });
    const toDate = screen.getByRole('group', { name: 'To' });

    await fromDate.getByRole('spinbutton', { name: 'Day' }).fill('05');
    await screen.getByRole('button', { name: 'Finish from date' }).click();
    expect(onChange.mock.lastCall?.[0][0]?.getDate()).toBe(10);

    await toDate.getByRole('spinbutton', { name: 'Day' }).fill('28');
    await screen.getByRole('button', { name: 'Finish to date' }).click();
    expect(onChange.mock.lastCall?.[0][1]?.getDate()).toBe(25);
  });

  it('swaps reversed endpoints when either field loses focus', async () => {
    const onChange = vi.fn((value: [Date | null, Date | null]) => value);
    const screen = await renderComponent(
      <>
        <DateRangePicker<DateRangeForm, 'dates'>
          dateFormat={DATE_FORMAT.DATE}
          label={'Date range'}
          name={'dates'}
          onChange={onChange}
        />
        <button type={'button'}>
          {'Finish from date'}
        </button>
        <button type={'button'}>
          {'Finish to date'}
        </button>
      </>,
      { form: { defaultValues: { dates: [new Date(2024, 0, 15), new Date(2024, 0, 20)] } } },
    );
    const fromDate = screen.getByRole('group', { name: 'From' });
    const toDate = screen.getByRole('group', { name: 'To' });

    await fromDate.getByRole('spinbutton', { name: 'Day' }).fill('25');
    await screen.getByRole('button', { name: 'Finish from date' }).click();
    expect(onChange.mock.lastCall?.[0].map(value => value?.getDate())).toEqual([20, 25]);

    await toDate.getByRole('spinbutton', { name: 'Day' }).fill('10');
    await screen.getByRole('button', { name: 'Finish to date' }).click();
    expect(onChange.mock.lastCall?.[0].map(value => value?.getDate())).toEqual([10, 20]);
  });

  it('clears invalid empty endpoints when they lose focus', async () => {
    const onChange = vi.fn((value: [Date | null, Date | null]) => value);
    const screen = await renderComponent(
      <>
        <DateRangePicker<DateRangeForm, 'dates'>
          dateFormat={DATE_FORMAT.DATE}
          label={'Date range'}
          name={'dates'}
          onChange={onChange}
        />
        <button type={'button'}>
          {'Finish from date'}
        </button>
        <button type={'button'}>
          {'Finish to date'}
        </button>
      </>,
      { form: { defaultValues: { dates: [null, null] } } },
    );
    const fromDate = screen.getByRole('group', { name: 'From' });
    const toDate = screen.getByRole('group', { name: 'To' });

    await fromDate.getByRole('spinbutton', { name: 'Year' }).click();
    await screen.getByRole('button', { name: 'Finish from date' }).click();
    await toDate.getByRole('spinbutton', { name: 'Year' }).click();
    await screen.getByRole('button', { name: 'Finish to date' }).click();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('clamps a starting endpoint above maxDate when it loses focus', async () => {
    const onChange = vi.fn((value: [Date | null, Date | null]) => value);
    const screen = await renderComponent(
      <>
        <DateRangePicker<DateRangeForm, 'dates'>
          dateFormat={DATE_FORMAT.DATE}
          label={'Date range'}
          maxDate={new Date(2024, 0, 25)}
          name={'dates'}
          onChange={onChange}
        />
        <button type={'button'}>
          {'Finish from date'}
        </button>
      </>,
      { form: { defaultValues: { dates: [new Date(2024, 0, 30), null] } } },
    );

    await screen.getByRole('group', { name: 'From' }).getByRole('spinbutton', { name: 'Year' }).click();
    await screen.getByRole('button', { name: 'Finish from date' }).click();
    expect(onChange.mock.lastCall?.[0].map(value => value?.getDate())).toEqual([25, 25]);
  });

  it('clamps an ending endpoint below minDate when it loses focus', async () => {
    const onChange = vi.fn((value: [Date | null, Date | null]) => value);
    const screen = await renderComponent(
      <>
        <DateRangePicker<DateRangeForm, 'dates'>
          dateFormat={DATE_FORMAT.DATE}
          label={'Date range'}
          minDate={new Date(2024, 0, 10)}
          name={'dates'}
          onChange={onChange}
        />
        <button type={'button'}>
          {'Finish to date'}
        </button>
      </>,
      { form: { defaultValues: { dates: [null, new Date(2024, 0, 5)] } } },
    );

    await screen.getByRole('group', { name: 'To' }).getByRole('spinbutton', { name: 'Year' }).click();
    await screen.getByRole('button', { name: 'Finish to date' }).click();
    expect(onChange.mock.lastCall?.[0].map(value => value?.getDate())).toEqual([10, 10]);
  });

  it.each([
    DATE_FORMAT.DATE,
    DATE_FORMAT.DATE_TIME,
    DATE_FORMAT.YEAR,
    DATE_FORMAT.YEAR_MONTH,
  ])('supports the %s format', async (dateFormat) => {
    const onChange = vi.fn((value: [Date | null, Date | null]) => value);
    const screen = await renderComponent(
      <DateRangePicker<DateRangeForm, 'dates'>
        dateFormat={dateFormat}
        label={'Date range'}
        name={'dates'}
        onChange={onChange}
      />,
      { form: { defaultValues: { dates: [null, null] } } },
    );
    const fromDate = screen.getByRole('group', { name: 'From' });
    const toDate = screen.getByRole('group', { name: 'To' });
    const fillDate = async (dateField: typeof fromDate) => {
      await dateField.getByRole('spinbutton', { name: 'Year' }).fill('2024');
      if (dateFormat !== DATE_FORMAT.YEAR) {
        await dateField.getByRole('spinbutton', { name: 'Month' }).fill('02');
      }
      if (dateFormat === DATE_FORMAT.DATE || dateFormat === DATE_FORMAT.DATE_TIME) {
        await dateField.getByRole('spinbutton', { name: 'Day' }).fill('10');
      }
    };

    await expect.element(screen.getByTestId('DateRangePicker')).toBeVisible();
    await fillDate(fromDate);
    expect(onChange.mock.lastCall?.[0][0]).toBeInstanceOf(Date);
    expect(onChange.mock.lastCall?.[0][1]).toBeNull();
    await fillDate(toDate);
    expect(onChange.mock.lastCall?.[0][1]).toBeInstanceOf(Date);
    await screen.getByTestId('DateRangePicker').hover();
    await screen.getByRole('button', { name: 'Clear date range' }).click();
    await fillDate(toDate);
    expect(onChange.mock.lastCall?.[0][0]).toBeNull();
    expect(onChange.mock.lastCall?.[0][1]).toBeInstanceOf(Date);
  });

  it('reports an unsupported runtime format through an error boundary', async () => {
    const screen = await renderComponent(
      <DateRangePicker<DateRangeForm, 'dates'>
        dateFormat={DATE_FORMAT.YEAR_WEEK as never}
        label={'Date range'}
        name={'dates'}
      />,
      {
        form: { defaultValues: { dates: [null, null] } },
        wrapper: RenderErrorBoundary,
      },
    );

    await expect.element(screen.getByRole('alert')).toHaveTextContent(`Unsupported date format: ${DATE_FORMAT.YEAR_WEEK}`);
  });

  it('disables both date fields while loading and shows form errors', async () => {
    const screen = await renderComponent(
      <DateRangePicker<DateRangeForm, 'dates'>
        dateFormat={DATE_FORMAT.DATE}
        disabled
        infoMessage={'More information'}
        label={'Date range'}
        loading
        name={'dates'}
        required
        warningMessage={'Review the range'}
      />,
      {
        form: {
          defaultValues: { dates: [null, null] },
          errors: { dates: { message: 'Invalid range', type: 'manual' } },
        },
      },
    );

    await expect.element(screen.getByRole('group', { name: 'From' }).getByRole('spinbutton', { name: 'Year' })).toBeDisabled();
    await expect.element(screen.getByRole('group', { name: 'To' }).getByRole('spinbutton', { name: 'Year' })).toBeDisabled();
    await expect.element(screen.getByRole('progressbar')).toBeVisible();
    await expect.element(screen.getByRole('alert')).toHaveTextContent('Invalid range');
  });
});
