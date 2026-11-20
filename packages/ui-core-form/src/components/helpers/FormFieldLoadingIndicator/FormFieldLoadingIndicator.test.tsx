import {
  describe,
  expect,
  it,
} from 'vitest';

import { renderComponent } from '../../../test/lib';

import { FormFieldLoadingIndicator } from './FormFieldLoadingIndicator';

describe('FormFieldLoadingIndicator', () => {
  it('renders the default absolute progress indicator', async () => {
    const screen = await renderComponent(
      <FormFieldLoadingIndicator />,
    );
    const progress = screen.container.querySelector<HTMLElement>('[role="progressbar"]');

    await expect.element(screen.getByRole('progressbar')).toBeVisible();
    expect(progress).not.toBeNull();
    expect(window.getComputedStyle(progress).position).toBe('absolute');
    expect(window.getComputedStyle(progress).top).toBe('47px');
    expect(window.getComputedStyle(progress).height).toBe('1px');
    expect(progress.getBoundingClientRect().width).toBe(progress.parentElement?.getBoundingClientRect().width);
  });

  it('renders inline using the theme spacing', async () => {
    const screen = await renderComponent(
      <FormFieldLoadingIndicator inline />,
    );
    const progress = screen.container.querySelector<HTMLElement>('[role="progressbar"]');

    await expect.element(screen.getByRole('progressbar')).toBeVisible();
    expect(progress).not.toBeNull();
    expect(window.getComputedStyle(progress).position).toBe('relative');
    expect(window.getComputedStyle(progress).top).toBe('8px');
  });
});
