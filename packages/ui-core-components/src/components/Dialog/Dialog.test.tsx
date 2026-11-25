import { createRef } from 'react';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { renderComponent } from '../../test/lib';

import { Dialog } from './Dialog';

const getRequiredElement = <TElement extends HTMLElement>(baseElement: HTMLElement, selector: string): TElement => {
  const element = baseElement.querySelector<TElement>(selector);

  if (!element) {
    throw new Error(`Element not found for selector: ${selector}`);
  }

  return element;
};

const clickBackdrop = (baseElement: HTMLElement) => {
  getRequiredElement(baseElement, '.MuiBackdrop-root').click();
};

const pressEscape = (baseElement: HTMLElement) => {
  getRequiredElement(baseElement, '[role="dialog"]').dispatchEvent(new KeyboardEvent('keydown', {
    bubbles: true,
    key: 'Escape',
  }));
};

describe('Dialog', () => {
  it('renders children and both action types, and handles close callbacks', async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    const screen = await renderComponent(
      <Dialog
        actions={[
          { label: 'Save', onClick: onSave },
          <span
            data-testid={'custom-action'}
            key={'custom-action'}
          >
            {'Custom action'}
          </span>,
        ]}
        onClose={onClose}
        testId={'record-dialog'}
        title={'Record details'}
      >
        <p>
          {'Dialog content'}
        </p>
      </Dialog>,
    );

    await expect.element(screen.getByRole('dialog')).toBeVisible();
    await expect.element(screen.getByText('Dialog content')).toBeVisible();
    await expect.element(screen.getByTestId('custom-action')).toBeVisible();
    await screen.getByRole('button', { name: 'Save' }).click();

    expect(onSave).toHaveBeenCalledOnce();
    await screen.getByTestId('record-dialog-closeButton').click();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('applies full-screen layout and can hide the close button', async () => {
    const screen = await renderComponent(
      <Dialog
        fullScreen
        noCloseButton
        noPadding
        testId={'full-screen-dialog'}
        title={'Full screen'}
        titleVariant={'h6'}
      >
        <p>
          {'Full-screen content'}
        </p>
      </Dialog>,
    );
    const title = getRequiredElement(screen.baseElement, '[data-testid="full-screen-dialog-title"]');
    const content = getRequiredElement(screen.baseElement, '[data-testid="full-screen-dialog-content"]');

    expect(title.className).toContain('MuiTypography-h6');
    expect(getComputedStyle(content).padding).toBe('0px');
    expect(getComputedStyle(content).paddingTop).toBe('0px');
    await expect.element(screen.getByTestId('full-screen-dialog-closeButton')).not.toBeInTheDocument();
  });

  it('omits title, content, and empty actions when requested', async () => {
    const screen = await renderComponent(
      <Dialog
        actions={[]}
        noTitle
        testId={'empty-dialog'}
      />,
    );

    await expect.element(screen.getByRole('dialog')).toBeInTheDocument();
    await expect.element(screen.getByTestId('empty-dialog-title')).not.toBeInTheDocument();
    await expect.element(screen.getByTestId('empty-dialog-content')).not.toBeInTheDocument();
    await expect.element(screen.getByTestId('empty-dialog-actions')).not.toBeInTheDocument();
    await expect.element(screen.getByTestId('empty-dialog-closeButton')).not.toBeInTheDocument();
  });

  it('uses the default close label and handles escape and close-button events', async () => {
    const onClose = vi.fn();
    const screen = await renderComponent(
      <Dialog
        onClose={onClose}
        testId={'untitled-dialog'}
      />,
    );

    await expect.element(screen.getByRole('button', { name: 'Close dialog' })).toBeVisible();
    pressEscape(screen.baseElement);
    expect(onClose).toHaveBeenCalledOnce();

    await screen.getByTestId('untitled-dialog-closeButton').click();
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('handles pointer cancellation and escape without an onClose callback', async () => {
    const screen = await renderComponent(
      <Dialog
        noTitle
        testId={'no-close-handler-dialog'}
      />,
    );
    const dialog = getRequiredElement(screen.baseElement, '[role="dialog"]');

    dialog.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true }));
    pressEscape(screen.baseElement);

    await expect.element(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('prevents backdrop and escape close requests when disabled', async () => {
    const onClose = vi.fn();
    const screen = await renderComponent(
      <Dialog
        disableBackdropClick
        onClose={onClose}
        testId={'disabled-backdrop-dialog'}
      >
        <p>
          {'Dialog content'}
        </p>
      </Dialog>,
    );

    clickBackdrop(screen.baseElement);
    pressEscape(screen.baseElement);

    expect(onClose).not.toHaveBeenCalled();
    await expect.element(screen.getByRole('dialog')).toBeVisible();
  });

  it('ignores a backdrop click while a dialog popper is open', async () => {
    const dialogContentRef = createRef<HTMLDivElement>();
    const onClose = vi.fn();
    const screen = await renderComponent(
      <Dialog
        dialogContentRef={dialogContentRef}
        onClose={onClose}
        testId={'popper-dialog'}
      >
        <div>
          <input
            aria-controls={'popper-options'}
            aria-expanded={'true'}
            role={'combobox'}
          />
          <div className={'MuiPopper-root'}>
            <ul id={'popper-options'} />
          </div>
        </div>
      </Dialog>,
    );

    clickBackdrop(screen.baseElement);

    expect(onClose).not.toHaveBeenCalled();
    await expect.element(screen.getByRole('dialog')).toBeVisible();
  });

  it('closes on a backdrop click when no popper is open', async () => {
    const onClose = vi.fn();
    const screen = await renderComponent(
      <Dialog
        onClose={onClose}
        testId={'backdrop-dialog'}
      >
        <p>
          {'Dialog content'}
        </p>
      </Dialog>,
    );

    clickBackdrop(screen.baseElement);

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('copies the permalink', async () => {
    const permalink = 'https://example.test/invitation';
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    const screen = await renderComponent(
      <Dialog
        permalink={permalink}
        testId={'permalink-dialog'}
        title={'Share link'}
      />,
    );

    await screen.getByRole('button', { name: 'Copy to clipboard' }).click();

    expect(writeText).toHaveBeenCalledWith(permalink);
  });
});
