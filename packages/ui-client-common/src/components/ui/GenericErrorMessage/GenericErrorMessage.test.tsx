import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { container } from 'tsyringe';
import { AxiosError } from 'axios';
import type {
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import type { AuthContextProps } from 'react-oidc-context';

import { AuthenticationService } from '../../../classes/services/AuthenticationService';
import { PageEventBusService } from '../../../classes/services/PageEventBusService';
import { RouterService } from '../../../classes/services/RouterService';
import type { ConfigBase } from '../../../models/config.models';
import { renderComponent } from '../../../test/lib';

import { GenericErrorMessage } from './GenericErrorMessage';

const createAxiosError = (status: number, message = 'Request failed'): AxiosError => {
  const response = {
    config: {} as InternalAxiosRequestConfig,
    data: {},
    headers: {},
    status,
    statusText: '',
  } as AxiosResponse;
  return new AxiosError(message, 'ERR_BAD_REQUEST', undefined, undefined, response);
};

const createRouteErrorResponse = () => ({
  data: 'Missing',
  internal: false,
  status: 404,
  statusText: 'Not Found',
});

const routerService = new RouterService({
  adminRoutes: [],
  homePageComponent: () => <div />,
  routes: [
    { element: <div />, path: '/' },
    { element: <div />, path: '/start' },
    { element: <div />, path: '/error-page' },
  ],
});

const navigateToErrorPage = async () => {
  await routerService.router.navigate('/start');
  await routerService.router.navigate('/error-page');
};

describe('GenericErrorMessage', () => {
  afterEach(() => {
    container.resolve(AuthenticationService).authContextProps = undefined;
    sessionStorage.clear();
  });

  it('renders the generic title, the error message and the details for a generic error', async () => {
    container.registerInstance(RouterService, routerService);

    const screen = await renderComponent(
      <GenericErrorMessage error={new Error('Something broke')} />,
    );

    await expect.element(screen.getByRole('heading', { level: 1, name: 'Sorry, an unexpected error has occurred.' })).toBeVisible();
    await expect.element(screen.getByText(/Error message: Something broke$/)).toBeVisible();
    await expect.element(screen.getByRole('heading', { name: 'Details for our technicians' })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Logout' })).toBeVisible();
  });

  it('renders the not found title and message for a route error response', async () => {
    const screen = await renderComponent(
      <GenericErrorMessage error={createRouteErrorResponse()} />,
    );

    await expect.element(screen.getByRole('heading', { level: 1, name: 'Not found.' })).toBeVisible();
    await expect.element(screen.getByText('The item you requested can not be found. It may have been moved or deleted.')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Details for our technicians' }).query()).toBeNull();
  });

  it('renders the not found title and message for an axios not found error', async () => {
    const screen = await renderComponent(
      <GenericErrorMessage error={createAxiosError(404)} />,
    );

    await expect.element(screen.getByRole('heading', { level: 1, name: 'Not found.' })).toBeVisible();
    await expect.element(screen.getByText('The item you requested can not be found. It may have been moved or deleted.')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Details for our technicians' }).query()).toBeNull();
  });

  it('renders the access denied title and message for an axios forbidden error', async () => {
    const screen = await renderComponent(
      <GenericErrorMessage error={createAxiosError(403)} />,
    );

    await expect.element(screen.getByRole('heading', { level: 1, name: 'Access denied.' })).toBeVisible();
    await expect.element(screen.getByText('You are not authorized to access this page or item.', { exact: true })).toBeVisible();
  });

  it('renders the login again message for an axios unauthorized error', async () => {
    const screen = await renderComponent(
      <GenericErrorMessage error={createAxiosError(401)} />,
    );

    await expect.element(screen.getByRole('heading', { level: 1, name: 'Sorry, an unexpected error has occurred.' })).toBeVisible();
    await expect.element(screen.getByText('You are not authorized to access this page or item. Please logout and login again.')).toBeVisible();
  });

  it('renders the unprocessable title and message for an axios unprocessable entity error', async () => {
    const screen = await renderComponent(
      <GenericErrorMessage error={createAxiosError(422)} />,
    );

    await expect.element(screen.getByRole('heading', { level: 1, name: 'Unprocessable Entity.' })).toBeVisible();
    await expect.element(screen.getByText('We were unable to process this page or item.')).toBeVisible();
  });

  it('renders unknown as the error message when no error is provided', async () => {
    const screen = await renderComponent(
      <GenericErrorMessage />,
    );

    await expect.element(screen.getByText(/Error message: Unknown$/)).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Details for our technicians' }).query()).toBeNull();
  });

  it('renders unknown as the error message for a value without a message or stack', async () => {
    const screen = await renderComponent(
      <GenericErrorMessage error={{ code: 'UNKNOWN' }} />,
    );

    await expect.element(screen.getByText(/Error message: Unknown$/)).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Details for our technicians' }).query()).toBeNull();
  });

  it('hides the action buttons when shouldHideActionButtons is set', async () => {
    const screen = await renderComponent(
      <GenericErrorMessage
        error={new Error('Hidden actions')}
        shouldHideActionButtons
      />,
    );

    await expect.element(screen.getByText(/Error message: Hidden actions$/)).toBeVisible();
    expect(document.querySelector('button')).toBeNull();
  });

  it('emits an error page event for an Error when page events are enabled', async () => {
    const error = new Error('Page event error');
    const errorListener = vi.fn();
    const removeListener = container.resolve(PageEventBusService).addEventListener('error', errorListener);

    try {
      await renderComponent(
        <GenericErrorMessage error={error} />,
        {
          configure: (config: ConfigBase) => {
            config.enablePageEvents = true;
          },
        },
      );

      expect(errorListener).toHaveBeenCalledExactlyOnceWith(error);
    } finally {
      removeListener();
    }
  });

  it('does not emit an error page event when page events are disabled', async () => {
    const errorListener = vi.fn();
    const removeListener = container.resolve(PageEventBusService).addEventListener('error', errorListener);

    try {
      await renderComponent(
        <GenericErrorMessage error={new Error('Silent error')} />,
        {
          configure: (config: ConfigBase) => {
            config.enablePageEvents = false;
          },
        },
      );

      expect(errorListener).not.toHaveBeenCalled();
    } finally {
      removeListener();
    }
  });

  it('does not emit an error page event for a value that is not an Error', async () => {
    const errorListener = vi.fn();
    const removeListener = container.resolve(PageEventBusService).addEventListener('error', errorListener);

    try {
      await renderComponent(
        <GenericErrorMessage error={{ code: 'NOT_AN_ERROR' }} />,
        {
          configure: (config: ConfigBase) => {
            config.enablePageEvents = true;
          },
        },
      );

      expect(errorListener).not.toHaveBeenCalled();
    } finally {
      removeListener();
    }
  });

  it('navigates to the homepage when go back to homepage is clicked', async () => {
    container.registerInstance(RouterService, routerService);
    await navigateToErrorPage();

    const screen = await renderComponent(
      <GenericErrorMessage error={new Error('Navigate home')} />,
    );

    await screen.getByRole('button', { name: 'Go back to homepage' }).click();

    await expect.poll(() => routerService.router.state.location.pathname).toBe('/');
  });

  it('navigates back in history when go back is clicked', async () => {
    container.registerInstance(RouterService, routerService);
    await navigateToErrorPage();

    const screen = await renderComponent(
      <GenericErrorMessage error={new Error('Navigate back')} />,
    );

    await screen.getByRole('button', { name: 'Go back' }).click();

    await expect.poll(() => routerService.router.state.location.pathname).toBe('/start');
    await routerService.router.navigate('/');
  });

  it('clears stale OIDC session state and navigates to the homepage on logout without an auth context', async () => {
    container.registerInstance(RouterService, routerService);
    await navigateToErrorPage();
    sessionStorage.setItem('oidc.stale-state', 'stale');

    const screen = await renderComponent(
      <GenericErrorMessage error={new Error('Logout without auth')} />,
    );

    await screen.getByRole('button', { name: 'Logout' }).click();

    await expect.poll(() => routerService.router.state.location.pathname).toBe('/');
    expect(sessionStorage.getItem('oidc.stale-state')).toBeNull();
  });

  it('starts the OIDC signout redirect on logout when an auth context is available', async () => {
    container.registerInstance(RouterService, routerService);
    const signoutRedirect = vi.fn();
    container.resolve(AuthenticationService).authContextProps = { signoutRedirect } as unknown as AuthContextProps;
    sessionStorage.setItem('oidc.stale-state', 'stale');

    const screen = await renderComponent(
      <GenericErrorMessage error={new Error('Logout with auth')} />,
    );

    await screen.getByRole('button', { name: 'Logout' }).click();

    await expect.poll(() => signoutRedirect).toHaveBeenCalledOnce();
    expect(sessionStorage.getItem('oidc.stale-state')).toBeNull();
  });
});
