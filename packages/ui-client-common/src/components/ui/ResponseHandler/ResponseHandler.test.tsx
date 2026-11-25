import {
  describe,
  expect,
  it,
} from 'vitest';

import type { Loadable } from '../../../models/data-hooks.models';
import { renderComponent } from '../../../test/lib';

import { ResponseHandler } from './ResponseHandler';
import type { ResponseHandlerProps } from './ResponseHandler';

const CHILD_TEXT = 'Child content';

const createLoadable = (overrides: Partial<Loadable> = {}): Loadable => ({
  error: undefined,
  isEnabled: true,
  isFetching: false,
  isLoading: false,
  isPending: false,
  ...overrides,
});

const renderResponseHandler = async (props: Partial<ResponseHandlerProps> = {}) => renderComponent(
  <ResponseHandler {...props}>
    <p>
      {CHILD_TEXT}
    </p>
  </ResponseHandler>,
);

describe('ResponseHandler', () => {
  it('renders children without loading or error handling when disabled', async () => {
    const screen = await renderResponseHandler({
      enabled: false,
      error: new Error('Ignored error'),
      isLoading: true,
      loadables: [createLoadable({ error: new Error('Ignored loadable error') })],
    });

    await expect.element(screen.getByText(CHILD_TEXT)).toBeVisible();
    expect(document.querySelector('[role="status"]')).toBeNull();
    expect(screen.getByText(/Error message:/).query()).toBeNull();
  });

  it('renders children when loadables are all loaded without error', async () => {
    const screen = await renderResponseHandler({
      loadables: [createLoadable(), createLoadable()],
    });

    await expect.element(screen.getByText(CHILD_TEXT)).toBeVisible();
    expect(document.querySelector('[role="status"]')).toBeNull();
  });

  it('renders the user error and hides children', async () => {
    const screen = await renderResponseHandler({
      error: new Error('User error'),
    });

    await expect.element(screen.getByRole('heading', { level: 1, name: 'Sorry, an unexpected error has occurred.' })).toBeVisible();
    await expect.element(screen.getByText(/Error message: User error$/)).toBeVisible();
    expect(screen.getByText(CHILD_TEXT).query()).toBeNull();
  });

  it('renders the error of a single loadable', async () => {
    const screen = await renderResponseHandler({
      loadables: createLoadable({ error: new Error('Loadable error') }),
    });

    await expect.element(screen.getByText(/Error message: Loadable error$/)).toBeVisible();
    expect(screen.getByText(CHILD_TEXT).query()).toBeNull();
  });

  it('renders the first error when multiple loadables have errors', async () => {
    const screen = await renderResponseHandler({
      loadables: [
        createLoadable(),
        createLoadable({ error: new Error('First error') }),
        createLoadable({ error: new Error('Second error') }),
      ],
    });

    await expect.element(screen.getByText(/Error message: First error$/)).toBeVisible();
    expect(screen.getByText(/Second error/).query()).toBeNull();
  });

  it('prefers the user error over a loadable error', async () => {
    const screen = await renderResponseHandler({
      error: new Error('User error'),
      loadables: [createLoadable({ error: new Error('Loadable error') })],
    });

    await expect.element(screen.getByText(/Error message: User error$/)).toBeVisible();
    expect(screen.getByText(/Loadable error/).query()).toBeNull();
  });

  it('ignores errors of disabled loadables', async () => {
    const screen = await renderResponseHandler({
      loadables: [createLoadable({ error: new Error('Disabled error'), isEnabled: false })],
    });

    await expect.element(screen.getByText(CHILD_TEXT)).toBeVisible();
    expect(screen.getByText(/Disabled error/).query()).toBeNull();
  });

  it('hides the action buttons of the error when shouldHideActionButtons is set', async () => {
    await renderResponseHandler({
      error: new Error('No actions'),
      shouldHideActionButtons: true,
    });

    expect(document.querySelector('button')).toBeNull();
  });

  it('shows the action buttons of the error by default', async () => {
    const screen = await renderResponseHandler({
      error: new Error('With actions'),
    });

    await expect.element(screen.getByRole('button', { name: 'Logout' })).toBeVisible();
  });

  it('renders the default spinner when the user is loading', async () => {
    const screen = await renderResponseHandler({
      isLoading: true,
    });

    await expect.element(screen.getByRole('status')).toBeVisible();
    await expect.element(screen.getByText('Loading')).toBeInTheDocument();
    expect(screen.getByText(CHILD_TEXT).query()).toBeNull();
  });

  it('renders the default spinner when some loadable is loading', async () => {
    const screen = await renderResponseHandler({
      loadables: [createLoadable(), createLoadable({ isLoading: true })],
    });

    await expect.element(screen.getByRole('status')).toBeVisible();
    expect(screen.getByText(CHILD_TEXT).query()).toBeNull();
  });

  it('ignores loading state of disabled loadables', async () => {
    const screen = await renderResponseHandler({
      loadables: [createLoadable({ isEnabled: false, isLoading: true })],
    });

    await expect.element(screen.getByText(CHILD_TEXT)).toBeVisible();
    expect(document.querySelector('[role="status"]')).toBeNull();
  });

  it('renders the loading message as the spinner label', async () => {
    const screen = await renderResponseHandler({
      isLoading: true,
      loadingMessage: 'Fetching data',
    });

    await expect.element(screen.getByText('Fetching data')).toBeVisible();
    expect(screen.getByText('Loading').query()).toBeNull();
  });

  it('renders custom loading content instead of the spinner', async () => {
    const screen = await renderResponseHandler({
      isLoading: true,
      loadingContent: (
        <p>
          {'Custom loading'}
        </p>
      ),
    });

    await expect.element(screen.getByText('Custom loading')).toBeVisible();
    expect(document.querySelector('[role="status"]')).toBeNull();
    expect(screen.getByText(CHILD_TEXT).query()).toBeNull();
  });

  it('renders an inline spinner when inlineSpinner is set', async () => {
    const screen = await renderResponseHandler({
      inlineSpinner: true,
      isLoading: true,
    });

    await expect.element(screen.getByRole('status')).toHaveStyle({ position: 'relative' });
  });

  it('renders an absolutely positioned spinner by default', async () => {
    const screen = await renderResponseHandler({
      isLoading: true,
    });

    await expect.element(screen.getByRole('status')).toHaveStyle({ position: 'absolute' });
  });

  it('applies the spinner size', async () => {
    const screen = await renderResponseHandler({
      isLoading: true,
      spinnerSize: 24,
    });

    await expect.element(screen.getByRole('progressbar')).toHaveStyle({ height: '24px', width: '24px' });
  });

  it('shows the taking longer message after the configured timeout', async () => {
    const screen = await renderResponseHandler({
      isLoading: true,
      takingLongerTimeoutMs: 1,
    });

    await expect.element(screen.getByText('This is taking longer than expected. We are still trying.')).toBeVisible();
  });

  it('renders the error instead of the loading state when both are present', async () => {
    const screen = await renderResponseHandler({
      error: new Error('Error while loading'),
      isLoading: true,
    });

    await expect.element(screen.getByText(/Error message: Error while loading$/)).toBeVisible();
    expect(document.querySelector('[role="status"]')).toBeNull();
    expect(screen.getByText(CHILD_TEXT).query()).toBeNull();
  });

  it('transitions from loading to showing children', async () => {
    const screen = await renderResponseHandler({
      isLoading: true,
    });

    await expect.element(screen.getByRole('status')).toBeVisible();

    await screen.rerender(
      <ResponseHandler>
        <p>
          {CHILD_TEXT}
        </p>
      </ResponseHandler>,
    );

    await expect.element(screen.getByText(CHILD_TEXT)).toBeVisible();
    expect(document.querySelector('[role="status"]')).toBeNull();
  });

  it('transitions from loading to showing an error', async () => {
    const screen = await renderResponseHandler({
      loadables: createLoadable({ isLoading: true }),
    });

    await expect.element(screen.getByRole('status')).toBeVisible();

    await screen.rerender(
      <ResponseHandler loadables={createLoadable({ error: new Error('Late error') })}>
        <p>
          {CHILD_TEXT}
        </p>
      </ResponseHandler>,
    );

    await expect.element(screen.getByText(/Error message: Late error$/)).toBeVisible();
    expect(document.querySelector('[role="status"]')).toBeNull();
  });
});
