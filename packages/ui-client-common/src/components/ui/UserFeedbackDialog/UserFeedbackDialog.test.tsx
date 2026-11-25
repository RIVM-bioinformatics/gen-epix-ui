import { createRef } from 'react';
import { container } from 'tsyringe';
import type { AuthContextProps } from 'react-oidc-context';
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { AuthenticationService } from '../../../classes/services/AuthenticationService';
import { AuthorizationService } from '../../../classes/services/AuthorizationService';
import { NavigationHistoryService } from '../../../classes/services/NavigationHistoryService';
import { NotificationService } from '../../../classes/services/NotificationService';
import { UserSettingsService } from '../../../classes/services/UserSettingsService';
import {
  mockApiRequest,
  renderComponent,
} from '../../../test/lib';

import { UserFeedbackDialog } from './UserFeedbackDialog';
import type { UserFeedbackDialogRefMethods } from './UserFeedbackDialog';

type CapturedLogRequestBody = {
  log_items: {
    detail: string;
    level: string;
    topic: string;
  }[];
};

const USER = {
  email: 'user@example.com',
  id: '00000000-0000-4000-8000-000000000010',
  key: 'example.user',
  name: 'Example user',
  organization_id: '00000000-0000-4000-8000-000000000001',
  roles: ['reader'],
};

const FEEDBACK_MESSAGE = 'The dashboard is very helpful';
const THANK_YOU_MESSAGE = 'Thank you for sharing your feedback with us';

const createAuth = (): AuthContextProps => ({
  isAuthenticated: true,
  signoutRedirect: vi.fn(async () => Promise.resolve()),
  user: undefined,
}) as unknown as AuthContextProps;

const renderDialog = async () => {
  const ref = createRef<UserFeedbackDialogRefMethods>();
  const screen = await renderComponent(
    <UserFeedbackDialog ref={ref} />,
  );
  ref.current?.open({});
  return screen;
};

const captureLogRequests = (): CapturedLogRequestBody[] => {
  const requests: CapturedLogRequestBody[] = [];
  mockApiRequest('POST', '/v1/log', async (request) => {
    requests.push(await request.json() as CapturedLogRequestBody);
    return Response.json({});
  });
  return requests;
};

const getFeedbackLogItem = (requests: CapturedLogRequestBody[]) => {
  const logItem = requests[0]?.log_items[0];
  if (!logItem) {
    throw new Error('No feedback log item was sent');
  }
  return {
    ...logItem,
    detail: JSON.parse(logItem.detail) as Record<string, unknown>,
  };
};

const setNavigationHistory = (entries: string[]) => {
  const navigationHistory = container.resolve(NavigationHistoryService).navigationHistory;
  navigationHistory.splice(0, navigationHistory.length, ...entries);
};

describe('UserFeedbackDialog', () => {
  beforeEach(() => {
    container.resolve(AuthorizationService).user = USER;
    container.resolve(AuthenticationService).authContextProps = createAuth();
    setNavigationHistory([]);
  });

  it('renders the title, intro text and the form fields', async () => {
    const screen = await renderDialog();

    await expect.element(screen.getByRole('heading', { name: 'Feedback' })).toBeVisible();
    await expect.element(screen.getByText('Please help make', { exact: false })).toBeVisible();
    await expect.element(screen.getByRole('textbox', { name: 'Name' })).toBeVisible();
    await expect.element(screen.getByRole('textbox', { name: 'Email' })).toBeVisible();
    await expect.element(screen.getByRole('textbox', { name: 'Your message' })).toBeVisible();
  });

  it('prefills the name and email from the current user', async () => {
    const screen = await renderDialog();

    await expect.element(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Example user');
    await expect.element(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('user@example.com');
  });

  it('falls back to the user key as email and to empty values when no user is known', async () => {
    container.resolve(AuthorizationService).user = { ...USER, email: undefined, name: undefined };
    const screen = await renderDialog();

    await expect.element(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('example.user');
    await expect.element(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('');
  });

  it('renders empty values when there is no current user at all', async () => {
    container.resolve(AuthorizationService).user = undefined;
    const screen = await renderDialog();

    await expect.element(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('');
    await expect.element(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('');
  });

  it('hides the feedback tooltip once the dialog is rendered', async () => {
    const userSettingsService = container.resolve(UserSettingsService);
    userSettingsService.showShowUserFeedbackTooltip = true;

    await renderDialog();

    await vi.waitFor(() => {
      expect(userSettingsService.showShowUserFeedbackTooltip).toBe(false);
    });
  });

  it('closes the dialog when Cancel is clicked without sending feedback', async () => {
    const requests = captureLogRequests();
    const screen = await renderDialog();

    await screen.getByTestId('UserFeedbackDialog-close').click();

    await expect.element(screen.getByRole('heading', { name: 'Feedback' })).not.toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });

  it('does not send feedback when required fields are invalid', async () => {
    const requests = captureLogRequests();
    const screen = await renderDialog();

    await screen.getByRole('textbox', { name: 'Email' }).fill('not-an-email');
    await screen.getByTestId('UserFeedbackDialog-send').click();

    await expect.element(screen.getByRole('textbox', { name: 'Email' })).toHaveAttribute('aria-invalid', 'true');
    await expect.element(screen.getByRole('textbox', { name: 'Your message' })).toHaveAttribute('aria-invalid', 'true');
    expect(requests).toHaveLength(0);
    expect(container.resolve(NotificationService).data.some(notification => notification.message === THANK_YOU_MESSAGE)).toBe(false);
  });

  it('sends the feedback with the navigation history, shows a notification and closes the dialog', async () => {
    const requests = captureLogRequests();
    setNavigationHistory(Array.from({ length: 60 }, (_, index) => `/page/${index}`));
    const screen = await renderDialog();

    await screen.getByRole('textbox', { name: 'Your message' }).fill(FEEDBACK_MESSAGE);
    await screen.getByTestId('UserFeedbackDialog-send').click();

    await vi.waitFor(() => {
      expect(requests).toHaveLength(1);
    });
    const logItem = getFeedbackLogItem(requests);
    expect(logItem.topic).toBe('USER_FEEDBACK');
    expect(logItem.level).toBe('INFO');
    expect(logItem.detail).toMatchObject({
      email: 'user@example.com',
      message: FEEDBACK_MESSAGE,
      name: 'Example user',
    });
    const navigationHistory = logItem.detail.navigationHistory as string[];
    expect(navigationHistory).toHaveLength(50);
    expect(navigationHistory[0]).toBe('/page/59');
    expect(navigationHistory[49]).toBe('/page/10');
    expect(container.resolve(NotificationService).data.some(notification => notification.message === THANK_YOU_MESSAGE && notification.severity === 'success')).toBe(true);
    await expect.element(screen.getByRole('heading', { name: 'Feedback' })).not.toBeInTheDocument();
  });

  it('sends the full navigation history when it holds fewer than 50 entries', async () => {
    const requests = captureLogRequests();
    setNavigationHistory(['/first', '/second']);
    const screen = await renderDialog();

    await screen.getByRole('textbox', { name: 'Your message' }).fill(FEEDBACK_MESSAGE);
    await screen.getByTestId('UserFeedbackDialog-send').click();

    await vi.waitFor(() => {
      expect(requests).toHaveLength(1);
    });
    expect(getFeedbackLogItem(requests).detail.navigationHistory).toEqual(['/second', '/first']);
  });
});
