import type { ReactElement } from 'react';
import {
  act,
  createRef,
  useCallback,
  useEffect,
} from 'react';
import {
  expect,
  it,
  vi,
} from 'vitest';

import { renderComponent } from '../../test/lib';

import type {
  WithDialogRefMethods,
  WithDialogRenderProps,
} from './withDialog';
import { withDialog } from './withDialog';

type DialogContentProps = WithDialogRenderProps<DialogOpenProps> & {
  heading: string;
  onAction: () => void;
};

type DialogOpenProps = {
  message: string;
};

const DialogContentForTest = ({
  heading,
  onAction,
  onActionsChange,
  onClose,
  onDisableBackdropClickChange,
  onNoCloseButtonChange,
  onPermalinkChange,
  onTitleChange,
  openProps,
}: DialogContentProps): ReactElement => {
  const onChangeTitle = useCallback(() => {
    onTitleChange?.('Updated title');
  }, [onTitleChange]);
  const onAddPermalink = useCallback(() => {
    onPermalinkChange?.('https://example.test/updated');
  }, [onPermalinkChange]);
  const onDisableBackdropClick = useCallback(() => {
    onDisableBackdropClickChange?.(true);
  }, [onDisableBackdropClickChange]);
  const onHideCloseButton = useCallback(() => {
    onNoCloseButtonChange?.(true);
  }, [onNoCloseButtonChange]);
  const onCloseDialog = useCallback(() => {
    onClose?.();
  }, [onClose]);

  useEffect(() => {
    onActionsChange?.([{ label: 'Save', onClick: onAction }]);
  }, [onAction, onActionsChange]);

  return (
    <div>
      <p>
        {`${heading}: ${openProps?.message ?? 'No message'}`}
      </p>
      <button onClick={onChangeTitle}>
        {'Change title'}
      </button>
      <button onClick={onAddPermalink}>
        {'Add permalink'}
      </button>
      <button onClick={onDisableBackdropClick}>
        {'Disable backdrop'}
      </button>
      <button onClick={onHideCloseButton}>
        {'Hide close button'}
      </button>
      <button onClick={onCloseDialog}>
        {'Close from content'}
      </button>
    </div>
  );
};

const DialogWithOptions = withDialog<DialogContentProps, DialogOpenProps>(DialogContentForTest, {
  defaultTitle: 'Default title',
  fullWidth: true,
  maxWidth: 'sm',
  noPadding: true,
  testId: 'with-dialog',
  titleVariant: 'h6',
});

const UntitledDialog = withDialog<DialogContentProps, DialogOpenProps>(DialogContentForTest, {
  disableBackdropClick: true,
  noCloseButton: true,
  noTitle: true,
  testId: 'untitled-with-dialog',
});

const getRequiredElement = <TElement extends HTMLElement>(
  container: ParentNode,
  selector: string,
): TElement => {
  const element = container.querySelector<TElement>(selector);
  if (!element) {
    throw new Error(`Element not found for selector: ${selector}`);
  }
  return element;
};

const pressEscape = (baseElement: HTMLElement): void => {
  getRequiredElement(baseElement, '[role="dialog"]').dispatchEvent(new KeyboardEvent('keydown', {
    bubbles: true,
    key: 'Escape',
  }));
};

it('opens with props and updates dialog state through content callbacks', async () => {
  const onAction = vi.fn();
  const onClose = vi.fn();
  const ref = createRef<WithDialogRefMethods<DialogContentProps, DialogOpenProps>>();
  const screen = await renderComponent(
    <DialogWithOptions
      heading={'Record'}
      onAction={onAction}
      onClose={onClose}
      ref={ref}
      title={'Record title'}
    />,
  );

  expect(screen.baseElement.querySelector('[role="dialog"]')).toBeNull();
  act(() => {
    ref.current?.open({ message: 'loaded' });
  });

  await expect.element(screen.getByRole('dialog')).toBeVisible();
  await expect.element(screen.getByRole('heading', { name: 'Record title' })).toBeVisible();
  await expect.element(screen.getByText('Record: loaded')).toBeVisible();
  await expect.element(screen.getByTestId('with-dialog-content')).toBeVisible();
  await expect.element(screen.getByRole('button', { name: 'Save' })).toBeVisible();
  await expect.element(screen.getByTestId('with-dialog-closeButton')).toBeVisible();
  expect(getRequiredElement(screen.baseElement, '.MuiDialog-paper'))
    .toHaveClass('MuiDialog-paperFullWidth');
  expect(getRequiredElement(screen.baseElement, '[data-testid="with-dialog-content"]'))
    .toHaveStyle({ padding: '0px' });

  await screen.getByRole('button', { name: 'Save' }).click();
  expect(onAction).toHaveBeenCalledOnce();

  await screen.getByRole('button', { name: 'Change title' }).click();
  await expect.element(screen.getByRole('heading', { name: 'Updated title' })).toBeVisible();

  await screen.getByRole('button', { name: 'Add permalink' }).click();
  await expect.element(screen.getByRole('button', { name: 'Copy to clipboard' })).toBeVisible();

  await screen.getByRole('button', { name: 'Disable backdrop' }).click();
  pressEscape(screen.baseElement);
  await expect.element(screen.getByRole('dialog')).toBeVisible();

  await screen.getByRole('button', { name: 'Hide close button' }).click();
  await expect.element(screen.getByTestId('with-dialog-closeButton')).not.toBeInTheDocument();

  await screen.getByRole('button', { name: 'Close from content' }).click();
  await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
  expect(onClose).toHaveBeenCalledOnce();
});

it('uses the default title when none is provided and supports closing by ref', async () => {
  const onAction = vi.fn();
  const onClose = vi.fn();
  const ref = createRef<WithDialogRefMethods<DialogContentProps, DialogOpenProps>>();
  const screen = await renderComponent(
    <DialogWithOptions
      heading={'Record'}
      onAction={onAction}
      onClose={onClose}
      ref={ref}
    />,
  );

  act(() => {
    ref.current?.open({ message: 'ready' });
  });
  await expect.element(screen.getByRole('heading', { name: 'Default title' })).toBeVisible();
  await expect.element(screen.getByText('Record: ready')).toBeVisible();

  act(() => {
    ref.current?.close();
  });
  await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
  expect(onClose).not.toHaveBeenCalled();
});

it('honors no-title and disabled-backdrop options', async () => {
  const onAction = vi.fn();
  const onClose = vi.fn();
  const ref = createRef<WithDialogRefMethods<DialogContentProps, DialogOpenProps>>();
  const screen = await renderComponent(
    <UntitledDialog
      heading={'Untitled record'}
      onAction={onAction}
      onClose={onClose}
      ref={ref}
      title={'Ignored title'}
    />,
  );

  act(() => {
    ref.current?.open({ message: 'ready' });
  });
  await expect.element(screen.getByRole('dialog')).toBeVisible();
  await expect.element(screen.getByTestId('untitled-with-dialog-title')).not.toBeInTheDocument();
  await expect.element(screen.getByTestId('untitled-with-dialog-closeButton'))
    .not.toBeInTheDocument();
  await expect.element(screen.getByText('Untitled record: ready')).toBeVisible();

  pressEscape(screen.baseElement);
  await expect.element(screen.getByRole('dialog')).toBeVisible();

  act(() => {
    ref.current?.close();
  });
  await expect.element(screen.getByRole('dialog')).not.toBeInTheDocument();
  expect(onClose).not.toHaveBeenCalled();
});
