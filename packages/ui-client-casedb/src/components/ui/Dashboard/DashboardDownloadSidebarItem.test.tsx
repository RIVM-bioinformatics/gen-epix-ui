import { container } from 'tsyringe';
import type { PropsWithChildren } from 'react';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { userEvent } from 'vitest/browser';
import { DependencyContainerUtil } from '@gen-epix/ui-client-common/utils/DependencyContainerUtil';

import type {
  DownloadConfig,
  DownloadConfigItem,
  DownloadConfigSection,
} from '../../../classes/services/EventBusService';
import { EventBusService } from '../../../classes/services/EventBusService';
import type { CaseDbConfig } from '../../../models/config.models';
import { renderComponent } from '../../../test/lib';
import { DASHBOARD_COMPONENT_NAME } from '../../../constants/dashboard.constants';

import { DashboardDownloadSidebarItem } from './DashboardDownloadSidebarItem';

const LINE_LIST_ZONE_LABEL = 'Line list zone';
const TREE_ZONE_LABEL = 'Tree zone';
const EPI_CURVE_ZONE_LABEL = 'Epi curve zone';

/**
 * Provides a sized main content element that the sidebar measures, so the drawer has a non-zero height.
 */
const DownloadSidebarWrapper = ({ children }: PropsWithChildren) => {
  const config = DependencyContainerUtil.resolveConfig<CaseDbConfig>();
  return (
    <>
      <div
        id={config.layout.MAIN_CONTENT_ID}
        style={{
          height: '600px',
          left: 0,
          position: 'fixed',
          top: '60px',
          width: '400px',
        }}
      />
      {children}
    </>
  );
};

const createItem = (overrides: Partial<DownloadConfigItem> = {}): DownloadConfigItem => {
  return {
    callback: vi.fn(),
    label: 'Item label',
    ...overrides,
  };
};

const createDownloadConfig = (overrides: Partial<DownloadConfig> = {}): DownloadConfig => {
  return {
    items: [createItem()],
    zone: DASHBOARD_COMPONENT_NAME.LINE_LIST,
    zoneLabel: LINE_LIST_ZONE_LABEL,
    ...overrides,
  };
};

const emitDownloadOptionsChanged = (payload: DownloadConfig) => {
  container.resolve(EventBusService).emit('onDownloadOptionsChanged', payload);
};

