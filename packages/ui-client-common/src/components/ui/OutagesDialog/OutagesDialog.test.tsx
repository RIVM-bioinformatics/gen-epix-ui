import { createRef } from 'react';
import {
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbOutage } from '@gen-epix/api-commondb';

import { renderComponent } from '../../../test/lib';
import { outagesStore } from '../../../stores/outagesStore';
import type { CategorizedOutages } from '../../../models/outage.models';

import { OutagesDialog } from './OutagesDialog';
import type { OutagesDialogRefMethods } from './OutagesDialog';

const EMPTY_OUTAGES: CategorizedOutages = {
  activeOutages: [],
  soonActiveOutages: [],
  visibleOutages: [],
};

const createOutage = (id: string, description: string): CommonDbOutage => ({
  active_from: '2024-03-01T10:15:00',
  active_to: '2024-03-02T18:45:30',
  description,
  id,
});

const renderDialog = async () => {
  const ref = createRef<OutagesDialogRefMethods>();
  const screen = await renderComponent(
    <OutagesDialog ref={ref} />,
  );
  ref.current?.open({});
  return screen;
};

describe('OutagesDialog', () => {
  afterEach(() => {
    outagesStore.getState().setCategorizedOutages(EMPTY_OUTAGES);
  });

  it('shows the title and the close action', async () => {
    const screen = await renderDialog();

    await expect.element(screen.getByRole('heading', { exact: true, name: 'Outages' })).toBeVisible();
    await expect.element(screen.getByTestId('OutagesDialog-close')).toBeVisible();
  });

  it('shows the empty message when there are no outages in the store', async () => {
    const screen = await renderDialog();

    await expect.element(screen.getByText('There no current or scheduled outages.')).toBeVisible();
  });

  it('renders the outages from the store', async () => {
    outagesStore.getState().setCategorizedOutages({
      activeOutages: [createOutage('active-1', 'Active database outage')],
      soonActiveOutages: [],
      visibleOutages: [createOutage('visible-1', 'Scheduled release')],
    });
    const screen = await renderDialog();

    await expect.element(screen.getByText('Active database outage')).toBeVisible();
    await expect.element(screen.getByText('Scheduled release')).toBeVisible();
  });

  it('updates the listed outages when the store changes while open', async () => {
    const screen = await renderDialog();

    await expect.element(screen.getByText('There no current or scheduled outages.')).toBeVisible();

    outagesStore.getState().setCategorizedOutages({
      activeOutages: [],
      soonActiveOutages: [createOutage('soon-1', 'Upcoming maintenance')],
      visibleOutages: [],
    });

    await expect.element(screen.getByText('Upcoming maintenance')).toBeVisible();
    expect(screen.getByText('There no current or scheduled outages.').elements()).toHaveLength(0);
  });

  it('closes the dialog when the close action is clicked', async () => {
    const screen = await renderDialog();

    await expect.element(screen.getByTestId('OutagesDialog-close')).toBeVisible();
    await screen.getByTestId('OutagesDialog-close').click();

    await expect.element(screen.getByRole('heading', { exact: true, name: 'Outages' })).not.toBeInTheDocument();
  });
});
