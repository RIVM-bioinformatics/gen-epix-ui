import { MemoryRouter } from 'react-router-dom';
import {
  describe,
  expect,
  it,
} from 'vitest';

import { renderComponent } from '../../../test/lib';

import { NavLink } from './NavLink';

const renderNavLink = async (currentPath: string, props: Partial<Parameters<typeof NavLink>[0]> = {}) => {
  const screen = await renderComponent(
    <NavLink
      to={'/target'}
      {...props}
    >
      {'Target link'}
    </NavLink>,
    {
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={[currentPath]}>
          {children}
        </MemoryRouter>
      ),
    },
  );
  return screen;
};

describe('NavLink', () => {
  it('renders a link to the target path', async () => {
    const screen = await renderNavLink('/other');

    await expect.element(screen.getByRole('link', { name: 'Target link' })).toHaveAttribute('href', '/target');
  });

  it('marks the link text as active when the target path is the current path', async () => {
    const screen = await renderNavLink('/target');

    await expect.element(screen.getByRole('link', { name: 'Target link' })).toBeVisible();
    expect(document.querySelector('span.active')?.textContent).toBe('Target link');
  });

  it('does not mark the link text as active when the current path differs', async () => {
    await renderNavLink('/other');

    expect(document.querySelector('span.active')).toBeNull();
    expect(document.querySelector('span')?.textContent).toBe('Target link');
  });

  it('renders the children as plain text without a link when activeAsText is set and the path is active', async () => {
    const screen = await renderNavLink('/target', { activeAsText: true });

    await expect.element(screen.getByText('Target link')).toBeVisible();
    expect(document.querySelector('a')).toBeNull();
  });

  it('renders a link when activeAsText is set but the path is not active', async () => {
    const screen = await renderNavLink('/other', { activeAsText: true });

    await expect.element(screen.getByRole('link', { name: 'Target link' })).toHaveAttribute('href', '/target');
  });
});
