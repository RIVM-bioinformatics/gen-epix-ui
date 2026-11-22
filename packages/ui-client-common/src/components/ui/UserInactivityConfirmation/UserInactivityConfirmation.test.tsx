import { container } from 'tsyringe';
import type { AuthContextProps } from 'react-oidc-context';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { AuthenticationService } from '../../../classes/services/AuthenticationService';
import { InactivityService } from '../../../classes/services/InactivityService';
import type { ConfigBase } from '../../../models/config.models';
import {
  mockApiRequest,
  renderComponent,
} from '../../../test/lib';

import { UserInactivityConfirmation } from './UserInactivityConfirmation';

const LONG_NOTIFICATION_TIME_MS = 600000;
const SHORT_ALLOWED_IDLE_TIME_MS = 300;
const LONG_IDLE_WINDOW_FOR_RESET_MS = 1500;
const TITLE = 'Your session is about to expire';
const BODY_START = 'Because you were inactive for the last';
const STAY_LOGGED_IN_LABEL = 'Stay logged in';
const LOGOUT_LABEL = 'Logout';

const createAuth = () => {
  const signoutRedirect = vi.fn(async () => Promise.resolve());
  const auth = {
    isAuthenticated: true,
    signoutRedirect,
    user: undefined,
  } as unknown as AuthContextProps;
  return { auth, signoutRedirect };
};

const configureInactivity = (allowedIdleTimeMs: number, notificationTimeMs: number) => (config: ConfigBase) => {
  config.userInactivityConfirmation = {
    ALLOWED_IDLE_TIME_MS: allowedIdleTimeMs,
    NOTIFICATION_TIME_MS: notificationTimeMs,
  };
};

const renderConfirmation = async (allowedIdleTimeMs: number, notificationTimeMs = LONG_NOTIFICATION_TIME_MS) => renderComponent(
  <UserInactivityConfirmation />,
  { configure: configureInactivity(allowedIdleTimeMs, notificationTimeMs) },
);

describe('UserInactivityConfirmation', () => {
  it('does not show the confirmation while the user is active', async () => {
    const screen = await renderConfirmation(LONG_NOTIFICATION_TIME_MS);

    await expect.element(screen.getByText(TITLE)).not.toBeInTheDocument();
  });

  it('shows the confirmation with the inactivity details once the user is idle', async () => {
    const screen = await renderConfirmation(SHORT_ALLOWED_IDLE_TIME_MS);

    await expect.element(screen.getByText(TITLE)).toBeVisible();
    await expect.element(screen.getByText(BODY_START, { exact: false })).toBeVisible();
    await expect.element(screen.getByText('you will be automatically logged out in', { exact: false })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: LOGOUT_LABEL })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: STAY_LOGGED_IN_LABEL })).toBeVisible();
  });

  it('closes the confirmation and resets the inactivity state when the user stays logged in', async () => {
    const screen = await renderConfirmation(LONG_IDLE_WINDOW_FOR_RESET_MS);
    const inactivityService = container.resolve(InactivityService);

    await expect.element(screen.getByText(TITLE)).toBeVisible();
    await screen.getByRole('button', { name: STAY_LOGGED_IN_LABEL }).click();

    await expect.element(screen.getByText(TITLE)).not.toBeInTheDocument();
    expect(inactivityService.data.isIdle).toBe(false);
  });

  it('logs out and signs out when the user clicks Logout', async () => {
    const logRequests: { log_items: { topic: string }[] }[] = [];
    mockApiRequest('POST', '/v1/log', async (request) => {
      logRequests.push(await request.json() as { log_items: { topic: string }[] });
      return Response.json({});
    });
    const { auth, signoutRedirect } = createAuth();
    container.resolve(AuthenticationService).authContextProps = auth;
    const screen = await renderConfirmation(SHORT_ALLOWED_IDLE_TIME_MS);

    await expect.element(screen.getByText(TITLE)).toBeVisible();
    await screen.getByRole('button', { name: LOGOUT_LABEL }).click();

    await vi.waitFor(() => {
      expect(signoutRedirect).toHaveBeenCalledTimes(1);
    });
    await vi.waitFor(() => {
      expect(logRequests).toHaveLength(1);
    });
    expect(logRequests[0]?.log_items[0]?.topic).toBe('USER_LOGOUT_BY_INACTIVITY');
  });

  it('does not throw when the component is unmounted while the service keeps running', async () => {
    const screen = await renderConfirmation(SHORT_ALLOWED_IDLE_TIME_MS);
    const inactivityService = container.resolve(InactivityService);

    await expect.element(screen.getByText(TITLE)).toBeVisible();
    await screen.unmount();
    inactivityService.reset();

    expect(inactivityService.data.isIdle).toBe(false);
  });
});
