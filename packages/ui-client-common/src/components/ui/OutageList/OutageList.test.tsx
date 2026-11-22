import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbOutage } from '@gen-epix/api-commondb';

import { renderComponent } from '../../../test/lib';

import { OutageList } from './OutageList';

const EMPTY_MESSAGE = 'There no current or scheduled outages.';
const ACTIVE_TITLE = 'Our platform is experiencing an active outing.';
const SOON_ACTIVE_TITLE = 'Our platform will soon go down for a planned outage.';
const VISIBLE_TITLE = 'There are scheduled outages. Our platform will be disrupted during these times.';

const createOutage = (id: string, description: string): CommonDbOutage => ({
  active_from: '2024-03-01T10:15:00',
  active_to: '2024-03-02T18:45:30',
  description,
  id,
});

describe('OutageList', () => {
  it('shows the empty message when there are no outages', async () => {
    const screen = await renderComponent(
      <OutageList
        activeOutages={[]}
        soonActiveOutages={[]}
        visibleOutages={[]}
      />,
    );

    await expect.element(screen.getByText(EMPTY_MESSAGE)).toBeVisible();
    expect(screen.getByRole('alert').elements()).toHaveLength(0);
  });

  it('renders only the active section with error severity', async () => {
    const screen = await renderComponent(
      <OutageList
        activeOutages={[createOutage('active-1', 'Active database outage')]}
        soonActiveOutages={[]}
        visibleOutages={[]}
      />,
    );

    await expect.element(screen.getByText(ACTIVE_TITLE)).toBeVisible();
    await expect.element(screen.getByText('Active database outage')).toBeVisible();
    await expect.element(screen.getByText('Active outage', { exact: true })).toBeVisible();
    expect(screen.getByText(EMPTY_MESSAGE).elements()).toHaveLength(0);
    expect(screen.getByText(SOON_ACTIVE_TITLE).elements()).toHaveLength(0);
    expect(screen.getByText(VISIBLE_TITLE).elements()).toHaveLength(0);
    expect(screen.getByRole('alert').elements()[0]?.className).toContain('MuiAlert-colorError');
  });

  it('renders only the soon-active section with warning severity', async () => {
    const screen = await renderComponent(
      <OutageList
        activeOutages={[]}
        soonActiveOutages={[createOutage('soon-1', 'Upcoming maintenance')]}
        visibleOutages={[]}
      />,
    );

    await expect.element(screen.getByText(SOON_ACTIVE_TITLE)).toBeVisible();
    await expect.element(screen.getByText('Upcoming maintenance')).toBeVisible();
    await expect.element(screen.getByText('Upcoming outage', { exact: true })).toBeVisible();
    expect(screen.getByText(ACTIVE_TITLE).elements()).toHaveLength(0);
    expect(screen.getByText(VISIBLE_TITLE).elements()).toHaveLength(0);
    expect(screen.getByRole('alert').elements()[0]?.className).toContain('MuiAlert-colorWarning');
  });

  it('renders only the visible section with info severity', async () => {
    const screen = await renderComponent(
      <OutageList
        activeOutages={[]}
        soonActiveOutages={[]}
        visibleOutages={[createOutage('visible-1', 'Scheduled release')]}
      />,
    );

    await expect.element(screen.getByText(VISIBLE_TITLE)).toBeVisible();
    await expect.element(screen.getByText('Scheduled release')).toBeVisible();
    await expect.element(screen.getByText('Planned outage', { exact: true })).toBeVisible();
    expect(screen.getByText(EMPTY_MESSAGE).elements()).toHaveLength(0);
    expect(screen.getByRole('alert').elements()[0]?.className).toContain('MuiAlert-colorInfo');
  });

  it('renders every section when all outage lists have items', async () => {
    const screen = await renderComponent(
      <OutageList
        activeOutages={[createOutage('active-1', 'Active one')]}
        soonActiveOutages={[createOutage('soon-1', 'Soon one'), createOutage('soon-2', 'Soon two')]}
        visibleOutages={[createOutage('visible-1', 'Visible one')]}
      />,
    );

    await expect.element(screen.getByText(ACTIVE_TITLE)).toBeVisible();
    await expect.element(screen.getByText(SOON_ACTIVE_TITLE)).toBeVisible();
    await expect.element(screen.getByText(VISIBLE_TITLE)).toBeVisible();
    await expect.element(screen.getByText('Soon two')).toBeVisible();
    expect(screen.getByText(EMPTY_MESSAGE).elements()).toHaveLength(0);
    expect(screen.getByRole('alert').elements()).toHaveLength(4);
  });
});
