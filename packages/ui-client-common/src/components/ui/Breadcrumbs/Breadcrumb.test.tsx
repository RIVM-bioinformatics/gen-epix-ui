import {
  describe,
  expect,
  it,
} from 'vitest';
import { container } from 'tsyringe';
import type { UIMatch } from 'react-router-dom';

import { BreadcrumbService } from '../../../classes/services/BreadcrumbService';
import { RouterService } from '../../../classes/services/RouterService';
import type { MyNonIndexRouteObject } from '../../../models/react-router.models';
import { renderComponent } from '../../../test/lib';

import { Breadcrumb } from './Breadcrumb';

type BreadcrumbMatch = UIMatch<unknown, MyNonIndexRouteObject['handle']>;

const createMatch = (pathname: string, title: string): BreadcrumbMatch => ({
  data: undefined,
  handle: {
    requiredPermissions: [],
    requiresUserProfile: false,
    title,
  },
  id: pathname,
  loaderData: undefined,
  params: {},
  pathname,
});

describe('Breadcrumb', () => {
  it('renders a link to the pathname when it is not the last breadcrumb', async () => {
    const screen = await renderComponent(
      <Breadcrumb
        isLast={false}
        item={createMatch('/section', 'Section')}
      />,
    );

    await expect.element(screen.getByRole('link', { name: 'Section' })).toHaveAttribute('href', '/section');
  });

  it('renders the title as a heading when it is the last breadcrumb', async () => {
    const screen = await renderComponent(
      <Breadcrumb
        isLast
        item={createMatch('/section/page', 'Page')}
      />,
    );

    await expect.element(screen.getByRole('heading', { level: 1, name: 'Page' })).toBeVisible();
    expect(document.querySelector('a')).toBeNull();
  });

  it('renders the title from the breadcrumb service when a title is registered for the handle title', async () => {
    container.resolve(BreadcrumbService).update('Breadcrumb test key', 'Overridden title');

    const screen = await renderComponent(
      <Breadcrumb
        isLast
        item={createMatch('/override', 'Breadcrumb test key')}
      />,
    );

    await expect.element(screen.getByRole('heading', { name: 'Overridden title' })).toBeVisible();
  });

  it('renders the handle title again after the breadcrumb service title is removed', async () => {
    const breadcrumbService = container.resolve(BreadcrumbService);
    breadcrumbService.update('Breadcrumb test key', 'Overridden title');
    breadcrumbService.remove('Breadcrumb test key');

    const screen = await renderComponent(
      <Breadcrumb
        isLast={false}
        item={createMatch('/restored', 'Breadcrumb test key')}
      />,
    );

    await expect.element(screen.getByRole('link', { name: 'Breadcrumb test key' })).toBeVisible();
  });

  it('navigates the router to the pathname when the link is clicked', async () => {
    const routerService = new RouterService({
      adminRoutes: [],
      homePageComponent: () => <div />,
      routes: [
        { element: <div />, path: '/' },
        { element: <div />, path: '/navigation-target' },
      ],
    });
    container.registerInstance(RouterService, routerService);

    const screen = await renderComponent(
      <Breadcrumb
        isLast={false}
        item={createMatch('/navigation-target', 'Target')}
      />,
    );

    await screen.getByRole('link', { name: 'Target' }).click();

    await expect.poll(() => routerService.router.state.location.pathname).toBe('/navigation-target');
    await routerService.router.navigate('/');
  });
});
