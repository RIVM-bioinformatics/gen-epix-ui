import { createRef } from 'react';
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { renderComponent } from '../../test/lib';

import type { FileDropZoneProps } from './FileDropZone';
import { FileDropZone } from './FileDropZone';

const renderFileDropZone = async (overrides: Partial<FileDropZoneProps> = {}) => {
  const onFilesSelected = overrides.onFilesSelected ?? vi.fn();
  const props: FileDropZoneProps = {
    accept: '.txt,.csv',
    files: null,
    label: 'Upload a file',
    ...overrides,
    onFilesSelected,
  };
  const screen = await renderComponent(
    <FileDropZone {...props} />,
  );

  return { onFilesSelected, props, screen };
};

const getDropZone = (baseElement: HTMLElement): HTMLElement => {
  const dropZone = baseElement.querySelector<HTMLElement>('[role="button"]');

  if (!dropZone) {
    throw new Error('File drop zone was not rendered');
  }

  return dropZone;
};

const getFileInput = (baseElement: HTMLElement): HTMLInputElement => {
  const fileInput = baseElement.querySelector<HTMLInputElement>('input[type="file"]');

  if (!fileInput) {
    throw new Error('File input was not rendered');
  }

  return fileInput;
};

const createFileTransfer = (...files: File[]): DataTransfer => {
  const dataTransfer = new DataTransfer();
  files.forEach((file) => dataTransfer.items.add(file));
  return dataTransfer;
};

const dispatchDragEvent = (element: HTMLElement, type: string, dataTransfer = new DataTransfer()): DragEvent => {
  const event = new DragEvent(type, {
    bubbles: true,
    cancelable: true,
    dataTransfer,
  });
  element.dispatchEvent(event);
  return event;
};

