import { createRef } from 'react';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import type { ConfigBase } from '../../../models/config.models';
import { renderComponent } from '../../../test/lib';

import { ConsentDialog } from './ConsentDialog';
import type { ConsentDialogRefMethods } from './ConsentDialog';

const renderDialog = async (
  onConsent: () => void,
  configure?: (config: ConfigBase) => void,
) => {
  const ref = createRef<ConsentDialogRefMethods>();
  const screen = await renderComponent(
    <ConsentDialog
      onConsent={onConsent}
      ref={ref}
    />,
    { configure },
  );
  ref.current?.open({});
  return screen;
};

describe('ConsentDialog', () => {
  it('renders the default title and agree button label from the config', async () => {
    const screen = await renderDialog(vi.fn());

    await expect.element(screen.getByRole('heading', { name: 'Consent' })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'I consent' })).toBeVisible();
  });

  it('renders the configured title, content and agree button label', async () => {
    const screen = await renderDialog(vi.fn(), (config) => {
      config.consentDialog.getTitle = () => 'Custom consent title';
      config.consentDialog.getButtonLabel = () => 'I agree to the terms';
      config.consentDialog.Content = () => (
        <div>
          {'Custom consent content'}
        </div>
      );
    });

    await expect.element(screen.getByRole('heading', { name: 'Custom consent title' })).toBeVisible();
    await expect.element(screen.getByText('Custom consent content')).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'I agree to the terms' })).toBeVisible();
  });

  it('calls onConsent when the agree button is clicked', async () => {
    const onConsent = vi.fn();
    const screen = await renderDialog(onConsent);

    await screen.getByRole('button', { name: 'I consent' }).click();

    expect(onConsent).toHaveBeenCalledOnce();
  });

  it('does not render a close button because the consent dialog must be answered', async () => {
    const screen = await renderDialog(vi.fn());

    await expect.element(screen.getByRole('button', { name: 'I consent' })).toBeVisible();
    expect(screen.getByTestId('ConsentDialog-closeButton').query()).toBeNull();
  });
});
