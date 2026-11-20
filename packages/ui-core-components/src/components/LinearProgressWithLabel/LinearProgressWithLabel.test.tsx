import {
  expect,
  it,
} from 'vitest';

import { renderComponent } from '../../test/lib';

import { LinearProgressWithLabel } from './LinearProgressWithLabel';

it('renders an indeterminate bar before progress is reported', async () => {
  const screen = await renderComponent(
    <LinearProgressWithLabel value={0} />,
  );
  const progressBar = screen.getByRole('progressbar');

  await expect.element(progressBar).not.toHaveAttribute('aria-valuenow');
  await expect.element(screen.getByText('0%')).not.toBeInTheDocument();
});

it.each([
  { label: '1%', value: 0.6 },
  { label: '1%', value: 1 },
  { label: '2%', value: 1.5 },
  { label: '100%', value: 100 },
])('renders $label for progress value $value', async ({ label, value }) => {
  const screen = await renderComponent(
    <LinearProgressWithLabel value={value} />,
  );
  const progressBar = screen.getByRole('progressbar');

  await expect.element(progressBar).toHaveAttribute('aria-valuenow', String(value));
  await expect.element(screen.getByText(label)).toBeVisible();
});

it('forwards additional progress bar props', async () => {
  const screen = await renderComponent(
    <LinearProgressWithLabel
      aria-label={'Upload progress'}
      value={50}
    />,
  );

  await expect.element(screen.getByRole('progressbar', { name: 'Upload progress' }))
    .toHaveAttribute('aria-valuenow', '50');
});
