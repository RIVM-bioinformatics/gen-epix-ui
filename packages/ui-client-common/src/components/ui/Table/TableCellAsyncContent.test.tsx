import {
  describe,
  expect,
  it,
} from 'vitest';
import { page } from 'vitest/browser';

import { renderComponent } from '../../../test/lib';

import { TableCellAsyncContent } from './TableCellAsyncContent';

const createDeferredText = () => {
  let resolveText: (value: string) => void = () => undefined;
  const promise = new Promise<string>((resolve) => {
    resolveText = resolve;
  });
  return { promise, resolve: (value: string) => resolveText(value) };
};

const waitForReactToFlush = async () => new Promise<void>((resolve) => {
  setTimeout(resolve, 100);
});

describe('TableCellAsyncContent', () => {
  it('should render nothing while a promise is pending', async () => {
    const deferred = createDeferredText();
    const screen = await renderComponent(
      <TableCellAsyncContent content={deferred.promise} />,
    );

    expect(screen.container.textContent).toBe('');
  });

  it('should render string content', async () => {
    await renderComponent(
      <TableCellAsyncContent content={'Plain text'} />,
    );

    await expect.element(page.getByText('Plain text', { exact: true })).toBeVisible();
  });

  it('should render the resolved value of a promise', async () => {
    const deferred = createDeferredText();
    await renderComponent(
      <TableCellAsyncContent content={deferred.promise} />,
    );

    deferred.resolve('Resolved text');

    await expect.element(page.getByText('Resolved text', { exact: true })).toBeVisible();
  });

  it('should render the new content when the content prop changes to a string', async () => {
    const screen = await renderComponent(
      <TableCellAsyncContent content={'First'} />,
    );

    await screen.rerender(
      <TableCellAsyncContent content={'Second'} />,
    );

    await expect.element(page.getByText('Second', { exact: true })).toBeVisible();
  });

  it('should render the content of the latest promise when an older promise resolves later', async () => {
    const olderDeferred = createDeferredText();
    const newerDeferred = createDeferredText();
    const screen = await renderComponent(
      <TableCellAsyncContent content={olderDeferred.promise} />,
    );

    await screen.rerender(
      <TableCellAsyncContent content={newerDeferred.promise} />,
    );
    newerDeferred.resolve('Newer text');
    await expect.element(page.getByText('Newer text', { exact: true })).toBeVisible();

    olderDeferred.resolve('Older text');
    await waitForReactToFlush();

    expect(screen.container.textContent).toBe('Newer text');
  });
});
