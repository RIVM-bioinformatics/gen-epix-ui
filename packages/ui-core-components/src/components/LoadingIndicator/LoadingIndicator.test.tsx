import {
  expect,
  it,
} from 'vitest';

import { renderComponent } from '../../test/lib';

import { LoadingIndicator } from './LoadingIndicator';

it('renders a positioned LinearProgress and forwards its props', async () => {
  const screen = await renderComponent(
    <LoadingIndicator
      aria-label={'Loading records'}
      value={40}
      variant={'determinate'}
    />,
  );
  const progressBar = screen.getByRole('progressbar', { name: 'Loading records' });
  const progressBarElement = screen.baseElement.querySelector('[role="progressbar"]');

  await expect.element(progressBar).toBeVisible();
  await expect.element(progressBar).toHaveAttribute('aria-valuenow', '40');
  if (!progressBarElement) {
    throw new Error('LoadingIndicator should render a progress bar');
  }

  const computedStyle = getComputedStyle(progressBarElement);

  expect(computedStyle.position).toBe('absolute');
  expect(computedStyle.left).toBe('0px');
  expect(computedStyle.right).toBe('0px');
  expect(computedStyle.zIndex).toBe('1');
});