describe('FileDropZone', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the empty state with accessible label, descriptions, and input options', async () => {
    const { screen } = await renderFileDropZone({
      accept: '.pdf,.txt',
      ariaDescribedBy: 'file-help',
      helperText: 'Choose documents',
      label: 'Upload documents',
      multiple: true,
    });
    const dropZone = getDropZone(screen.baseElement);
    const fileInput = getFileInput(screen.baseElement);
    const describedBy = dropZone.getAttribute('aria-describedby')?.split(' ') ?? [];

    await expect.element(screen.getByRole('button', { name: 'Upload documents (.pdf, .txt)' })).toBeVisible();
    await expect.element(screen.getByText('Choose documents')).toBeVisible();
    await expect.element(screen.getByText('Choose File')).toBeVisible();
    expect(dropZone.getAttribute('aria-label')).toBe('Upload documents (.pdf, .txt)');
    expect(describedBy).toHaveLength(2);
    expect(describedBy[0]).toBe('file-help');
    expect(fileInput.accept).toBe('.pdf,.txt');
    expect(fileInput.multiple).toBe(true);
  });

  it('uses an external label and fallback helper text when configured', async () => {
    const dropZoneRef = createRef<HTMLDivElement>();
    const screen = await renderComponent(
      <>
        <span id={'external-label'}>
          {'Choose an archive'}
        </span>
        <FileDropZone
          accept={'.zip'}
          files={null}
          label={'Upload archive'}
          labelledById={'external-label'}
          onFilesSelected={vi.fn()}
          ref={dropZoneRef}
        />
      </>,
    );
    const dropZone = getDropZone(screen.baseElement);

    await expect.element(screen.getByRole('button', { name: 'Choose an archive' })).toBeVisible();
    await expect.element(screen.getByText('Drag & drop your file here, or click to browse')).toBeVisible();
    expect(dropZoneRef.current).toBe(dropZone);
    expect(dropZone.getAttribute('aria-labelledby')).toBe('external-label');
    expect(dropZone.hasAttribute('aria-label')).toBe(false);
    expect(dropZone.getAttribute('aria-describedby')).not.toBe('');
  });

  it('opens the file picker by click or keyboard and reports blur', async () => {
    const onBlur = vi.fn();
    const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined);
    const { screen } = await renderFileDropZone({ onBlur });
    const dropZone = getDropZone(screen.baseElement);

    await screen.getByRole('button', { name: 'Upload a file (.txt, .csv)' }).click();
    expect(inputClick).toHaveBeenCalledOnce();

    const enterEvent = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' });
    const spaceEvent = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: ' ' });
    const arrowEvent = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowDown' });
    dropZone.dispatchEvent(enterEvent);
    dropZone.dispatchEvent(spaceEvent);
    dropZone.dispatchEvent(arrowEvent);

    expect(enterEvent.defaultPrevented).toBe(true);
    expect(spaceEvent.defaultPrevented).toBe(true);
    expect(arrowEvent.defaultPrevented).toBe(false);
    expect(inputClick).toHaveBeenCalledTimes(3);

    dropZone.focus();
    dropZone.blur();
    expect(onBlur).toHaveBeenCalledOnce();
  });

  it('handles file input changes and clears the input when files are externally cleared', async () => {
    const { onFilesSelected, props, screen } = await renderFileDropZone();
    const fileInput = getFileInput(screen.baseElement);
    const fileTransfer = createFileTransfer(new File(['text'], 'notes.txt', { type: 'text/plain' }));

    fileInput.files = fileTransfer.files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    expect(onFilesSelected).toHaveBeenCalledExactlyOnceWith(fileTransfer.files);
    expect(fileInput.value).toBe('C:\\fakepath\\notes.txt');

    fileInput.files = new DataTransfer().files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));
    fileInput.files = null;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));

    fileInput.files = fileTransfer.files;
    await screen.rerender(
      <FileDropZone
        {...props}
        files={fileTransfer.files}
      />,
    );
    expect(fileInput.value).toBe('C:\\fakepath\\notes.txt');
    await screen.rerender(
      <FileDropZone
        {...props}
        files={null}
      />,
    );
    expect(fileInput.value).toBe('');
  });

  it('tracks drag state, restores error styling, and ignores empty drops', async () => {
    const { onFilesSelected, screen } = await renderFileDropZone({ error: true });
    const dropZone = getDropZone(screen.baseElement);
    const errorBorderColor = getComputedStyle(dropZone).borderTopColor;
    const dragOverEvent = dispatchDragEvent(dropZone, 'dragover');

    expect(dragOverEvent.defaultPrevented).toBe(true);
    await expect.poll(() => getComputedStyle(dropZone).borderTopColor).not.toBe(errorBorderColor);

    dispatchDragEvent(dropZone, 'dragleave');
    await expect.poll(() => getComputedStyle(dropZone).borderTopColor).toBe(errorBorderColor);

    const dropEvent = dispatchDragEvent(dropZone, 'drop');
    expect(dropEvent.defaultPrevented).toBe(true);
    expect(onFilesSelected).not.toHaveBeenCalled();
  });

  it('selects dropped files and displays externally supplied file state', async () => {
    const { onFilesSelected, props, screen } = await renderFileDropZone({ multiple: true });
    const dropZone = getDropZone(screen.baseElement);
    const fileTransfer = createFileTransfer(
      new File(['a'], 'first.csv', { type: 'text/csv' }),
      new File(['bc'], 'second.csv', { type: 'text/csv' }),
    );

    dispatchDragEvent(dropZone, 'dragover', fileTransfer);
    dispatchDragEvent(dropZone, 'drop', fileTransfer);
    expect(onFilesSelected).toHaveBeenCalledWith(fileTransfer.files);

    await screen.rerender(
      <FileDropZone
        {...props}
        files={fileTransfer.files}
      />,
    );
    await expect.element(screen.getByText('first.csv, second.csv')).toBeVisible();
    await expect.element(screen.getByText(/Click or drag to replace/)).toBeVisible();
    expect(getFileInput(screen.baseElement).multiple).toBe(true);
  });

  it('blocks click, keyboard, and drop actions when disabled', async () => {
    const inputClick = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => undefined);
    const { onFilesSelected, screen } = await renderFileDropZone({
      disabled: true,
      error: true,
    });
    const dropZone = getDropZone(screen.baseElement);
    const fileInput = getFileInput(screen.baseElement);

    expect(dropZone.getAttribute('aria-disabled')).toBe('true');
    expect(dropZone.tabIndex).toBe(-1);
    expect(getComputedStyle(dropZone).pointerEvents).toBe('none');
    expect(getComputedStyle(dropZone).opacity).toBe('0.6');
    expect(fileInput.disabled).toBe(true);

    dropZone.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    const keyEvent = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' });
    dropZone.dispatchEvent(keyEvent);
    const fileTransfer = createFileTransfer(new File(['a'], 'disabled.txt'));
    const dragOverEvent = dispatchDragEvent(dropZone, 'dragover', fileTransfer);
    const dropEvent = dispatchDragEvent(dropZone, 'drop', fileTransfer);

    expect(inputClick).not.toHaveBeenCalled();
    expect(keyEvent.defaultPrevented).toBe(false);
    expect(dragOverEvent.defaultPrevented).toBe(true);
    expect(dropEvent.defaultPrevented).toBe(true);
    expect(onFilesSelected).not.toHaveBeenCalled();
  });
});
