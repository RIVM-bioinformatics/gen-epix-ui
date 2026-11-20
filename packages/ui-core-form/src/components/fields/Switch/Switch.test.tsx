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

import { Switch } from './Switch';

type SwitchForm = {
  enabled: boolean | null;
};

const FocusSwitch = ({ children }: PropsWithChildren): ReactElement => {
  const { setFocus } = useFormContext<SwitchForm>();

  useEffect(() => {
    setFocus('enabled');
  }, [setFocus]);

  return (
    <>
      {children}
    </>
  );
};

describe('Switch', () => {
  it('renders the checked state, icon and required label, then reports changes', async () => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <Switch<SwitchForm, 'enabled'>
        icon={(
          <span>
            {'Feature icon'}
          </span>
        )}
        label={'Feature'}
        name={'enabled'}
        onChange={onChange}
        required
      />,
      { form: { defaultValues: { enabled: true } } },
    );
    const toggle = screen.getByRole('switch', { name: /Feature/ });

    await expect.element(toggle).toBeChecked();
    await expect.element(screen.getByText('Feature icon')).toBeVisible();
    await expect.element(toggle).toHaveAttribute('required');

    await toggle.click();

    expect(onChange).toHaveBeenCalledExactlyOnceWith(false);
    await expect.element(toggle).not.toBeChecked();
  });

  it('updates the form when no optional callback is supplied', async () => {
    const screen = await renderComponent(
      <Switch<SwitchForm, 'enabled'>
        label={'Feature'}
        name={'enabled'}
      />,
      { form: { defaultValues: { enabled: null } } },
    );
    const toggle = screen.getByRole('switch', { name: 'Feature' });

    await expect.element(toggle).not.toBeChecked();
    await toggle.click();
    await expect.element(toggle).toBeChecked();
  });

  it('disables the control while disabled or loading and displays loading and warning states', async () => {
    const screen = await renderComponent(
      <Switch<SwitchForm, 'enabled'>
        label={'Feature'}
        loading
        name={'enabled'}
        warningMessage={'Check the feature'}
      />,
      { form: { defaultValues: { enabled: false } } },
    );
    const toggle = screen.getByRole('switch', { name: 'Feature' });

    await expect.element(toggle).toBeDisabled();
    await expect.element(screen.getByRole('progressbar')).toBeVisible();
    await expect.element(screen.getByRole('alert')).toHaveTextContent('Check the feature');

    await screen.rerender(
      <Switch<SwitchForm, 'enabled'>
        disabled
        label={'Feature'}
        name={'enabled'}
      />,
    );

    await expect.element(toggle).toBeDisabled();
    await expect.element(screen.getByRole('progressbar')).not.toBeInTheDocument();
  });

  it('shows an error instead of warning or info messages', async () => {
    const screen = await renderComponent(
      <Switch<SwitchForm, 'enabled'>
        infoMessage={'More information'}
        label={'Feature'}
        name={'enabled'}
        required
        warningMessage={'Check the feature'}
      />,
      {
        form: {
          defaultValues: { enabled: false },
          errors: { enabled: { message: 'Feature is required', type: 'manual' } },
        },
      },
    );

    await expect.element(screen.getByRole('alert')).toHaveTextContent('Feature is required');
    await expect.element(screen.getByRole('alert')).not.toHaveTextContent('Check the feature');
    await expect.element(screen.getByRole('alert')).not.toHaveTextContent('More information');
  });

  it('focuses through the form ref and renders info without an optional icon', async () => {
    const screen = await renderComponent(
      <Switch<SwitchForm, 'enabled'>
        infoMessage={'Feature details'}
        label={'Feature'}
        name={'enabled'}
      />,
      {
        form: { defaultValues: { enabled: false } },
        wrapper: FocusSwitch,
      },
    );

    await expect.element(screen.getByRole('switch', { name: 'Feature' })).toHaveFocus();
    await expect.element(screen.getByRole('alert')).toHaveTextContent('Feature details');
  });
});
