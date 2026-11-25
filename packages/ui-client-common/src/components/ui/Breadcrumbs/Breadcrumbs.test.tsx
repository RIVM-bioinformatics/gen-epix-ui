import {
  describe,
  expect,
  it,
} from 'vitest';
import {
  createMemoryRouter,
  RouterProvider,
} from 'react-router-dom';

import type { MyNonIndexRouteObject } from '../../../models/react-router.models';
import { renderComponent } from '../../../test/lib';

import { Breadcrumbs } from './Breadcrumbs';

const createRouter = (routes: MyNonIndexRouteObject[], initialPath: string) => createMemoryRouter(
  [
    {
      children: routes,
      element: <Breadcrumbs />,
      handle: {
        requiredPermissions: [],
        requiresUserProfile: false,
        title: 'Home',
      },
      path: '/',
    },
  ],
  { initialEntries: [initialPath] },
);

describe('Breadcrumbs', () => {
  it('renders a link for each ancestor route and a heading for the current route', async () => {
    const router = createRouter(
      [
        {
          children: [
            {
              element: <div />,
              handle: { requiredPermissions: [], requiresUserProfile: false, title: 'Page' },
              path: 'page',
            },
          ],
          handle: { requiredPermissions: [], requiresUserProfile: false, title: 'Section' },
          path: 'section',
        },
      ],
      '/section/page',
    );

    const screen = await renderComponent(
      <RouterProvider router={router} />,
    );

    await expect.element(screen.getByRole('navigation', { name: 'breadcrumbs' })).toBeVisible();
    await expect.element(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    await expect.element(screen.getByRole('link', { name: 'Section' })).toHaveAttribute('href', '/section');
    await expect.element(screen.getByRole('heading', { level: 1, name: 'Page' })).toBeVisible();
  });

  it('hides breadcrumbs of routes marked as hidden', async () => {
    const router = createRouter(
      [
        {
          children: [
            {
              element: <div />,
              handle: { requiredPermissions: [], requiresUserProfile: false, title: 'Leaf' },
              path: 'leaf',
            },
          ],
          handle: { hidden: true, requiredPermissions: [], requiresUserProfile: false, title: 'Hidden section' },
          path: 'hidden',
        },
      ],
      '/hidden/leaf',
    );

    const screen = await renderComponent(
      <RouterProvider router={router} />,
    );

    await expect.element(screen.getByRole('heading', { level: 1, name: 'Leaf' })).toBeVisible();
    expect(document.body.textContent).not.toContain('Hidden section');
  });

  it('renders the breadcrumbs of the index route once when it shares the pathname of its parent', async () => {
    const router = createRouter(
      [
        {
          children: [
            {
              element: <div />,
              handle: { requiredPermissions: [], requiresUserProfile: false, title: 'Index' },
              index: true,
            },
          ],
          element: <div />,
          handle: { requiredPermissions: [], requiresUserProfile: false, title: 'Parent' },
          path: 'parent',
        },
      ],
      '/parent/',
    );

    const screen = await renderComponent(
      <RouterProvider router={router} />,
    );

    await expect.element(screen.getByRole('heading', { level: 1, name: 'Index' })).toBeVisible();
    expect(document.querySelectorAll('nav[aria-label="breadcrumbs"] a[href="/parent"]')).toHaveLength(0);
  });

  it('renders only the home breadcrumb heading when the current route is the root', async () => {
    const router = createRouter([], '/');

    const screen = await renderComponent(
      <RouterProvider router={router} />,
    );

    await expect.element(screen.getByRole('heading', { level: 1, name: 'Home' })).toBeVisible();
    expect(document.querySelectorAll('nav[aria-label="breadcrumbs"] a')).toHaveLength(0);
  });
});
