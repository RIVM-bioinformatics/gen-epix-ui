import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { UPLOAD_STEP } from '../../../models/upload.models';
import { renderComponent } from '../../../test/lib';
import {
  createUploadStore,
  STEP_ORDER_UPLOAD,
  UploadStoreContext,
} from '../../../stores/uploadStore';

import type { UploadNavigationProps } from './UploadNavigation';
import { UploadNavigation } from './UploadNavigation';

const GO_BACK_LABEL = 'Go back';
const NEXT_LABEL = 'Next';

type RenderOptions = {
  activeStep?: UPLOAD_STEP;
  goBackFromFirstStepCallback?: () => void;
  goBackFromFirstStepLabel?: string;
};

const renderNavigation = async (props: UploadNavigationProps, options: RenderOptions = {}) => {
  const store = createUploadStore({
    goBackFromFirstStepCallback: options.goBackFromFirstStepCallback,
    goBackFromFirstStepLabel: options.goBackFromFirstStepLabel,
    stepOrder: STEP_ORDER_UPLOAD,
  });
  if (options.activeStep !== undefined) {
    store.setState({ activeStep: options.activeStep });
  }
  const screen = await renderComponent(
    <UploadStoreContext value={store}>
      <UploadNavigation {...props} />
    </UploadStoreContext>,
  );
  return { screen };
};

describe('UploadNavigation', () => {
  it('uses the props go back handler and back label on the first step without a store callback', async () => {
    const onGoBack = vi.fn();
    const { screen } = await renderNavigation({ backLabel: 'Back', onGoBackButtonClick: onGoBack }, { activeStep: UPLOAD_STEP.SELECT_FILE });

    const button = screen.getByRole('button', { exact: true, name: 'Back' });
    await expect.element(button).toBeVisible();
    await button.click();
    expect(onGoBack).toHaveBeenCalledTimes(1);
  });

  it('uses the store callback and label on the first step', async () => {
    const onGoBack = vi.fn();
    const storeCallback = vi.fn();
    const { screen } = await renderNavigation(
      { backLabel: 'Back', onGoBackButtonClick: onGoBack },
      {
        activeStep: UPLOAD_STEP.SELECT_FILE,
        goBackFromFirstStepCallback: storeCallback,
        goBackFromFirstStepLabel: 'Leave upload',
      },
    );

    const button = screen.getByRole('button', { exact: true, name: 'Leave upload' });
    await expect.element(button).toBeVisible();
    await button.click();
    expect(storeCallback).toHaveBeenCalledTimes(1);
    expect(onGoBack).not.toHaveBeenCalled();
  });

  it('uses the store callback with the prop label when the store has no label on the first step', async () => {
    const onGoBack = vi.fn();
    const storeCallback = vi.fn();
    const { screen } = await renderNavigation(
      { backLabel: 'Back', onGoBackButtonClick: onGoBack },
      {
        activeStep: UPLOAD_STEP.SELECT_FILE,
        goBackFromFirstStepCallback: storeCallback,
      },
    );

    const button = screen.getByRole('button', { exact: true, name: 'Back' });
    await expect.element(button).toBeVisible();
    await button.click();
    expect(storeCallback).toHaveBeenCalledTimes(1);
    expect(onGoBack).not.toHaveBeenCalled();
  });

  it('ignores the store callback and label after the first step', async () => {
    const onGoBack = vi.fn();
    const storeCallback = vi.fn();
    const { screen } = await renderNavigation(
      { backLabel: 'Back', onGoBackButtonClick: onGoBack },
      {
        activeStep: UPLOAD_STEP.MAP_COLUMNS,
        goBackFromFirstStepCallback: storeCallback,
        goBackFromFirstStepLabel: 'Leave upload',
      },
    );

    const button = screen.getByRole('button', { exact: true, name: 'Back' });
    await expect.element(button).toBeVisible();
    await button.click();
    expect(onGoBack).toHaveBeenCalledTimes(1);
    expect(storeCallback).not.toHaveBeenCalled();
  });

  it('falls back to the default go back label when no label is provided', async () => {
    const onGoBack = vi.fn();
    const { screen } = await renderNavigation({ onGoBackButtonClick: onGoBack }, { activeStep: UPLOAD_STEP.MAP_COLUMNS });

    const button = screen.getByRole('button', { exact: true, name: GO_BACK_LABEL });
    await expect.element(button).toBeVisible();
    await button.click();
    expect(onGoBack).toHaveBeenCalledTimes(1);
  });

  it('hides the go back button on the first step when no handler is available', async () => {
    const { screen } = await renderNavigation({ onProceedButtonClick: vi.fn() }, { activeStep: UPLOAD_STEP.SELECT_FILE });

    await expect.element(screen.getByRole('button', { exact: true, name: NEXT_LABEL })).toBeVisible();
    await expect.poll(() => screen.getByRole('button', { exact: true, name: GO_BACK_LABEL }).query()).toBeNull();
  });

  it('renders the proceed button with the default label and calls the handler', async () => {
    const onProceed = vi.fn();
    const { screen } = await renderNavigation({ onProceedButtonClick: onProceed });

    const button = screen.getByRole('button', { exact: true, name: NEXT_LABEL });
    await expect.element(button).toBeEnabled();
    await button.click();
    expect(onProceed).toHaveBeenCalledTimes(1);
  });

  it('renders the proceed button with a custom label and disabled state', async () => {
    const { screen } = await renderNavigation({ onProceedButtonClick: vi.fn(), proceedDisabled: true, proceedLabel: 'Continue' });

    await expect.element(screen.getByRole('button', { exact: true, name: 'Continue' })).toBeDisabled();
  });

  it('hides the proceed button when no proceed handler is provided', async () => {
    const { screen } = await renderNavigation({ onGoBackButtonClick: vi.fn() }, { activeStep: UPLOAD_STEP.MAP_COLUMNS });

    await expect.element(screen.getByRole('button', { exact: true, name: GO_BACK_LABEL })).toBeVisible();
    await expect.poll(() => screen.getByRole('button', { exact: true, name: NEXT_LABEL }).query()).toBeNull();
  });
});
