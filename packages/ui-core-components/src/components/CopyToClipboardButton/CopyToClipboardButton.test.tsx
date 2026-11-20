import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { renderComponent } from '../../test/lib';

import { CopyToClipboardButton } from './CopyToClipboardButton';

describe('CopyToClipboardButton', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('copies a direct value with the default button and resets after the timeout', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    const onGetClipboardValue = vi.fn(() => 'unused value');
    const screen = await renderComponent(
      <CopyToClipboardButton
        buttonProps={{ disableElevation: true }}
        clipboardValue={''}
        onGetClipboardValue={onGetClipboardValue}
      />,
    );
    const button = screen.getByRole('button', { name: 'Copy to clipboard' });
    const buttonElement = screen.container.querySelector('button');

    expect(buttonElement?.className).toContain('MuiButton-contained');
    expect(buttonElement?.className).toContain('MuiButton-disableElevation');
    await button.click();

    expect(writeText).toHaveBeenCalledWith('');
    expect(onGetClipboardValue).not.toHaveBeenCalled();
    await expect.element(screen.getByTestId('DoneIcon')).toBeInTheDocument();
    expect(buttonElement?.className).toContain('MuiButton-colorSuccess');

    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 2100);
    });

    await expect.element(screen.getByTestId('ContentCopyIcon')).toBeInTheDocument();
    expect(buttonElement?.className).toContain('MuiButton-colorPrimary');
  });

  it('copies a getter value and shows a custom icon-only success tooltip', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    const onGetClipboardValue = vi.fn(() => 'latest value');
    const screen = await renderComponent(
      <CopyToClipboardButton
        baseIcon={<span data-testid={'custom-icon'} />}
        buttonText={'Copy item'}
        iconOnly
        onGetClipboardValue={onGetClipboardValue}
        tooltipSuccessText={'Item copied'}
      />,
    );
    const button = screen.getByRole('button', { name: 'Copy item' });

    await button.hover();
    await expect.element(screen.getByRole('tooltip')).toHaveTextContent('Copy item');
    await button.click();

    expect(writeText).toHaveBeenCalledWith('latest value');
    expect(onGetClipboardValue).toHaveBeenCalledOnce();
    await expect.element(screen.getByRole('tooltip')).toHaveTextContent('Item copied');
    await expect.element(screen.getByTestId('DoneIcon')).toBeInTheDocument();
    expect(screen.container.querySelector('button')?.className).toContain('MuiIconButton-colorSuccess');

    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 2100);
    });

    await expect.element(screen.getByTestId('custom-icon')).toBeInTheDocument();
    await expect.element(screen.getByRole('tooltip')).toHaveTextContent('Copy item');
  });

  it('shows an error tooltip when clipboard writing fails', async () => {
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('Clipboard unavailable'));
    const screen = await renderComponent(
      <CopyToClipboardButton
        clipboardValue={'value'}
        iconOnly
      />,
    );
    const button = screen.getByRole('button', { name: 'Copy to clipboard' });

    await button.hover();
    await button.click();

    expect(writeText).toHaveBeenCalledWith('value');
    await expect.element(screen.getByRole('tooltip')).toHaveTextContent('Error');
    await expect.element(screen.getByTestId('ErrorIcon')).toBeInTheDocument();
    expect(screen.container.querySelector('button')?.className).toContain('MuiIconButton-colorError');
  });

  it('applies a custom variant and button props', async () => {
    const screen = await renderComponent(
      <CopyToClipboardButton
        buttonProps={{ disabled: true }}
        buttonText={'Copy item'}
        buttonVariant={'outlined'}
        clipboardValue={'value'}
      />,
    );
    const button = screen.getByRole('button', { name: 'Copy item' });

    await expect.element(button).toBeDisabled();
    expect(screen.container.querySelector('button')?.className).toContain('MuiButton-outlined');
  });
});
