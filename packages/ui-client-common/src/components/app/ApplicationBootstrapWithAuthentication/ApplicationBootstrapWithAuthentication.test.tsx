import {
  describe,
  expect,
  it,
} from 'vitest';
import { subHours } from 'date-fns';
import type { CommonDbOutage } from '@gen-epix/api-commondb';

import {
  mockApiRequest,
  registerWindowServiceReloadSpy,
  renderComponent,
} from '../../../test/lib';

import { ApplicationBootstrapWithAuthentication } from './ApplicationBootstrapWithAuthentication';

const BUTTON_ENABLE_TIMEOUT_MS = 10_000;

const createOutage = (overrides: Partial<CommonDbOutage>): CommonDbOutage => ({
  active_from: null,
  active_to: null,
  description: 'Planned maintenance',
  id: 'outage-1',
  is_active: false,
  is_visible: false,
  visible_from: null,
  visible_to: null,
  ...overrides,
});

const ACTIVE_OUTAGE = createOutage({
  active_from: subHours(new Date(), 1).toISOString(),
  active_to: subHours(new Date(), -24).toISOString(),
  id: 'active-outage',
  is_active: true,
});

const PAST_OUTAGE = createOutage({
  active_from: subHours(new Date(), 48).toISOString(),
  active_to: subHours(new Date(), 24).toISOString(),
  id: 'past-outage',
});

describe('ApplicationBootstrapWithAuthentication', () => {
  it('renders children when there are no outages', async () => {
    mockApiRequest('GET', '/v1/retrieve/outages', () => Response.json([]));

    const screen = await renderComponent(
      <ApplicationBootstrapWithAuthentication>
        <div>
          {'Application content'}
        </div>
      </ApplicationBootstrapWithAuthentication>,
    );

    await expect.element(screen.getByText('Application content')).toBeInTheDocument();
    await expect.element(screen.getByTestId('OutagePage')).not.toBeInTheDocument();
  });

  it('renders children when no outage is currently active', async () => {
    mockApiRequest('GET', '/v1/retrieve/outages', () => Response.json([PAST_OUTAGE]));

    const screen = await renderComponent(
      <ApplicationBootstrapWithAuthentication>
        <div>
          {'Application content'}
        </div>
      </ApplicationBootstrapWithAuthentication>,
    );

    await expect.element(screen.getByText('Application content')).toBeInTheDocument();
    await expect.element(screen.getByTestId('OutagePage')).not.toBeInTheDocument();
  });

  it('shows the outage page with disabled buttons until the enable delay has passed', async () => {
    mockApiRequest('GET', '/v1/retrieve/outages', () => Response.json([ACTIVE_OUTAGE]));

    const screen = await renderComponent(
      <ApplicationBootstrapWithAuthentication>
        <div>
          {'Application content'}
        </div>
      </ApplicationBootstrapWithAuthentication>,
    );

    await expect.element(screen.getByTestId('OutagePage')).toBeInTheDocument();
    await expect.element(screen.getByText('Application content')).not.toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: 'Continue anyway' })).toBeDisabled();
    await expect.element(screen.getByRole('button', { name: 'Retry' })).toBeDisabled();
    await expect.element(screen.getByRole('button', { name: 'Continue anyway' }), { timeout: BUTTON_ENABLE_TIMEOUT_MS }).toBeEnabled();
    await expect.element(screen.getByRole('button', { name: 'Retry' })).toBeEnabled();
  });

  it('renders children after the user chooses to continue anyway', async () => {
    mockApiRequest('GET', '/v1/retrieve/outages', () => Response.json([ACTIVE_OUTAGE]));

    const screen = await renderComponent(
      <ApplicationBootstrapWithAuthentication>
        <div>
          {'Application content'}
        </div>
      </ApplicationBootstrapWithAuthentication>,
    );

    await expect.element(screen.getByRole('button', { name: 'Continue anyway' }), { timeout: BUTTON_ENABLE_TIMEOUT_MS }).toBeEnabled();
    await screen.getByRole('button', { name: 'Continue anyway' }).click();

    await expect.element(screen.getByText('Application content')).toBeInTheDocument();
    await expect.element(screen.getByTestId('OutagePage')).not.toBeInTheDocument();
  });

  it('reloads the application when the user retries', async () => {
    mockApiRequest('GET', '/v1/retrieve/outages', () => Response.json([ACTIVE_OUTAGE]));
    const reload = registerWindowServiceReloadSpy();

    const screen = await renderComponent(
      <ApplicationBootstrapWithAuthentication>
        <div>
          {'Application content'}
        </div>
      </ApplicationBootstrapWithAuthentication>,
    );

    await expect.element(screen.getByRole('button', { name: 'Retry' }), { timeout: BUTTON_ENABLE_TIMEOUT_MS }).toBeEnabled();
    await screen.getByRole('button', { name: 'Retry' }).click();

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('shows the loading page while the outages are being fetched', async () => {
    let resolveRequest: () => void = () => undefined;
    const requestCompleted = new Promise<void>((resolve) => {
      resolveRequest = resolve;
    });
    mockApiRequest('GET', '/v1/retrieve/outages', async () => {
      await requestCompleted;
      return Response.json([]);
    });

    const screen = await renderComponent(
      <ApplicationBootstrapWithAuthentication>
        <div>
          {'Application content'}
        </div>
      </ApplicationBootstrapWithAuthentication>,
    );

    await expect.element(screen.getByTestId('OutagesLoadingPage')).toBeInTheDocument();
    await expect.element(screen.getByText('Application content')).not.toBeInTheDocument();

    resolveRequest();

    await expect.element(screen.getByText('Application content')).toBeInTheDocument();
  });

  it('shows the loading page and not the children when fetching the outages fails', async () => {
    mockApiRequest('GET', '/v1/retrieve/outages', () => new Response(null, { status: 500 }));

    const screen = await renderComponent(
      <ApplicationBootstrapWithAuthentication>
        <div>
          {'Application content'}
        </div>
      </ApplicationBootstrapWithAuthentication>,
    );

    await expect.element(screen.getByTestId('OutagesLoadingPage')).toBeInTheDocument();
    await expect.element(screen.getByText('Application content')).not.toBeInTheDocument();
  });
});
