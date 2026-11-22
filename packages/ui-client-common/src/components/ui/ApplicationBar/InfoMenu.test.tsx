import { container } from 'tsyringe';
import type { AxiosResponse } from 'axios';
import type {
  MouseEvent,
  ReactElement,
} from 'react';
import {
  useCallback,
  useState,
} from 'react';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { userEvent } from 'vitest/browser';

import { BackendVersionService } from '../../../classes/services/BackendVersionService';
import {
  mockApiRequest,
  renderComponent,
} from '../../../test/lib';

import { InfoMenu } from './InfoMenu';

const InfoMenuHarness = ({ onClose }: { readonly onClose: () => void }): ReactElement => {
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null);

  const onOpenButtonClick = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    setAnchorElement(event.currentTarget);
  }, []);

  const onInfoMenuClose = useCallback(() => {
    setAnchorElement(null);
    onClose();
  }, [onClose]);

  return (
    <>
      <button
        onClick={onOpenButtonClick}
        type={'button'}
      >
        {'Open info'}
      </button>
      <InfoMenu
        anchorElement={anchorElement}
        onClose={onInfoMenuClose}
      />
    </>
  );
};

const setBackendVersion = (version: string) => {
  container.resolve(BackendVersionService).onResponseFulfilled({
    headers: {
      'content-type': `application/json; version=${version}`,
    },
  } as unknown as AxiosResponse);
};

describe('InfoMenu', () => {
  it('renders nothing while no anchor element is provided', async () => {
    const screen = await renderComponent(
      <InfoMenu
        anchorElement={null}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByTestId('InfoMenu').query()).toBeNull();
  });

  it('renders the frontend version from the configuration', async () => {
    const screen = await renderComponent(
      <InfoMenuHarness onClose={vi.fn()} />,
      {
        configure: (config) => {
          config.getSoftwareVersion = () => '4.5.6-frontend';
        },
      },
    );

    await screen.getByText('Open info').click();

    await expect.element(screen.getByText('Frontend version')).toBeVisible();
    await expect.element(screen.getByText('4.5.6-frontend')).toBeVisible();
  });

  it('renders the backend version reported by the API', async () => {
    setBackendVersion('7.8.9-backend');
    const screen = await renderComponent(
      <InfoMenuHarness onClose={vi.fn()} />,
    );

    await screen.getByText('Open info').click();

    await expect.element(screen.getByText('Backend version')).toBeVisible();
    await expect.element(screen.getByText('7.8.9-backend')).toBeVisible();
  });

  it('renders a placeholder backend version before the API reports one', async () => {
    const screen = await renderComponent(
      <InfoMenuHarness onClose={vi.fn()} />,
    );

    await screen.getByText('Open info').click();

    await expect.element(screen.getByText('Backend version')).toBeVisible();
    await expect.element(screen.getByText('-', { exact: true })).toBeVisible();
  });

  it('calls onClose and hides the menu when Escape is pressed', async () => {
    const onClose = vi.fn();
    const screen = await renderComponent(
      <InfoMenuHarness onClose={onClose} />,
    );

    await screen.getByText('Open info').click();
    await expect.element(screen.getByTestId('InfoMenu')).toBeVisible();

    await userEvent.keyboard('{Escape}');

    await expect.poll(() => onClose.mock.calls.length).toBe(1);
    await expect.poll(() => screen.getByTestId('InfoMenu').query()).toBeNull();
  });

  it('opens the license dialog when show license information is clicked', async () => {
    mockApiRequest('POST', '/v1/retrieve/licenses', () => Response.json([]));
    const screen = await renderComponent(
      <InfoMenuHarness onClose={vi.fn()} />,
    );

    await screen.getByText('Open info').click();
    await screen.getByText('Show license information').click();

    await expect.element(screen.getByText('Licenses', { exact: true })).toBeVisible();
  });

  it('copies the version information to the clipboard and shows a confirmation icon', async () => {
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    const screen = await renderComponent(
      <InfoMenuHarness onClose={vi.fn()} />,
      {
        configure: (config) => {
          config.getSoftwareVersion = () => '4.5.6-frontend';
        },
      },
    );

    await screen.getByText('Open info').click();
    await screen.getByText('Copy version information to clipboard').click();

    await expect.element(screen.getByTestId('DoneIcon')).toBeVisible();
    expect(writeTextSpy).toHaveBeenCalledTimes(1);
    expect(writeTextSpy.mock.calls[0]?.[0]).toContain('Frontend version: 4.5.6-frontend');
    expect(writeTextSpy.mock.calls[0]?.[0]).toContain('URL: ');

    await expect.element(screen.getByTestId('ContentCopyIcon'), { timeout: 4000 }).toBeVisible();
    writeTextSpy.mockRestore();
  });
});
