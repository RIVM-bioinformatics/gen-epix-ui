import type { PropsWithChildren } from 'react';
import { useEffect } from 'react';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { useFormContext } from 'react-hook-form';

import { renderComponent } from '../../../test/lib';

import { FileUpload } from './FileUpload';

type UploadForm = {
  files: FileList | null;
};

const FocusUpload = ({ children }: PropsWithChildren) => {
  const { setFocus } = useFormContext<UploadForm>();

  useEffect(() => {
    setFocus('files');
  }, [setFocus]);

  return (
    <>
      {children}
    </>
  );
};

const getFileInput = (baseElement: HTMLElement): HTMLInputElement => {
  const fileInput = baseElement.querySelector<HTMLInputElement>('input[type="file"]');
  if (!fileInput) {
    throw new Error('File input was not rendered');
  }
  return fileInput;
};

const createFileList = (...files: File[]): FileList => {
  const dataTransfer = new DataTransfer();
  files.forEach(file => dataTransfer.items.add(file));
  return dataTransfer.files;
};

describe('FileUpload', () => {
  it('focuses the drop zone and reports selected files to the form and callback', async () => {
    const onChange = vi.fn();
    const screen = await renderComponent(
      <FileUpload<UploadForm, 'files'>
        accept={'.txt,.csv'}
        infoMessage={'Select a document'}
        label={'Documents'}
        name={'files'}
        onChange={onChange}
      />,
      {
        form: { defaultValues: { files: null } },
        wrapper: FocusUpload,
      },
    );
    const dropZone = screen.getByRole('button', { name: 'Documents' });
    const fileInput = getFileInput(screen.baseElement);
    const files = createFileList(new File(['report'], 'report.txt', { type: 'text/plain' }));

    await expect.element(dropZone).toHaveFocus();
    await expect.element(screen.getByText('Select a document')).toBeVisible();
    expect(fileInput.accept).toBe('.txt,.csv');
    expect(fileInput.multiple).toBe(false);

    fileInput.files = files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith(files);
    await expect.element(screen.getByText('report.txt')).toBeVisible();
  });

  it('updates the form without an optional callback and supports multiple files', async () => {
    const screen = await renderComponent(
      <FileUpload<UploadForm, 'files'>
        accept={'.csv'}
        label={'Data files'}
        multiple
        name={'files'}
        warningMessage={'Check the data before uploading'}
      />,
      { form: { defaultValues: { files: null } } },
    );
    const fileInput = getFileInput(screen.baseElement);
    const files = createFileList(
      new File(['first'], 'first.csv', { type: 'text/csv' }),
      new File(['second'], 'second.csv', { type: 'text/csv' }),
    );

    expect(fileInput.multiple).toBe(true);
    await expect.element(screen.getByText('Check the data before uploading')).toBeVisible();
    fileInput.files = files;
    fileInput.dispatchEvent(new Event('change', { bubbles: true }));

    await expect.element(screen.getByText('first.csv, second.csv')).toBeVisible();
  });

  it('disables file selection and displays required and error states', async () => {
    const screen = await renderComponent(
      <FileUpload<UploadForm, 'files'>
        accept={'.zip'}
        disabled
        label={'Archive'}
        name={'files'}
        required
      />,
      {
        form: {
          defaultValues: { files: null },
          errors: { files: { message: 'A valid archive is required', type: 'manual' } },
        },
      },
    );
    const dropZone = screen.getByRole('button', { name: 'Archive' });
    const fileInput = getFileInput(screen.baseElement);

    await expect.element(dropZone).toHaveAttribute('aria-disabled', 'true');
    await expect.element(fileInput).toBeDisabled();
    await expect.element(screen.getByText('A valid archive is required')).toBeVisible();
    await expect.element(screen.getByText('Archive *')).toBeVisible();
  });
});
