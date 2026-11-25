import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbOutage } from '@gen-epix/api-commondb';

import { renderComponent } from '../../../test/lib';

import { OutageItem } from './OutageItem';

const ACTIVE_FROM = '2024-03-01T10:15:00';
const ACTIVE_TO = '2024-03-02T18:45:30';

const createOutage = (overrides: Partial<CommonDbOutage> = {}): CommonDbOutage => ({
  active_from: ACTIVE_FROM,
  active_to: ACTIVE_TO,
  description: 'Database maintenance window',
  id: 'outage-1',
  ...overrides,
});

describe('OutageItem', () => {
  it('renders the title, description and formatted expected start and end', async () => {
    const screen = await renderComponent(
      <OutageItem
        outage={createOutage()}
        severity={'warning'}
        title={'Active outage'}
      />,
    );

    await expect.element(screen.getByText('Active outage')).toBeVisible();
    await expect.element(screen.getByText('Database maintenance window')).toBeVisible();
    await expect.element(screen.getByText('Expected start: 2024-03-01 10:15:00')).toBeVisible();
    await expect.element(screen.getByText('Expected end: 2024-03-02 18:45:30')).toBeVisible();
  });

  it('shows Unknown for a missing start and end date', async () => {
    const screen = await renderComponent(
      <OutageItem
        outage={createOutage({ active_from: null, active_to: undefined })}
        severity={'info'}
        title={'Planned outage'}
      />,
    );

    await expect.element(screen.getByText('Expected start: Unknown')).toBeVisible();
    await expect.element(screen.getByText('Expected end: Unknown')).toBeVisible();
    await expect.element(screen.getByText('2024-03-01')).not.toBeInTheDocument();
  });

  it('applies the severity as the alert color', async () => {
    const screen = await renderComponent(
      <OutageItem
        outage={createOutage()}
        severity={'error'}
        title={'Active outage'}
      />,
    );

    await expect.element(screen.getByRole('alert')).toHaveClass('MuiAlert-colorError');
  });

  it('renders the info color for an info severity', async () => {
    const screen = await renderComponent(
      <OutageItem
        outage={createOutage()}
        severity={'info'}
        title={'Upcoming outage'}
      />,
    );

    await expect.element(screen.getByRole('alert')).toHaveClass('MuiAlert-colorInfo');
  });
});
