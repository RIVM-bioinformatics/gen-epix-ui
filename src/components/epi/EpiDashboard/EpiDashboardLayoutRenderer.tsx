import type {
  ForwardRefRenderFunction,
  ReactElement,
} from 'react';
import {
  Fragment,
  forwardRef,
  useContext,
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

import { ConfigManager } from '../../../classes/managers/ConfigManager';
import type { EpiDashboardLayoutPanelOrientation } from '../../../models/epi';
import { EPI_ZONE } from '../../../models/epi';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { userProfileStore } from '../../../stores/userProfileStore';
import { DashboardUtil } from '../../../utils/DashboardUtil';
import { StringUtil } from '../../../utils/StringUtil';
import {
  PanelSeparatorVertical,
  PanelSeparatorHorizontal,
} from '../../ui/PanelSeparator';

export type EpiDashboardLayoutRendererProps = {
  readonly lineListWidget: ReactElement;
  readonly phylogeneticTreeWidget: ReactElement;
  readonly mapWidget: ReactElement;
  readonly epiCurveWidget: ReactElement;
  readonly disabled?: boolean;
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

export const ForwardRefEpiDashboardLayoutRenderer: ForwardRefRenderFunction<ForwardRefEpiDashboardLayoutRendererRefMethods, EpiDashboardLayoutRendererProps> = ({
  lineListWidget,
  phylogeneticTreeWidget,
  mapWidget,
  epiCurveWidget,
  disabled,
}, forwardedRef) => {
  const { t } = useTranslation();
  const epiStore = useContext(EpiDashboardStoreContext);
  const dashboardLayoutUserConfig = useStore(userProfileStore, (state) => state.epiDashboardLayoutUserConfig);
  const expandedZone = useStore(epiStore, (state) => state.expandedZone);
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

  const { MIN_PANEL_HEIGHT, MIN_PANEL_WIDTH } = ConfigManager.instance.config.epiDashboard;

  useImperativeHandle(forwardedRef, () => ({
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
          display: 'flex',
          justifyContent: 'center',
          alignContent: 'center',
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
      groupRef={groupRefOuter}
      orientation={outerOrientation}
      style={{
        width: '100%',
        height: '100%',
      }}
      id={createOuterGroupId(outerOrientation)}
      defaultLayout={defaultLayoutOuter}
      onLayoutChanged={onLayoutChangedOuter}
    >
      {panels.map(([outerPanelSize, ...widgetPanels], index) => {
        return (
          <Fragment key={JSON.stringify(widgetPanels)}>
            <Panel
              defaultSize={outerPanelSize}
              id={createOuterPanelId(outerOrientation, index)}
              minSize={outerOrientation === 'vertical' ? MIN_PANEL_HEIGHT : MIN_PANEL_WIDTH}
            >
              {widgetPanels.length === 1 && panelMap[widgetPanels[0][1] as keyof typeof panelMap]}
              {widgetPanels.length > 1 && (
                <Group
                  groupRef={index === 0 ? groupRefInner0 : groupRefInner1}
                  orientation={innerOrientation}
                  id={createInnerGroupId(innerOrientation, index)}
                  defaultLayout={index === 0 ? defaultLayoutInner0 : defaultLayoutInner1}
                  onLayoutChanged={index === 0 ? onLayoutChangedInner0 : onLayoutChangedInner1}
                >
                  {widgetPanels.map(([widgetPanelSize, zone], innerIndex) => {
                    return (
                      <Fragment key={zone}>
                        <Panel
                          defaultSize={widgetPanelSize}
                          id={createInnerPanelId(innerOrientation, index, innerIndex)}
                          minSize={innerOrientation === 'vertical' ? MIN_PANEL_HEIGHT : MIN_PANEL_WIDTH}
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

export const EpiDashboardLayoutRenderer = forwardRef(ForwardRefEpiDashboardLayoutRenderer);