describe('DashboardDownloadSidebarItem', () => {
  it('renders the title and calls onClose when the close button is clicked', async () => {
    const onClose = vi.fn();
    const screen = await renderComponent(
      <DownloadSidebarWrapper>
        <DashboardDownloadSidebarItem
          onClose={onClose}
          open
        />
      </DownloadSidebarWrapper>,
    );

    await expect.element(screen.getByText('Download')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Close download' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render download options while closed and renders them once opened', async () => {
    const screen = await renderComponent(
      <DownloadSidebarWrapper>
        <DashboardDownloadSidebarItem
          onClose={vi.fn()}
          open={false}
        />
      </DownloadSidebarWrapper>,
    );

    await expect.element(screen.getByText(LINE_LIST_ZONE_LABEL)).not.toBeInTheDocument();

    await screen.rerender(
      <DownloadSidebarWrapper>
        <DashboardDownloadSidebarItem
          onClose={vi.fn()}
          open
        />
      </DownloadSidebarWrapper>,
    );
    emitDownloadOptionsChanged(createDownloadConfig());
    await expect.element(screen.getByText(LINE_LIST_ZONE_LABEL)).toBeVisible();
  });

  it('ignores payloads without a zone', async () => {
    const screen = await renderComponent(
      <DownloadSidebarWrapper>
        <DashboardDownloadSidebarItem
          onClose={vi.fn()}
          open
        />
      </DownloadSidebarWrapper>,
    );

    emitDownloadOptionsChanged(createDownloadConfig({ zone: '', zoneLabel: 'Ignored zone' }));
    emitDownloadOptionsChanged(createDownloadConfig({ items: [createItem({ label: 'Visible item' })], zone: DASHBOARD_COMPONENT_NAME.TREE, zoneLabel: TREE_ZONE_LABEL }));

    await expect.element(screen.getByText(TREE_ZONE_LABEL)).toBeVisible();
    await expect.element(screen.getByText('Ignored zone')).not.toBeInTheDocument();
  });

  it('renders enabled items as buttons that invoke their callback', async () => {
    const callback = vi.fn();
    const screen = await renderComponent(
      <DownloadSidebarWrapper>
        <DashboardDownloadSidebarItem
          onClose={vi.fn()}
          open
        />
      </DownloadSidebarWrapper>,
    );

    emitDownloadOptionsChanged(createDownloadConfig({ items: [createItem({ callback, label: 'Download csv' })] }));

    await userEvent.click(screen.getByRole('button', { name: 'Download csv' }));
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('renders items without a callback or that are disabled as plain text', async () => {
    const screen = await renderComponent(
      <DownloadSidebarWrapper>
        <DashboardDownloadSidebarItem
          onClose={vi.fn()}
          open
        />
      </DownloadSidebarWrapper>,
    );

    emitDownloadOptionsChanged(createDownloadConfig({
      items: [
        createItem({ callback: undefined, label: 'No callback item' }),
        createItem({ disabled: true, label: 'Disabled item' }),
      ],
    }));

    await expect.element(screen.getByText('No callback item')).toBeVisible();
    await expect.element(screen.getByText('Disabled item')).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'No callback item' })).not.toBeInTheDocument();
    await expect.element(screen.getByRole('button', { name: 'Disabled item' })).not.toBeInTheDocument();
  });

  it('renders a disabled zone with a no-data message and without its items', async () => {
    const screen = await renderComponent(
      <DownloadSidebarWrapper>
        <DashboardDownloadSidebarItem
          onClose={vi.fn()}
          open
        />
      </DownloadSidebarWrapper>,
    );

    emitDownloadOptionsChanged(createDownloadConfig({
      disabled: true,
      items: [createItem({ label: 'Hidden item' })],
    }));

    await expect.element(screen.getByText(LINE_LIST_ZONE_LABEL)).toBeVisible();
    await expect.element(screen.getByText('No data available for download.')).toBeVisible();
    await expect.element(screen.getByText('Hidden item')).not.toBeInTheDocument();
  });

  it('renders sections with their items and hides disabled sections and disabled items within sections', async () => {
    const screen = await renderComponent(
      <DownloadSidebarWrapper>
        <DashboardDownloadSidebarItem
          onClose={vi.fn()}
          open
        />
      </DownloadSidebarWrapper>,
    );

    const enabledSectionCallback = vi.fn();
    const enabledSection: DownloadConfigSection = {
      items: [
        createItem({ callback: enabledSectionCallback, label: 'Section item' }),
        createItem({ disabled: true, label: 'Disabled section item' }),
      ],
      label: 'Enabled section',
    };
    const disabledSection: DownloadConfigSection = {
      disabled: true,
      items: [createItem({ label: 'Forced disabled item' })],
      label: 'Forced disabled section',
    };
    const hiddenSection: DownloadConfigSection = {
      disabled: false,
      items: [createItem({ label: 'Hidden section item' })],
      label: 'Hidden section',
    };
    emitDownloadOptionsChanged(createDownloadConfig({
      items: [
        enabledSection,
        disabledSection,
        { ...hiddenSection, disabled: true },
      ],
    }));

    await expect.element(screen.getByText('Enabled section')).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Section item' }));
    expect(enabledSectionCallback).toHaveBeenCalledTimes(1);

    await expect.element(screen.getByText('Disabled section item')).toBeVisible();
    await expect.element(screen.getByRole('button', { name: 'Disabled section item' })).not.toBeInTheDocument();

    await expect.element(screen.getByText('Forced disabled section')).not.toBeInTheDocument();
    await expect.element(screen.getByText('Forced disabled item')).not.toBeInTheDocument();

    await expect.element(screen.getByText('Hidden section')).not.toBeInTheDocument();
    await expect.element(screen.getByText('Hidden section item')).not.toBeInTheDocument();
  });

  it('sorts zones by the configured download section order', async () => {
    const screen = await renderComponent(
      <DownloadSidebarWrapper>
        <DashboardDownloadSidebarItem
          onClose={vi.fn()}
          open
        />
      </DownloadSidebarWrapper>,
    );

    emitDownloadOptionsChanged(createDownloadConfig({
      zone: DASHBOARD_COMPONENT_NAME.TREE,
      zoneLabel: TREE_ZONE_LABEL,
    }));
    emitDownloadOptionsChanged(createDownloadConfig({
      zone: DASHBOARD_COMPONENT_NAME.LINE_LIST,
      zoneLabel: LINE_LIST_ZONE_LABEL,
    }));
    emitDownloadOptionsChanged(createDownloadConfig({
      zone: DASHBOARD_COMPONENT_NAME.EPI_CURVE,
      zoneLabel: EPI_CURVE_ZONE_LABEL,
    }));

    await expect.element(screen.getByText(EPI_CURVE_ZONE_LABEL)).toBeVisible();
    const lineListElement = screen.getByText(LINE_LIST_ZONE_LABEL).element();
    const treeElement = screen.getByText(TREE_ZONE_LABEL).element();
    const epiCurveElement = screen.getByText(EPI_CURVE_ZONE_LABEL).element();

    expect(lineListElement.compareDocumentPosition(treeElement) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(treeElement.compareDocumentPosition(epiCurveElement) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('replaces an existing zone when it is emitted again', async () => {
    const screen = await renderComponent(
      <DownloadSidebarWrapper>
        <DashboardDownloadSidebarItem
          onClose={vi.fn()}
          open
        />
      </DownloadSidebarWrapper>,
    );

    emitDownloadOptionsChanged(createDownloadConfig({ items: [createItem({ label: 'Old item' })] }));
    await expect.element(screen.getByText('Old item')).toBeVisible();

    emitDownloadOptionsChanged(createDownloadConfig({ items: [createItem({ label: 'New item' })] }));
    await expect.element(screen.getByText('New item')).toBeVisible();
    await expect.element(screen.getByText('Old item')).not.toBeInTheDocument();
    await expect.element(screen.getByText(LINE_LIST_ZONE_LABEL)).toBeInTheDocument();
  });

  it('removes a zone when its items are emitted as null', async () => {
    const screen = await renderComponent(
      <DownloadSidebarWrapper>
        <DashboardDownloadSidebarItem
          onClose={vi.fn()}
          open
        />
      </DownloadSidebarWrapper>,
    );

    emitDownloadOptionsChanged(createDownloadConfig({ zone: DASHBOARD_COMPONENT_NAME.TREE, zoneLabel: TREE_ZONE_LABEL }));
    emitDownloadOptionsChanged(createDownloadConfig());
    await expect.element(screen.getByText(TREE_ZONE_LABEL)).toBeVisible();
    await expect.element(screen.getByText(LINE_LIST_ZONE_LABEL)).toBeVisible();

    // A null items payload removes the zone's download options from the sidebar
    emitDownloadOptionsChanged({ items: null, zone: DASHBOARD_COMPONENT_NAME.LINE_LIST, zoneLabel: LINE_LIST_ZONE_LABEL });
    await expect.element(screen.getByText(TREE_ZONE_LABEL)).toBeVisible();
    await expect.element(screen.getByText(LINE_LIST_ZONE_LABEL)).not.toBeInTheDocument();
  });

  it('stops listening to download options after unmount', async () => {
    const screen = await renderComponent(
      <DownloadSidebarWrapper>
        <DashboardDownloadSidebarItem
          onClose={vi.fn()}
          open
        />
      </DownloadSidebarWrapper>,
    );
    await expect.element(screen.getByText('Download')).toBeVisible();

    await screen.unmount();

    expect(() => {
      emitDownloadOptionsChanged(createDownloadConfig());
    }).not.toThrow();
  });
});
