import type {
  ForwardRefRenderFunction,
  ReactElement,
} from 'react';
import {
  Fragment,
  forwardRef,
  useCallback,
  useContext,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import type {
  ImperativePanelGroupHandle,
  PanelGroupStorage,
} from 'react-resizable-panels';
import {
  PanelGroup,
  Panel,
} from 'react-resizable-panels';
import { useStore } from 'zustand';
import {
  Alert,
  AlertTitle,
  Box,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import { ConfigManager } from '../../../classes/managers/ConfigManager';
import type { EpiDashboardLayoutFirstPanelDirection } from '../../../models/epi';
import { EPI_ZONE } from '../../../models/epi';
import { EpiStoreContext } from '../../../stores/epiStore';
import { userProfileStore } from '../../../stores/userProfileStore';
import { DashboardUtil } from '../../../utils/DashboardUtil';
import { StringUtil } from '../../../utils/StringUtil';
import {
  PanelResizeHandleVertical,
  PanelResizeHandleHorizontal,
} from '../../ui/PanelResizeHandle';

export type EpiDashboardLayoutRendererProps = {
  readonly lineListWidget: ReactElement;
  readonly phylogeneticTreeWidget: ReactElement;
  readonly mapWidget: ReactElement;
  readonly epiCurveWidget: ReactElement;
  readonly disabled?: boolean;
};

const panelStorageFactory = (panelNamePrefix: string): PanelGroupStorage => ({
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

const createOuterPanelId = (direction: EpiDashboardLayoutFirstPanelDirection): string => {
  return `outer-${direction}`;
};

const createInnerPanelId = (direction: EpiDashboardLayoutFirstPanelDirection, index: number): string => {
  return `${index}-${direction}`;
};

export const ForwardRefEpiDashboardLayoutRenderer: ForwardRefRenderFunction<ForwardRefEpiDashboardLayoutRendererRefMethods, EpiDashboardLayoutRendererProps> = ({
  lineListWidget,
  phylogeneticTreeWidget,
  mapWidget,
  epiCurveWidget,
  disabled,
}, forwardedRef) => {
  const [t] = useTranslation();
  const panelRefs = useRef<{ [key: string]: ImperativePanelGroupHandle }>({});
  const epiStore = useContext(EpiStoreContext);
  const dashboardLayoutUserConfig = useStore(userProfileStore, (state) => state.epiDashboardLayoutUserConfig);
  const expandedZone = useStore(epiStore, (state) => state.expandedZone);
  const layout = DashboardUtil.getDashboardLayout(dashboardLayoutUserConfig);
  const enabledLayoutZones = DashboardUtil.getEnabledZones(dashboardLayoutUserConfig);

  const panelNamePrefix = useMemo(() => StringUtil.createHash(JSON.stringify(layout ?? '')), [layout]);
  const [outerDirection, ...panels] = layout ?? [];
  const innerDirection: EpiDashboardLayoutFirstPanelDirection = outerDirection === 'horizontal' ? 'vertical' : 'horizontal';

  const registerPanel = useCallback((handle: ImperativePanelGroupHandle) => {
    if (handle?.getId()) {
      panelRefs.current[handle.getId()] = handle;
    }
  }, []);

  const { MIN_PANEL_HEIGHT, MIN_PANEL_WIDTH } = ConfigManager.instance.config.epiDashboard;

  useImperativeHandle(forwardedRef, () => ({
    reset: () => {
      try {
        if (panelRefs.current?.[createOuterPanelId(outerDirection)]) {
          panelRefs.current?.[createOuterPanelId(outerDirection)].setLayout(panels.map(panel => panel[0]));
        }
        panels.forEach(([_outerPanelSize, ...widgetPanels], index) => {
          if (widgetPanels.length > 1 && panelRefs.current?.[createInnerPanelId(innerDirection, index)]) {
            panelRefs.current?.[createInnerPanelId(innerDirection, index)].setLayout(widgetPanels.map(panel => panel[0]));
          }
        });
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
    <PanelGroup
      ref={registerPanel}
      autoSaveId={createOuterPanelId(outerDirection)}
      direction={outerDirection}
      id={createOuterPanelId(outerDirection)}
      storage={panelStorageFactory(`${panelNamePrefix}-outer`)}
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      {panels.map(([outerPanelSize, ...widgetPanels], index) => {
        return (
          <Fragment key={JSON.stringify(widgetPanels)}>
            <Panel
              defaultSize={outerPanelSize}
              id={`${createOuterPanelId(outerDirection)}-panel-${index}`}
              minSize={outerDirection === 'vertical' ? MIN_PANEL_HEIGHT : MIN_PANEL_WIDTH}
              order={index}
            >
              {widgetPanels.length === 1 && panelMap[widgetPanels[0][1] as keyof typeof panelMap]}
              {widgetPanels.length > 1 && (
                <PanelGroup
                  ref={registerPanel}
                  autoSaveId={createInnerPanelId(innerDirection, index)}
                  direction={innerDirection}
                  id={createInnerPanelId(innerDirection, index)}
                  storage={panelStorageFactory(`${panelNamePrefix}-inner-${index}-${innerDirection}`)}
                >
                  {widgetPanels.map(([widgetPanelSize, zone], innerIndex) => {
                    return (
                      <Fragment key={zone}>
                        <Panel
                          defaultSize={widgetPanelSize}
                          id={`${createInnerPanelId(innerDirection, index)}-panel-${innerIndex}`}
                          minSize={innerDirection === 'vertical' ? MIN_PANEL_HEIGHT : MIN_PANEL_WIDTH}
                          order={index}
                        >
                          {panelMap[zone as keyof typeof panelMap]}
                        </Panel>
                        {innerIndex < widgetPanels.length - 1 && innerDirection === 'horizontal' && (
                          <PanelResizeHandleVertical disabled={disabled} />
                        )}
                        {innerIndex < widgetPanels.length - 1 && innerDirection === 'vertical' && (
                          <PanelResizeHandleHorizontal disabled={disabled} />
                        )}
                      </Fragment>
                    );
                  })}
                </PanelGroup>
              )}
            </Panel>
            {index < panels.length - 1 && outerDirection === 'horizontal' && (
              <PanelResizeHandleVertical disabled={disabled} />
            )}
            {index < panels.length - 1 && outerDirection === 'vertical' && (
              <PanelResizeHandleHorizontal disabled={disabled} />
            )}
          </Fragment>
        );
      })}
    </PanelGroup>
  );
};

export const EpiDashboardLayoutRenderer = forwardRef(ForwardRefEpiDashboardLayoutRenderer);
