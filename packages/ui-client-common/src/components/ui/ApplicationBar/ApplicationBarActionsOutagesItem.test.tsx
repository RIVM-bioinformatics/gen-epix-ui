import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbOutage } from '@gen-epix/api-commondb';

import { outagesStore } from '../../../stores/outagesStore';
import { renderComponent } from '../../../test/lib';

import { ApplicationBarActionsOutagesItem } from './ApplicationBarActionsOutagesItem';

const createOutage = (overrides: Partial<CommonDbOutage>): CommonDbOutage => ({
  active_from: null,
  active_to: null,
  description: 'Planned maintenance',
  id: 'outage-1',
  is_active: false,
  is_visible: false,
  visible_from: null,
  visible_to: null,
  ...overrides,
});

const ACTIVE_OUTAGE = createOutage({
  description: 'Active outage description',
  id: 'active-outage',
  is_active: true,
});

const SOON_ACTIVE_OUTAGE = createOutage({
  description: 'Soon active outage description',
  id: 'soon-active-outage',
});

const VISIBLE_OUTAGE = createOutage({
  description: 'Visible outage description',
  id: 'visible-outage',
  is_visible: true,
});

describe('ApplicationBarActionsOutagesItem', () => {
  afterEach(() => {
    outagesStore.getState().setCategorizedOutages({
      activeOutages: [],
      soonActiveOutages: [],
      visibleOutages: [],
    });
  });

  it('renders the outages button without a badge when there are no outages', async () => {
    const screen = await renderComponent(
      <ApplicationBarActionsOutagesItem />,
    );

    await expect.element(screen.getByRole('button', { name: 'Outages' })).toBeVisible();
    expect(screen.getByTitle('Outages').getByText('!').query()).toBeNull();
  });

  it('shows the badge when there is an active outage', async () => {
    outagesStore.getState().setCategorizedOutages({
      activeOutages: [ACTIVE_OUTAGE],
      soonActiveOutages: [],
      visibleOutages: [],
    });
    const screen = await renderComponent(
      <ApplicationBarActionsOutagesItem />,
    );

    await expect.element(screen.getByTitle('Outages').getByText('!')).toBeVisible();
  });

  it('shows the badge when there is a soon active outage', async () => {
    outagesStore.getState().setCategorizedOutages({
      activeOutages: [],
      soonActiveOutages: [SOON_ACTIVE_OUTAGE],
      visibleOutages: [],
    });
    const screen = await renderComponent(
      <ApplicationBarActionsOutagesItem />,
    );

    await expect.element(screen.getByTitle('Outages').getByText('!')).toBeVisible();
  });

  it('shows the badge when there is a visible outage', async () => {
    outagesStore.getState().setCategorizedOutages({
      activeOutages: [],
      soonActiveOutages: [],
      visibleOutages: [VISIBLE_OUTAGE],
    });
    const screen = await renderComponent(
      <ApplicationBarActionsOutagesItem />,
    );

    await expect.element(screen.getByTitle('Outages').getByText('!')).toBeVisible();
  });

  it('updates the badge when outages are added to and removed from the store', async () => {
    const screen = await renderComponent(
      <ApplicationBarActionsOutagesItem />,
    );

    expect(screen.getByTitle('Outages').getByText('!').query()).toBeNull();

    outagesStore.getState().setCategorizedOutages({
      activeOutages: [],
      soonActiveOutages: [],
      visibleOutages: [VISIBLE_OUTAGE],
    });
    await expect.element(screen.getByTitle('Outages').getByText('!')).toBeVisible();

    outagesStore.getState().setCategorizedOutages({
      activeOutages: [],
      soonActiveOutages: [],
      visibleOutages: [],
    });
    await expect.poll(() => screen.getByTitle('Outages').getByText('!').query()).toBeNull();
  });

  it('opens the outages dialog listing the outages when the outages button is clicked', async () => {
    outagesStore.getState().setCategorizedOutages({
      activeOutages: [ACTIVE_OUTAGE],
      soonActiveOutages: [SOON_ACTIVE_OUTAGE],
      visibleOutages: [VISIBLE_OUTAGE],
    });
    const screen = await renderComponent(
      <ApplicationBarActionsOutagesItem />,
    );

    expect(screen.getByRole('dialog').query()).toBeNull();

    await screen.getByRole('button', { name: 'Outages' }).click();

    await expect.element(screen.getByRole('dialog')).toBeVisible();
    await expect.element(screen.getByText('Active outage description')).toBeVisible();
    await expect.element(screen.getByText('Soon active outage description')).toBeVisible();
    await expect.element(screen.getByText('Visible outage description')).toBeVisible();
  });

  it('shows the empty outages message in the dialog when there are no outages', async () => {
    const screen = await renderComponent(
      <ApplicationBarActionsOutagesItem />,
    );

    await screen.getByRole('button', { name: 'Outages' }).click();

    await expect.element(screen.getByRole('dialog')).toBeVisible();
    await expect.element(screen.getByText('There no current or scheduled outages.')).toBeVisible();
  });

  it('closes the outages dialog when the close button is clicked', async () => {
    const screen = await renderComponent(
      <ApplicationBarActionsOutagesItem />,
    );

    await screen.getByRole('button', { name: 'Outages' }).click();
    await expect.element(screen.getByRole('dialog')).toBeVisible();

    await screen.getByTestId('OutagesDialog-close').click();

    await expect.poll(() => screen.getByRole('dialog').query()).toBeNull();
  });
});
