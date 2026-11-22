import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  createMemoryRouter,
  RouterProvider,
} from 'react-router-dom';
import { container } from 'tsyringe';
import { userEvent } from 'vitest/browser';
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';
import { TestIdUtil } from '@gen-epix/ui-core/utils/TestIdUtil';

import type {
  ConfigBase,
  FooterConfig,
} from '../../models/config.models';
import { mockApiRequest } from '../../test/requests/mockApi';
import { renderComponent } from '../../test/lib';

import { AcceptInvitationPage } from './AcceptInvitationPage';

const APPLICATION_NAME = 'Test Application';
const TOKEN = 'invitation-token';
const REGISTRATION_PATH = `/v1/user_registrations/${TOKEN}`;
const INVITATION_TEXT = `You have been invited to join ${APPLICATION_NAME}.`;
const REGISTERED_TEXT = `You have been successfully registered to ${APPLICATION_NAME}.`;
const COMPLETE_REGISTRATION_BUTTON = 'Complete registration';
const HOME_PAGE_BUTTON = 'Click here to visit the home page';
const GENERIC_ERROR_TEXT = 'Sorry, an unexpected error has occurred.';

const FOOTER_CONFIG: FooterConfig = {
  sections: [],
};

const ApplicationHeaderStub = () => (
  <div {...TestIdUtil.createAttributes('ApplicationHeaderStub')}>
    {'Application header'}
  </div>
);

const registerWindowServiceStub = () => {
  const fakeWindow = {
    document: globalThis.document,
    location: { href: '' },
  } as unknown as Window;
  const realWindowService = container.resolve(WindowService);
  container.registerInstance(WindowService, Object.create(realWindowService, {
    window: { value: fakeWindow },
  }) as WindowService);
  return fakeWindow;
};

const renderAcceptInvitationPage = async () => {
  const router = createMemoryRouter(
    [
      {
        element: <AcceptInvitationPage />,
        handle: {
          requiredPermissions: [],
          requiresUserProfile: false,
          title: 'Invitation',
        },
        path: '/accept-invitation/:token',
      },
    ],
    { initialEntries: [`/accept-invitation/${TOKEN}`] },
  );

  return renderComponent(
    <RouterProvider router={router} />,
    {
      configure: (config: ConfigBase) => {
        config.ApplicationHeader = ApplicationHeaderStub;
        config.applicationName = APPLICATION_NAME;
        config.createFooter = () => FOOTER_CONFIG;
        config.enablePageEvents = false;
      },
    },
  );
};

describe('AcceptInvitationPage', () => {
  it('shows the invitation with a button to complete the registration', async () => {
    const screen = await renderAcceptInvitationPage();

    await expect.element(screen.getByText(INVITATION_TEXT)).toBeVisible();
    await expect.element(screen.getByRole('button', { name: COMPLETE_REGISTRATION_BUTTON })).toBeVisible();
    await expect.element(screen.getByText(REGISTERED_TEXT)).not.toBeInTheDocument();
  });

  it('registers the user with the invitation token and shows the success view', async () => {
    const requestedPaths: string[] = [];
    mockApiRequest('POST', REGISTRATION_PATH, (request) => {
      requestedPaths.push(new URL(request.url).pathname);
      return Response.json({ id: 'user-1' });
    });
    const screen = await renderAcceptInvitationPage();

    await userEvent.click(screen.getByRole('button', { name: COMPLETE_REGISTRATION_BUTTON }));

    await expect.element(screen.getByText(REGISTERED_TEXT)).toBeVisible();
    await expect.element(screen.getByRole('button', { name: HOME_PAGE_BUTTON })).toBeVisible();
    await expect.element(screen.getByText(INVITATION_TEXT)).not.toBeInTheDocument();
    expect(requestedPaths).toEqual([REGISTRATION_PATH]);
  });

  it('navigates to the home page from the success view', async () => {
    mockApiRequest('POST', REGISTRATION_PATH, () => Response.json({ id: 'user-1' }));
    const fakeWindow = registerWindowServiceStub();
    const screen = await renderAcceptInvitationPage();

    await userEvent.click(screen.getByRole('button', { name: COMPLETE_REGISTRATION_BUTTON }));
    await expect.element(screen.getByRole('button', { name: HOME_PAGE_BUTTON })).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: HOME_PAGE_BUTTON }));

    expect(fakeWindow.location.href).toBe('/');
  });

  it('shows an error when the registration request fails', async () => {
    mockApiRequest('POST', REGISTRATION_PATH, () => Response.json({ detail: 'Invalid token' }, { status: 500 }));
    const screen = await renderAcceptInvitationPage();

    await userEvent.click(screen.getByRole('button', { name: COMPLETE_REGISTRATION_BUTTON }));

    await expect.element(screen.getByText(GENERIC_ERROR_TEXT)).toBeVisible();
    await expect.element(screen.getByRole('button', { name: HOME_PAGE_BUTTON })).not.toBeInTheDocument();
  });
});
