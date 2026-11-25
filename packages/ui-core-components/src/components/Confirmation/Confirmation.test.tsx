import {
  useCallback,
  useRef,
} from 'react';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { renderComponent } from '../../test/lib';

import type {
  ConfirmationProps,
  ConfirmationRefMethods,
} from './Confirmation';
import { Confirmation } from './Confirmation';

const ConfirmationHarness = (props: ConfirmationProps) => {
  const confirmationRef = useRef<ConfirmationRefMethods>(null);
  const onOpen = useCallback(() => {
    confirmationRef.current?.open();
  }, []);

  return (
    <>
      <button onClick={onOpen}>
        {'Open confirmation'}
      </button>
      <Confirmation
        {...props}
        ref={confirmationRef}
        title={'Confirm'}
      />
    </>
  );
};

const renderOpenedConfirmation = async (props: ConfirmationProps) => {
  const screen = await renderComponent(
    <ConfirmationHarness {...props} />,
  );
  await screen.getByRole('button', { name: 'Open confirmation' }).click();

  return { screen };
};

describe('Confirmation', () => {
  it('passes opened props to confirm and closes the dialog', async () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const { screen } = await renderOpenedConfirmation({
      body: 'Delete this item?',
      confirmLabel: 'Delete',
      onClose,
      onConfirm,
    });

    await expect.element(screen.getByText('Delete this item?')).toBeVisible();
    await screen.getByRole('button', { name: 'Delete' }).click();

    expect(onConfirm).toHaveBeenCalledWith(undefined);
    expect(onClose).toHaveBeenCalledOnce();
    await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
  });

  it('passes opened props to cancel and closes the dialog', async () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    const { screen } = await renderOpenedConfirmation({
      cancelLabel: 'Cancel',
      confirmLabel: 'Continue',
      onCancel,
      onClose,
      onConfirm,
    });

    await screen.getByRole('button', { name: 'Cancel' }).click();

    expect(onCancel).toHaveBeenCalledWith(undefined);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
    await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes without a cancel callback when onCancel is omitted', async () => {
    const onClose = vi.fn();
    const { screen } = await renderOpenedConfirmation({
      cancelLabel: 'Cancel',
      confirmLabel: 'Continue',
      onClose,
      onConfirm: vi.fn(),
    });

    await screen.getByRole('button', { name: 'Cancel' }).click();

    expect(onClose).toHaveBeenCalledOnce();
    await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
  });

  it('uses the default confirm label when the label is undefined at runtime', async () => {
    const props: ConfirmationProps = {
      confirmLabel: 'Continue',
      onConfirm: vi.fn(),
    };
    Object.assign(props, { confirmLabel: undefined });
    const { screen } = await renderOpenedConfirmation(props);

    await expect.element(screen.getByRole('button', { name: 'OK' })).toBeVisible();
  });

  it.each([
    { cancelLabel: undefined, caseName: 'omitted' },
    { cancelLabel: '', caseName: 'empty' },
  ])('omits the cancel action for a $caseName label', async ({ cancelLabel }) => {
    const { screen } = await renderOpenedConfirmation({
      cancelLabel,
      confirmLabel: 'Continue',
      onConfirm: vi.fn(),
    });

    await expect.element(screen.getByRole('button', { name: 'Continue' })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Cancel' })).not.toBeInTheDocument();
  });

  it.each([
    { body: undefined, bodyCase: 'omitted' },
    { body: '', bodyCase: 'empty' },
  ])('omits the body when it is $bodyCase', async ({ body }) => {
    const { screen } = await renderOpenedConfirmation({
      body,
      confirmLabel: 'Continue',
      onConfirm: vi.fn(),
    });

    await expect.element(screen.getByTestId('Confirmation-textContent')).not.toBeInTheDocument();
  });

  it('renders a whitespace-only body', async () => {
    const { screen } = await renderOpenedConfirmation({
      body: ' ',
      confirmLabel: 'Continue',
      onConfirm: vi.fn(),
    });

    await expect.element(screen.getByTestId('Confirmation-textContent')).toBeInTheDocument();
  });
});
