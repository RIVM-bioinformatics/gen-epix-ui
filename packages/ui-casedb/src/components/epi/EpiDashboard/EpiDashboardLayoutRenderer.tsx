import type {
  ReactElement,
  Ref,
} from 'react';
import {
  Fragment,
  use,
  useImperativeHandle,
  useMemo,
} from 'react';
import type { LayoutStorage } from 'react-resizable-panels';
import {
  Group,
  Panel,
  useDefaultLayout,
  useGroupRef,
} from 'react-resizable-panels';
import { useStore } from 'zustand';
import {
  Alert,
  AlertTitle,
  Box,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import {
  ConfigManager,
  PanelSeparatorHorizontal,
  PanelSeparatorVertical,
  StringUtil,
} from '@gen-epix/ui';

import type { EpiDashboardLayoutPanelOrientation } from '../../../../../ui-casedb/src/models/epi';
import { EPI_ZONE } from '../../../../../ui-casedb/src/models/epi';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { userProfileStore } from '../../../stores/userProfileStore';
import { DashboardUtil } from '../../../utils/DashboardUtil';
import type { CaseDbConfig } from '../../../models/config';

export type EpiDashboardLayoutRendererProps = {
  readonly disabled?: boolean;
  readonly epiCurveWidget: ReactElement;
  readonly lineListWidget: ReactElement;
  readonly mapWidget: ReactElement;
  readonly phylogeneticTreeWidget: ReactElement;
  readonly ref?: Ref<ForwardRefEpiDashboardLayoutRendererRefMethods>;
};

const panelStorageFactory = (panelNamePrefix: string): LayoutStorage => ({
  getItem: (name: string) => {
    return userProfileStore.getState().epiDashboardPanels[`${panelNamePrefix}-${name}`];
  },
  setItem: (name: string, value: string) => {
    userProfileStore.getState().setEpiDashboardPanelConfiguration(`${panelNamePrefix}-${name}`, value);
  },
});

export type ForwardRefEpiDashboardLayoutRendererRefMethods = {
  reset: () => void;
};

const createOuterGroupId = (orientation: EpiDashboardLayoutPanelOrientation): string => {
  return `outer-${orientation}`;
};

const createOuterPanelId = (orientation: EpiDashboardLayoutPanelOrientation, index: number): string => {
  return `outer-${orientation}-panel-${index}`;
};

const createInnerGroupId = (orientation: EpiDashboardLayoutPanelOrientation, index: number): string => {
  return `inner-${orientation}-${index}`;
};

const createInnerPanelId = (orientation: EpiDashboardLayoutPanelOrientation, outerIndex: number, innerIndex: number): string => {
  return `${createInnerGroupId(orientation, outerIndex)}-panel-${innerIndex}`;
};

const getIndexFromId = (id: string): number => {
  const match = id.match(/(\d+)(?!.*\d)/);
  return match ? parseInt(match[1], 10) : -1;
};

export const EpiDashboardLayoutRenderer = ({
  disabled,
  epiCurveWidget,
  lineListWidget,
  mapWidget,
  phylogeneticTreeWidget,
  ref,
}: EpiDashboardLayoutRendererProps) => {
  const { t } = useTranslation();
  const epiDashboardStore = use(EpiDashboardStoreContext);
  const dashboardLayoutUserConfig = useStore(userProfileStore, (state) => state.epiDashboardLayoutUserConfig);
  const expandedZone = useStore(epiDashboardStore, (state) => state.expandedZone);
  const layout = DashboardUtil.getDashboardLayout(dashboardLayoutUserConfig);
  const enabledLayoutZones = DashboardUtil.getEnabledZones(dashboardLayoutUserConfig);

  const storagePrefix = useMemo(() => `${StringUtil.createHash(JSON.stringify(layout ?? ''))}-v2-`, [layout]);
  const [outerOrientation, ...panels] = layout ?? [];
  const innerOrientation: EpiDashboardLayoutPanelOrientation = outerOrientation === 'horizontal' ? 'vertical' : 'horizontal';

  const { defaultLayout: defaultLayoutOuter, onLayoutChanged: onLayoutChangedOuter } = useDefaultLayout({
    groupId: createOuterGroupId(outerOrientation),
    storage: panelStorageFactory(`${storagePrefix}-outer`),
  });

  const { defaultLayout: defaultLayoutInner0, onLayoutChanged: onLayoutChangedInner0 } = useDefaultLayout({
    groupId: createInnerGroupId(innerOrientation, 0),
    storage: panelStorageFactory(`${storagePrefix}-inner-0-${innerOrientation}`),
  });

  const { defaultLayout: defaultLayoutInner1, onLayoutChanged: onLayoutChangedInner1 } = useDefaultLayout({
    groupId: createInnerGroupId(innerOrientation, 1),
    storage: panelStorageFactory(`${storagePrefix}-inner-1-${innerOrientation}`),
  });

  const groupRefOuter = useGroupRef();
  const groupRefInner0 = useGroupRef();
  const groupRefInner1 = useGroupRef();

  const { MIN_PANEL_HEIGHT, MIN_PANEL_WIDTH } = ConfigManager.getInstance<CaseDbConfig>().config.epiDashboard;

  useImperativeHandle(ref, () => ({
    reset: () => {
      try {
        if (groupRefOuter.current) {
          const newLayout = Object.fromEntries(Object.entries(groupRefOuter.current.getLayout()).map(([id, size]) => {
            return [id, panels?.[getIndexFromId(id)]?.[0] ?? size] as [string, number];
          }));
          groupRefOuter.current.setLayout(newLayout);
        }
        if (groupRefInner0.current) {
          const newLayout = Object.fromEntries(Object.entries(groupRefInner0.current.getLayout()).map(([id, size]) => {
            return [id, (panels?.[0]?.[getIndexFromId(id) + 1] as Array<number>)?.[0] ?? size] as [string, number];
          }));
          groupRefInner0.current.setLayout(newLayout);
        }
        if (groupRefInner1.current) {
          const newLayout = Object.fromEntries(Object.entries(groupRefInner1.current.getLayout()).map(([id, size]) => {
            return [id, (panels?.[1]?.[getIndexFromId(id) + 1] as Array<number>)?.[0] ?? size] as [string, number];
          }));
          groupRefInner1.current.setLayout(newLayout);
        }
      } catch (_error) {
        // allow to fail (it doesn't change functionality)
      }
    },
  }));

  const panelMap = useMemo(() => {
    return {
      [EPI_ZONE.EPI_CURVE]: epiCurveWidget,
      [EPI_ZONE.LINE_LIST]: lineListWidget,
      [EPI_ZONE.MAP]: mapWidget,
      [EPI_ZONE.TREE]: phylogeneticTreeWidget,
    };
  }, [epiCurveWidget, lineListWidget, mapWidget, phylogeneticTreeWidget]);

  if (expandedZone) {
    return panelMap[expandedZone as keyof typeof panelMap];
  }

  if (enabledLayoutZones.length === 0) {
    return (
      <Box
        sx={{
          alignContent: 'center',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Alert severity={'info'}>
          <AlertTitle>
            {t`No visible element has been configured. Use the layout menu in the sidebar to enable an element.`}
          </AlertTitle>
        </Alert>
      </Box>
    );
  }

  if (enabledLayoutZones.length === 1) {
    return panelMap[enabledLayoutZones[0] as keyof typeof panelMap];
  }

  return (
    <Group
      defaultLayout={defaultLayoutOuter}
      groupRef={groupRefOuter}
      id={createOuterGroupId(outerOrientation)}
      onLayoutChanged={onLayoutChangedOuter}
      orientation={outerOrientation}
      style={{
        height: '100%',
        width: '100%',
      }}
    >
      {panels.map(([outerPanelSize, ...widgetPanels], index) => {
        return (
          <Fragment key={JSON.stringify(widgetPanels)}>
            <Panel
              defaultSize={outerPanelSize}
              id={createOuterPanelId(outerOrientation, index)}
              minSize={outerOrientation === 'vertical' ? MIN_PANEL_HEIGHT : MIN_PANEL_WIDTH}
              style={{ overflow: 'hidden' }}
            >
              {widgetPanels.length === 1 && panelMap[widgetPanels[0][1] as keyof typeof panelMap]}
              {widgetPanels.length > 1 && (
                <Group
                  defaultLayout={index === 0 ? defaultLayoutInner0 : defaultLayoutInner1}
                  groupRef={index === 0 ? groupRefInner0 : groupRefInner1}
                  id={createInnerGroupId(innerOrientation, index)}
                  onLayoutChanged={index === 0 ? onLayoutChangedInner0 : onLayoutChangedInner1}
                  orientation={innerOrientation}
                >
                  {widgetPanels.map(([widgetPanelSize, zone], innerIndex) => {
                    return (
                      <Fragment key={zone}>
                        <Panel
                          defaultSize={widgetPanelSize}
                          id={createInnerPanelId(innerOrientation, index, innerIndex)}
                          minSize={innerOrientation === 'vertical' ? MIN_PANEL_HEIGHT : MIN_PANEL_WIDTH}
                          style={{ overflow: 'hidden' }}
                        >
                          {panelMap[zone as keyof typeof panelMap]}
                        </Panel>
                        {innerIndex < widgetPanels.length - 1 && innerOrientation === 'horizontal' && (
                          <PanelSeparatorVertical disabled={disabled} />
                        )}
                        {innerIndex < widgetPanels.length - 1 && innerOrientation === 'vertical' && (
                          <PanelSeparatorHorizontal disabled={disabled} />
                        )}
                      </Fragment>
                    );
                  })}
                </Group>
              )}
            </Panel>
            {index < panels.length - 1 && outerOrientation === 'horizontal' && (
              <PanelSeparatorVertical disabled={disabled} />
            )}
            {index < panels.length - 1 && outerOrientation === 'vertical' && (
              <PanelSeparatorHorizontal disabled={disabled} />
            )}
          </Fragment>
        );
      })}
    </Group>
  );
};
