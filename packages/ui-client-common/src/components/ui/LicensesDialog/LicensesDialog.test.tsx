import { createRef } from 'react';
import { container } from 'tsyringe';
import { WindowService } from '@gen-epix/ui-core/classes/services/WindowService';
import type { CommonDbPackageMetadata } from '@gen-epix/api-commondb';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  mockApiRequest,
  renderComponent,
} from '../../../test/lib';

import { LicensesDialog } from './LicensesDialog';
import type { LicensesDialogRefMethods } from './LicensesDialog';

const LONG_LICENSE = 'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction.';

const frontendLicenses: CommonDbPackageMetadata[] = [
  {
    homepage: 'https://zeta.example',
    license: 'MIT',
    name: 'zeta-lib',
    version: '1.0.0',
  },
];

const backendLicenses: CommonDbPackageMetadata[] = [
  {
    homepage: null,
    license: 'Apache-2.0',
    name: 'alpha-lib',
    version: '2.0.0',
  },
  {
    homepage: null,
    license: null,
    name: 'middle-lib',
    version: '3.0.0',
  },
  {
    homepage: 'https://long.example',
    license: LONG_LICENSE,
    name: 'long-lib',
    version: '4.0.0',
  },
];

const mockLicenseRequests = (frontend: CommonDbPackageMetadata[], backend: CommonDbPackageMetadata[]) => {
  mockApiRequest('GET', '/licenses.json', () => Response.json(frontend));
  mockApiRequest('POST', '/v1/retrieve/licenses', () => Response.json(backend));
};

const renderDialog = async () => {
  const ref = createRef<LicensesDialogRefMethods>();
  const screen = await renderComponent(
    <LicensesDialog ref={ref} />,
  );
  ref.current?.open({});
  return screen;
};

const readPackageNames = () => Array.from(document.querySelectorAll('.MuiListItemText-primary > strong')).map(element => element.textContent);

const registerWindowOpenSpy = () => {
  const open = vi.fn();
  const realWindowService = container.resolve(WindowService);
  const realWindow = realWindowService.window;
  const fakeWindow = new Proxy(realWindow, {
    get: (target, property) => {
      if (property === 'open') {
        return open;
      }
      const value = Reflect.get(target, property, target) as unknown;
      return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(target) : value;
    },
  });
  container.registerInstance(WindowService, Object.create(realWindowService, {
    window: { value: fakeWindow },
  }) as WindowService);
  return open;
};

describe('LicensesDialog', () => {
  it('renders frontend and backend licenses merged and sorted by name', async () => {
    mockLicenseRequests(frontendLicenses, backendLicenses);
    const screen = await renderDialog();

    await expect.element(screen.getByText('This application uses the following open source libraries:')).toBeVisible();
    await expect.poll(readPackageNames).toEqual(['alpha-lib', 'long-lib', 'middle-lib', 'zeta-lib']);
    await expect.element(screen.getByText('license: Apache-2.0')).toBeVisible();
    await expect.element(screen.getByText('license: MIT')).toBeVisible();
  });

  it('shows the unknown license text for a package without a license', async () => {
    mockLicenseRequests([], [backendLicenses[1]]);
    const screen = await renderDialog();

    await expect.element(screen.getByText('license: Unknown license')).toBeVisible();
    await expect.poll(readPackageNames).toEqual(['middle-lib']);
  });

  it('shows the title Licenses - Loading while the licenses are loading', async () => {
    let releaseFrontend: () => void = () => undefined;
    const frontendReleased = new Promise<void>((resolve) => {
      releaseFrontend = resolve;
    });
    mockApiRequest('GET', '/licenses.json', async () => {
      await frontendReleased;
      return Response.json(frontendLicenses);
    });
    mockApiRequest('POST', '/v1/retrieve/licenses', () => Response.json(backendLicenses));
    const screen = await renderDialog();

    await expect.element(screen.getByText('Licenses - Loading', { exact: true })).toBeVisible();
    releaseFrontend();
    await expect.element(screen.getByText('Licenses', { exact: true })).toBeVisible();
    await expect.poll(readPackageNames).toEqual(['alpha-lib', 'long-lib', 'middle-lib', 'zeta-lib']);
  });

  it('shows the full license of a long license and returns to the list with Go back', async () => {
    mockLicenseRequests(frontendLicenses, backendLicenses);
    const screen = await renderDialog();

    await screen.getByRole('button', { name: 'Show license' }).click();
    await expect.element(screen.getByText('Full license for long-lib', { exact: true })).toBeVisible();
    await expect.element(screen.getByText(LONG_LICENSE)).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Go back' })).toBeVisible();

    await screen.getByRole('button', { name: 'Go back' }).click();
    await expect.element(screen.getByText('Licenses', { exact: true })).toBeVisible();
    await expect.poll(readPackageNames).toEqual(['alpha-lib', 'long-lib', 'middle-lib', 'zeta-lib']);
  });

  it('opens the project homepage in a new tab only for packages with a homepage', async () => {
    mockLicenseRequests(frontendLicenses, backendLicenses);
    const openSpy = registerWindowOpenSpy();
    const screen = await renderDialog();

    await expect.poll(() => document.querySelectorAll('button[aria-label="Open project homepage in new tab"]').length).toBe(2);
    const homepageButtons = screen.getByRole('button', { name: 'Open project homepage in new tab' });
    await homepageButtons.first().click();
    expect(openSpy).toHaveBeenLastCalledWith('https://long.example', '_blank');
    await homepageButtons.last().click();
    expect(openSpy).toHaveBeenLastCalledWith('https://zeta.example', '_blank');
    expect(openSpy).toHaveBeenCalledTimes(2);
  });

  it('shows an error and no license list when the frontend licenses request fails', async () => {
    mockApiRequest('GET', '/licenses.json', () => new Response('Server error', { status: 500 }));
    mockApiRequest('POST', '/v1/retrieve/licenses', () => Response.json(backendLicenses));
    const screen = await renderDialog();

    await expect.element(screen.getByRole('heading', { level: 1, name: 'Sorry, an unexpected error has occurred.' })).toBeVisible();
    expect(readPackageNames()).toEqual([]);
  });

  it('shows an error and no license list when the backend licenses request fails', async () => {
    mockApiRequest('GET', '/licenses.json', () => Response.json(frontendLicenses));
    mockApiRequest('POST', '/v1/retrieve/licenses', () => new Response('Server error', { status: 500 }));
    const screen = await renderDialog();

    await expect.element(screen.getByRole('heading', { level: 1, name: 'Sorry, an unexpected error has occurred.' })).toBeVisible();
    expect(readPackageNames()).toEqual([]);
  });
});
