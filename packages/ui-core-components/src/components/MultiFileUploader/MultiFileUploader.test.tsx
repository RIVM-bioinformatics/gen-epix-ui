import {
  expect,
  it,
} from 'vitest';

import { renderComponent } from '../../test/lib';

import { MultiFileUploader } from './MultiFileUploader';

type RenderedScreen = Awaited<ReturnType<typeof renderComponent>>;

const createFile = (name: string, contents = 'file contents', type = '') => new File(
  [contents],
  name,
  { lastModified: 0, type },
);

const createDataTransfer = (...files: File[]) => {
  const dataTransfer = new DataTransfer();
  files.forEach(file => dataTransfer.items.add(file));
  return dataTransfer;
};

const createChangeTracker = () => {
  const changes: DataTransfer[] = [];
  const onDataTransferChange = (dataTransfer: DataTransfer): void => {
    changes.push(dataTransfer);
  };
  return { changes, onDataTransferChange };
};

const onDataTransferChangeNoop = (): undefined => undefined;

const getRequiredElement = <T extends Element>(container: ParentNode, selector: string): T => {
  const element = container.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Expected to find ${selector}`);
  }
  return element;
};

const getFileInput = (screen: RenderedScreen) => getRequiredElement<HTMLInputElement>(
  screen.baseElement,
  'input[type="file"]',
);

const getUploadLabel = (screen: RenderedScreen) => getRequiredElement<HTMLLabelElement>(
  screen.baseElement,
  'label',
);

const selectFiles = (screen: RenderedScreen, files: File[] | null) => {
  const input = getFileInput(screen);
  input.files = files === null ? null : createDataTransfer(...files).files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
};

const dispatchDragEvent = (
  element: HTMLElement,
  type: string,
  dataTransfer = new DataTransfer(),
) => {
  const event = new DragEvent(type, {
    bubbles: true,
    cancelable: true,
    dataTransfer,
  });
  element.dispatchEvent(event);
  return event;
};

it('renders a single-file input and does not report its initial data', async () => {
  const { changes, onDataTransferChange } = createChangeTracker();
  const screen = await renderComponent(
    <MultiFileUploader
      accept={'.fa,.fasta'}
      onDataTransferChange={onDataTransferChange}
    />,
  );
  const input = getFileInput(screen);

  expect(input.accept).toBe('.fa,.fasta');
  expect(input.multiple).toBe(false);
  await expect.element(screen.getByText('Click or drag to upload file (.fa, .fasta)')).toBeVisible();
  expect(changes).toHaveLength(0);
});

it('renders initial files and a plural multi-file input without notifying the parent', async () => {
  const { changes, onDataTransferChange } = createChangeTracker();
  const initialDataTransfer = createDataTransfer(createFile('initial.fa'));
  const screen = await renderComponent(
    <MultiFileUploader
      accept={'.fa'}
      initialDataTransfer={initialDataTransfer}
      numFilesAllowed={2}
      onDataTransferChange={onDataTransferChange}
    />,
  );
  const input = getFileInput(screen);

  expect(input.multiple).toBe(true);
  await expect.element(screen.getByText('Selected files: 1')).toBeVisible();
  await expect.element(screen.getByText('initial.fa')).toBeVisible();
  await expect.element(screen.getByText(/Click or drag to upload files/)).toBeVisible();
  expect(changes).toHaveLength(0);
});

it('handles drag enter, over, and leave while stopping browser defaults', async () => {
  const screen = await renderComponent(
    <MultiFileUploader
      accept={'.fa'}
      onDataTransferChange={onDataTransferChangeNoop}
    />,
  );
  const uploadLabel = getUploadLabel(screen);
  const bubbledEvents: string[] = [];
  for (const eventType of ['dragenter', 'dragover', 'dragleave']) {
    screen.baseElement.addEventListener(eventType, event => {
      bubbledEvents.push(event.type);
    });
  }

  const dragEnterEvent = dispatchDragEvent(uploadLabel, 'dragenter');
  expect(dragEnterEvent.defaultPrevented).toBe(true);
  await expect.element(screen.getByText('Drop file here')).toBeVisible();

  const dragOverEvent = dispatchDragEvent(uploadLabel, 'dragover');
  expect(dragOverEvent.defaultPrevented).toBe(true);

  const dragLeaveEvent = dispatchDragEvent(uploadLabel, 'dragleave');
  expect(dragLeaveEvent.defaultPrevented).toBe(true);
  expect(bubbledEvents).toHaveLength(0);
  await expect.element(screen.getByText('Click or drag to upload file (.fa)')).toBeVisible();
});

it('opens the file input on Enter and Space, but ignores other keys', async () => {
  const screen = await renderComponent(
    <MultiFileUploader
      accept={'.fa'}
      onDataTransferChange={onDataTransferChangeNoop}
    />,
  );
  const input = getFileInput(screen);
  const uploadLabel = getUploadLabel(screen);
  let inputClickCount = 0;
  input.addEventListener('click', () => {
    inputClickCount += 1;
  });

  const enterEvent = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' });
  uploadLabel.dispatchEvent(enterEvent);
  const spaceEvent = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: ' ' });
  uploadLabel.dispatchEvent(spaceEvent);
  const otherKeyEvent = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'ArrowDown' });
  uploadLabel.dispatchEvent(otherKeyEvent);

  expect(enterEvent.defaultPrevented).toBe(true);
  expect(spaceEvent.defaultPrevented).toBe(true);
  expect(otherKeyEvent.defaultPrevented).toBe(false);
  expect(inputClickCount).toBe(2);
});

it('adds files matching accepted extensions and MIME types from the input', async () => {
  const { changes, onDataTransferChange } = createChangeTracker();
  const screen = await renderComponent(
    <MultiFileUploader
      accept={'.fa,text/csv'}
      numFilesAllowed={2}
      onDataTransferChange={onDataTransferChange}
    />,
  );

  selectFiles(screen, [
    createFile('sequence.fa'),
    createFile('metadata.csv', 'id,name', 'text/csv'),
  ]);

  await expect.element(screen.getByText('Selected files: 2')).toBeVisible();
  await expect.element(screen.getByText('sequence.fa')).toBeVisible();
  await expect.element(screen.getByText('metadata.csv')).toBeVisible();
  await expect.poll(() => changes.length).toBe(1);
  expect(Array.from(changes[0].files).map(file => file.name)).toEqual(['sequence.fa', 'metadata.csv']);
});

it('keeps existing files and reports invalid types, then clears the error on valid input', async () => {
  const { changes, onDataTransferChange } = createChangeTracker();
  const initialDataTransfer = createDataTransfer(createFile('existing.fa'));
  const screen = await renderComponent(
    <MultiFileUploader
      accept={'.fa'}
      initialDataTransfer={initialDataTransfer}
      numFilesAllowed={2}
      onDataTransferChange={onDataTransferChange}
    />,
  );

  selectFiles(screen, [
    createFile('valid.fa'),
    createFile('invalid.txt', 'text', 'text/plain'),
  ]);

  await expect.element(screen.getByText(/Invalid file type/)).toBeVisible();
  await expect.element(screen.getByText('Selected files: 1')).toBeVisible();
  await expect.element(screen.getByText('existing.fa')).toBeVisible();
  expect(changes).toHaveLength(0);

  selectFiles(screen, [createFile('replacement.fa')]);

  await expect.element(screen.getByText(/Invalid file type/)).not.toBeInTheDocument();
  await expect.element(screen.getByText('Selected files: 2')).toBeVisible();
  await expect.poll(() => changes.length).toBe(1);
});

it('rejects additions that exceed the maximum after same-name replacements', async () => {
  const { changes, onDataTransferChange } = createChangeTracker();
  const initialDataTransfer = createDataTransfer(createFile('sample.fa', 'old'));
  const screen = await renderComponent(
    <MultiFileUploader
      accept={'.fa'}
      initialDataTransfer={initialDataTransfer}
      numFilesAllowed={1}
      onDataTransferChange={onDataTransferChange}
    />,
  );

  selectFiles(screen, [
    createFile('sample.fa', 'new one'),
    createFile('sample.fa', 'new two'),
  ]);

  await expect.element(screen.getByText(/Too many files selected/)).toBeVisible();
  await expect.element(screen.getByText('Selected files: 1')).toBeVisible();
  await expect.element(screen.getByText('sample.fa')).toBeVisible();
  expect(changes).toHaveLength(0);
});

it('replaces an existing same-name file when the resulting count is allowed', async () => {
  const { changes, onDataTransferChange } = createChangeTracker();
  const initialDataTransfer = createDataTransfer(createFile('sample.fa', 'old'));
  const screen = await renderComponent(
    <MultiFileUploader
      accept={'.fa'}
      initialDataTransfer={initialDataTransfer}
      numFilesAllowed={1}
      onDataTransferChange={onDataTransferChange}
    />,
  );

  selectFiles(screen, [createFile('sample.fa', 'new content')]);

  await expect.element(screen.getByText('Selected files: 1')).toBeVisible();
  await expect.poll(() => changes.length).toBe(1);
  expect(changes[0].files).toHaveLength(1);
  expect(changes[0].files[0].size).toBe('new content'.length);
});

it('does not change selected files when the input selection is empty or null', async () => {
  const { changes, onDataTransferChange } = createChangeTracker();
  const initialDataTransfer = createDataTransfer(createFile('existing.fa'));
  const screen = await renderComponent(
    <MultiFileUploader
      accept={'.fa'}
      initialDataTransfer={initialDataTransfer}
      onDataTransferChange={onDataTransferChange}
    />,
  );

  selectFiles(screen, []);
  selectFiles(screen, null);

  await expect.element(screen.getByText('Selected files: 1')).toBeVisible();
  await expect.element(screen.getByText('existing.fa')).toBeVisible();
  expect(changes).toHaveLength(0);
});

it('adds dropped files and restores the upload label', async () => {
  const { changes, onDataTransferChange } = createChangeTracker();
  const screen = await renderComponent(
    <MultiFileUploader
      accept={'.fa'}
      onDataTransferChange={onDataTransferChange}
    />,
  );
  const uploadLabel = getUploadLabel(screen);
  let dropBubbled = false;
  screen.baseElement.addEventListener('drop', () => {
    dropBubbled = true;
  });

  dispatchDragEvent(uploadLabel, 'dragenter');
  await expect.element(screen.getByText('Drop file here')).toBeVisible();
  const dropEvent = dispatchDragEvent(
    uploadLabel,
    'drop',
    createDataTransfer(createFile('dropped.fa')),
  );

  expect(dropEvent.defaultPrevented).toBe(true);
  expect(dropBubbled).toBe(false);
  await expect.element(screen.getByText('Click or drag to upload file (.fa)')).toBeVisible();
  await expect.element(screen.getByText('Selected files: 1')).toBeVisible();
  await expect.poll(() => changes.length).toBe(1);
  expect(changes[0].files[0].name).toBe('dropped.fa');
});

it('clears all selected files', async () => {
  const { changes, onDataTransferChange } = createChangeTracker();
  const initialDataTransfer = createDataTransfer(
    createFile('first.fa'),
    createFile('second.fa'),
  );
  const screen = await renderComponent(
    <MultiFileUploader
      accept={'.fa'}
      initialDataTransfer={initialDataTransfer}
      numFilesAllowed={2}
      onDataTransferChange={onDataTransferChange}
    />,
  );

  await screen.getByRole('button', { name: 'Clear all selected files' }).click();

  await expect.element(screen.getByRole('button', { name: 'Clear all selected files' }))
    .not.toBeInTheDocument();
  await expect.poll(() => changes.length).toBe(1);
  expect(changes[0].files).toHaveLength(0);
});

it('removes files by click and keyboard while ignoring other keys', async () => {
  const { changes, onDataTransferChange } = createChangeTracker();
  const initialDataTransfer = createDataTransfer(
    createFile('first.fa'),
    createFile('second.fa'),
    createFile('third.fa'),
  );
  const screen = await renderComponent(
    <MultiFileUploader
      accept={'.fa'}
      initialDataTransfer={initialDataTransfer}
      numFilesAllowed={3}
      onDataTransferChange={onDataTransferChange}
    />,
  );

  getRequiredElement<SVGElement>(screen.baseElement, 'svg[aria-label="Clear first.fa"]')
    .dispatchEvent(new MouseEvent('click', { bubbles: true }));
  await expect.element(screen.getByText('Selected files: 2')).toBeVisible();

  const secondFileDeleteIcon = getRequiredElement<SVGElement>(
    screen.baseElement,
    'svg[aria-label="Clear second.fa"]',
  );
  secondFileDeleteIcon.dispatchEvent(new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key: 'Enter',
  }));
  await expect.element(screen.getByText('Selected files: 1')).toBeVisible();

  const thirdFileDeleteIcon = getRequiredElement<SVGElement>(
    screen.baseElement,
    'svg[aria-label="Clear third.fa"]',
  );
  thirdFileDeleteIcon.dispatchEvent(new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key: 'ArrowDown',
  }));
  await expect.element(screen.getByText('Selected files: 1')).toBeVisible();
  thirdFileDeleteIcon.dispatchEvent(new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key: ' ',
  }));

  await expect.element(screen.getByRole('button', { name: 'Clear all selected files' }))
    .not.toBeInTheDocument();
  await expect.poll(() => changes.length).toBe(3);
  expect(changes[2].files).toHaveLength(0);
});
