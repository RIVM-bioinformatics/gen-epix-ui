import type { ReactElement } from 'react';
import { useEffect } from 'react';
import {
  FormProvider,
  useForm,
} from 'react-hook-form';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { renderComponent } from '../../../../test/lib';
import { DASHBOARD_ARRANGEMENT_ORIENTATION } from '../../../../models/dashboard.models';
import type { DashboardArrangement } from '../../../../models/dashboard.models';

import type { ArrangementEditorProps } from './ArrangementEditor';
import { ArrangementEditor } from './ArrangementEditor';

type ArrangementEditorHarnessProps = {
  readonly formError?: string;
  readonly initialValue: null | string;
} & Omit<ArrangementEditorProps<ArrangementForm, 'layout'>, 'name'>;

type ArrangementForm = {
  layout: null | string;
};

const ArrangementEditorHarness = ({
  formError,
  initialValue,
  ...props
}: ArrangementEditorHarnessProps): ReactElement => {
  const formMethods = useForm<ArrangementForm>({
    defaultValues: { layout: initialValue },
  });
  const { setError } = formMethods;

  useEffect(() => {
    if (formError) {
      setError('layout', { message: formError });
    }
  }, [formError, setError]);

  return (
    <FormProvider {...formMethods}>
      <ArrangementEditor<ArrangementForm, 'layout'>
        {...props}
        name={'layout'}
      />
    </FormProvider>
  );
};

const horizontalArrangement: DashboardArrangement = {
  cells: [
    { name: 'Left', size: 1 },
    { name: 'Right', size: 2 },
  ],
  orientation: DASHBOARD_ARRANGEMENT_ORIENTATION.HORIZONTAL,
  size: 1,
};

const nestedArrangement: DashboardArrangement = {
  cells: [
    { name: 'Top', size: 1 },
    {
      cells: [
        { name: 'Bottom left', size: 1 },
        { name: 'Bottom right', size: 1 },
      ],
      orientation: DASHBOARD_ARRANGEMENT_ORIENTATION.HORIZONTAL,
      size: 1,
    },
  ],
  orientation: DASHBOARD_ARRANGEMENT_ORIENTATION.VERTICAL,
  size: 1,
};

const options = {
  horizontal: horizontalArrangement,
  nested: nestedArrangement,
};

describe('ArrangementEditor', () => {
  it('renders one radio option per arrangement with a preview grid in the matching direction', async () => {
    const screen = await renderComponent(
      <ArrangementEditorHarness
        initialValue={null}
        label={'Layout'}
        options={options}
      />,
    );

    await expect.element(screen.getByRole('radiogroup', { name: 'Layout' })).toBeVisible();
    await expect.element(screen.getByRole('radio', { name: 'Option 1' })).toBeVisible();
    await expect.element(screen.getByRole('radio', { name: 'Option 2' })).toBeVisible();
    expect(document.querySelectorAll('[data-direction="row"]')).toHaveLength(2);
    expect(document.querySelectorAll('[data-direction="column"]')).toHaveLength(1);
  });

  it('marks the radio matching the current value as checked', async () => {
    const screen = await renderComponent(
      <ArrangementEditorHarness
        initialValue={'nested'}
        label={'Layout'}
        options={options}
      />,
    );

    await expect.element(screen.getByRole('radio', { name: 'Option 2' })).toBeChecked();
    await expect.element(screen.getByRole('radio', { name: 'Option 1' })).not.toBeChecked();
  });

  it('checks no radio when the value is null', async () => {
    const screen = await renderComponent(
      <ArrangementEditorHarness
        initialValue={null}
        label={'Layout'}
        options={options}
      />,
    );

    await expect.element(screen.getByRole('radio', { name: 'Option 1' })).not.toBeChecked();
    await expect.element(screen.getByRole('radio', { name: 'Option 2' })).not.toBeChecked();
  });

  it('updates the selection and calls onChange with the selected key', async () => {
    const onChange = vi.fn<(value: string) => void>();
    const screen = await renderComponent(
      <ArrangementEditorHarness
        initialValue={null}
        label={'Layout'}
        onChange={onChange}
        options={options}
      />,
    );

    await screen.getByRole('radio', { name: 'Option 2' }).click();

    await expect.element(screen.getByRole('radio', { name: 'Option 2' })).toBeChecked();
    expect(onChange).toHaveBeenCalledExactlyOnceWith('nested');
  });

  it('updates the selection when no onChange callback is provided', async () => {
    const screen = await renderComponent(
      <ArrangementEditorHarness
        initialValue={null}
        label={'Layout'}
        options={options}
      />,
    );

    await screen.getByRole('radio', { name: 'Option 1' }).click();

    await expect.element(screen.getByRole('radio', { name: 'Option 1' })).toBeChecked();
  });

  it('hides the radio group and shows a loading indicator while loading', async () => {
    const screen = await renderComponent(
      <ArrangementEditorHarness
        initialValue={null}
        label={'Layout'}
        loading
        options={options}
      />,
    );

    await expect.element(screen.getByRole('radiogroup', { name: 'Layout' })).not.toBeInTheDocument();
    expect(document.querySelectorAll('input[type="radio"]')).toHaveLength(0);
    expect(document.querySelector('.MuiLinearProgress-root')).not.toBeNull();
  });

  it('shows the error message and marks the field as in error', async () => {
    const screen = await renderComponent(
      <ArrangementEditorHarness
        formError={'Please choose a layout'}
        initialValue={null}
        label={'Layout'}
        options={options}
      />,
    );

    await expect.element(screen.getByText('Please choose a layout')).toBeVisible();
    expect(document.querySelector('legend.Mui-error')).not.toBeNull();
  });

  it('shows the info message when there is no error', async () => {
    const screen = await renderComponent(
      <ArrangementEditorHarness
        infoMessage={'Choose how the widgets are arranged'}
        initialValue={null}
        label={'Layout'}
        options={options}
      />,
    );

    await expect.element(screen.getByText('Choose how the widgets are arranged')).toBeVisible();
    expect(document.querySelector('legend.Mui-error')).toBeNull();
  });

  it('shows the warning message when there is no error', async () => {
    const screen = await renderComponent(
      <ArrangementEditorHarness
        initialValue={null}
        label={'Layout'}
        options={options}
        warningMessage={'Changing the layout resets the widgets'}
      />,
    );

    await expect.element(screen.getByText('Changing the layout resets the widgets')).toBeVisible();
  });

  it('disables the legend when disabled', async () => {
    const screen = await renderComponent(
      <ArrangementEditorHarness
        disabled
        initialValue={null}
        label={'Layout'}
        options={options}
      />,
    );

    await expect.element(screen.getByRole('radiogroup', { name: 'Layout' })).toBeVisible();
    expect(document.querySelector('legend.Mui-disabled')).not.toBeNull();
  });
});
