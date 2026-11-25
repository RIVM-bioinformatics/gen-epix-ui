import type { ComponentProps } from 'react';
import {
  describe,
  expect,
  it,
} from 'vitest';
import type { CommonDbOutage } from '@gen-epix/api-commondb';

import { renderComponent } from '../../../test/lib';

import { OutageSection } from './OutageSection';

type OutageSectionProps = ComponentProps<typeof OutageSection>;

const SECTION_TITLE = 'Section title for outages';
const ITEM_TITLE = 'Outage item title';
const SEVERITY_CLASS_NAMES: Record<NonNullable<OutageSectionProps['severity']>, string> = {
  error: 'MuiAlert-colorError',
  info: 'MuiAlert-colorInfo',
  success: 'MuiAlert-colorSuccess',
  warning: 'MuiAlert-colorWarning',
};

const createOutage = (id: string, description: string): CommonDbOutage => ({
  active_from: '2024-03-01T10:15:00',
  active_to: '2024-03-02T18:45:30',
  description,
  id,
});

const renderSection = async (props: Partial<OutageSectionProps> = {}) => {
  return renderComponent(
    <OutageSection
      itemTitle={ITEM_TITLE}
      outages={[]}
      severity={'info'}
      title={SECTION_TITLE}
      {...props}
    />,
  );
};

describe('OutageSection', () => {
  it('shows only the section title when there are no outages', async () => {
    const screen = await renderSection();

    await expect.element(screen.getByText(SECTION_TITLE)).toBeVisible();
    expect(screen.getByRole('alert').elements()).toHaveLength(0);
    expect(screen.getByText(ITEM_TITLE).elements()).toHaveLength(0);
  });

  it('renders one alert per outage with the item title and the outage details', async () => {
    const screen = await renderSection({
      outages: [
        createOutage('outage-1', 'First outage description'),
        createOutage('outage-2', 'Second outage description'),
      ],
    });

    await expect.element(screen.getByText(SECTION_TITLE)).toBeVisible();
    await expect.element(screen.getByText('First outage description')).toBeVisible();
    await expect.element(screen.getByText('Second outage description')).toBeVisible();
    expect(screen.getByRole('alert').elements()).toHaveLength(2);
    expect(screen.getByText(ITEM_TITLE, { exact: true }).elements()).toHaveLength(2);
  });

  it.each(Object.entries(SEVERITY_CLASS_NAMES))('applies the %s severity to every outage alert', async (severity, className) => {
    const screen = await renderSection({
      outages: [
        createOutage('outage-1', 'Severity outage one'),
        createOutage('outage-2', 'Severity outage two'),
      ],
      severity: severity as OutageSectionProps['severity'],
    });

    await expect.element(screen.getByText('Severity outage two')).toBeVisible();
    const alerts = screen.getByRole('alert').elements();
    expect(alerts).toHaveLength(2);
    for (const alert of alerts) {
      expect(alert.className).toContain(className);
    }
  });

  it('updates the rendered outages when the props change', async () => {
    const screen = await renderSection({
      outages: [createOutage('outage-1', 'Initial outage')],
    });

    await expect.element(screen.getByText('Initial outage')).toBeVisible();

    await screen.rerender(
      <OutageSection
        itemTitle={ITEM_TITLE}
        outages={[createOutage('outage-2', 'Replacement outage')]}
        severity={'warning'}
        title={'Updated section title'}
      />,
    );

    await expect.element(screen.getByText('Replacement outage')).toBeVisible();
    await expect.element(screen.getByText('Updated section title')).toBeVisible();
    expect(screen.getByText('Initial outage').elements()).toHaveLength(0);
    expect(screen.getByText(SECTION_TITLE).elements()).toHaveLength(0);
    expect(screen.getByRole('alert').elements()[0]?.className).toContain('MuiAlert-colorWarning');
  });
});
