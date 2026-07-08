import type {
  ReactElement,
  Ref,
} from 'react';
import {
  createElement,
  Fragment,
  use,
  useImperativeHandle,
  useMemo,
} from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import type { LayoutStorage } from 'react-resizable-panels';
import {
  Group,
  Panel,
  useDefaultLayout,
  useGroupRef,
} from 'react-resizable-panels';
import type { StoreApi } from 'zustand';
import { useStore } from 'zustand';
import {
  ConfigService,
  StringUtil,
} from '@gen-epix/ui';

import { DashboardStoreContext } from '../../../stores/dashboardStore';
import { DashboardUtil } from '../../../utils/DashboardUtil';
import type { CaseDbConfig } from '../../../models/config';
import {
  PanelSeparatorHorizontal,
  PanelSeparatorVertical,
} from '../PanelSeparator';
import { WidgetUnavailable } from '../WidgetUnavailable';
import { UserProfileStoreContext } from '../../../stores/userProfileStore/userProfileStoreContext';
import type { UserProfileStore } from '../../../stores/userProfileStore';
import type { DashboardArrangement } from '../../../models/dashboard';

import { DashboardZoneContext } from './DashboardZoneContext';
import { DashboardWidgetPlaceHolder } from './DashboardWidgetPlaceHolder';

// Maximum number of resizable groups supported simultaneously = 16.
// With a 9-widget maximum, the DFS group tree has at most 9 internal nodes;
// 16 gives headroom for any configuration.
export type DashboardLayoutRendererProps = {
  readonly disabled?: boolean;
  readonly ref?: Ref<ForwardRefDashboardLayoutRendererRefMethods>;
};

const panelStorageFactory = (userProfileStore: StoreApi<UserProfileStore>, panelNamePrefix: string): LayoutStorage => ({
  getItem: (name: string) => {
    return userProfileStore.getState().dashboardPanels[`${panelNamePrefix}-${name}`];
  },
  setItem: (name: string, value: string) => {
    userProfileStore.getState().setDashboardPanelConfiguration(`${panelNamePrefix}-${name}`, value);
  },
});

export type ForwardRefDashboardLayoutRendererRefMethods = {
  reset: () => void;
};

export const DashboardLayoutRenderer = ({
  disabled,
  ref,
}: DashboardLayoutRendererProps) => {
  const userProfileStore = use(UserProfileStoreContext);
  const dashboardStore = use(DashboardStoreContext);
  const dashboardArrangementConfig = useStore(userProfileStore, (state) => state.dashboardArrangementConfig);
  const expandedZone = useStore(dashboardStore, (state) => state.expandedZone);
  const { MIN_PANEL_HEIGHT, MIN_PANEL_WIDTH } = ConfigService.getInstance<CaseDbConfig>().config.dashboard;

  const { arrangementKey, arrangementWidgetAssignments } = dashboardArrangementConfig;
  const arrangement = ConfigService.getInstance<CaseDbConfig>().config.dashboard.ARRANGEMENT_OPTIONS[arrangementKey];

  const storagePrefix = arrangementKey;

  const groupInfos = useMemo(
    () => arrangement?.cells ? DashboardUtil.getArrangementGroupInfos(arrangement, storagePrefix) : [],
    [arrangement, storagePrefix],
  );

  const storage = useMemo(
    () => panelStorageFactory(userProfileStore, 'epi-dashboard'),
    [userProfileStore],
  );

  // Pre-call MAX_GROUPS useDefaultLayout hooks (hooks must be called unconditionally).
  // Each is indexed by DFS traversal order to match getArrangementGroupInfos.
  const groupLayout0 = useDefaultLayout({ groupId: groupInfos[0]?.groupId ?? `${storagePrefix}-ph-0`, storage });
  const groupLayout1 = useDefaultLayout({ groupId: groupInfos[1]?.groupId ?? `${storagePrefix}-ph-1`, storage });
  const groupLayout2 = useDefaultLayout({ groupId: groupInfos[2]?.groupId ?? `${storagePrefix}-ph-2`, storage });
  const groupLayout3 = useDefaultLayout({ groupId: groupInfos[3]?.groupId ?? `${storagePrefix}-ph-3`, storage });
  const groupLayout4 = useDefaultLayout({ groupId: groupInfos[4]?.groupId ?? `${storagePrefix}-ph-4`, storage });
  const groupLayout5 = useDefaultLayout({ groupId: groupInfos[5]?.groupId ?? `${storagePrefix}-ph-5`, storage });
  const groupLayout6 = useDefaultLayout({ groupId: groupInfos[6]?.groupId ?? `${storagePrefix}-ph-6`, storage });
  const groupLayout7 = useDefaultLayout({ groupId: groupInfos[7]?.groupId ?? `${storagePrefix}-ph-7`, storage });
  const groupLayout8 = useDefaultLayout({ groupId: groupInfos[8]?.groupId ?? `${storagePrefix}-ph-8`, storage });
  const groupLayout9 = useDefaultLayout({ groupId: groupInfos[9]?.groupId ?? `${storagePrefix}-ph-9`, storage });
  const groupLayout10 = useDefaultLayout({ groupId: groupInfos[10]?.groupId ?? `${storagePrefix}-ph-10`, storage });
  const groupLayout11 = useDefaultLayout({ groupId: groupInfos[11]?.groupId ?? `${storagePrefix}-ph-11`, storage });
  const groupLayout12 = useDefaultLayout({ groupId: groupInfos[12]?.groupId ?? `${storagePrefix}-ph-12`, storage });
  const groupLayout13 = useDefaultLayout({ groupId: groupInfos[13]?.groupId ?? `${storagePrefix}-ph-13`, storage });
  const groupLayout14 = useDefaultLayout({ groupId: groupInfos[14]?.groupId ?? `${storagePrefix}-ph-14`, storage });
  const groupLayout15 = useDefaultLayout({ groupId: groupInfos[15]?.groupId ?? `${storagePrefix}-ph-15`, storage });

  // Pre-call MAX_GROUPS useGroupRef hooks for imperative reset support.
  const groupRef0 = useGroupRef();
  const groupRef1 = useGroupRef();
  const groupRef2 = useGroupRef();
  const groupRef3 = useGroupRef();
  const groupRef4 = useGroupRef();
  const groupRef5 = useGroupRef();
  const groupRef6 = useGroupRef();
  const groupRef7 = useGroupRef();
  const groupRef8 = useGroupRef();
  const groupRef9 = useGroupRef();
  const groupRef10 = useGroupRef();
  const groupRef11 = useGroupRef();
  const groupRef12 = useGroupRef();
  const groupRef13 = useGroupRef();
  const groupRef14 = useGroupRef();
  const groupRef15 = useGroupRef();

  const allGroupLayouts = [
    groupLayout0, groupLayout1, groupLayout2, groupLayout3,
    groupLayout4, groupLayout5, groupLayout6, groupLayout7,
    groupLayout8, groupLayout9, groupLayout10, groupLayout11,
    groupLayout12, groupLayout13, groupLayout14, groupLayout15,
  ];

  const allGroupRefs = useMemo(() => [
    groupRef0, groupRef1, groupRef2, groupRef3,
    groupRef4, groupRef5, groupRef6, groupRef7,
    groupRef8, groupRef9, groupRef10, groupRef11,
    groupRef12, groupRef13, groupRef14, groupRef15,
  ], [groupRef0, groupRef1, groupRef2, groupRef3, groupRef4, groupRef5, groupRef6, groupRef7, groupRef8, groupRef9, groupRef10, groupRef11, groupRef12, groupRef13, groupRef14, groupRef15]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      try {
        allGroupRefs.forEach((groupRef) => {
          if (groupRef.current) {
            const layout = groupRef.current.getLayout();
            const ids = Object.keys(layout);
            if (ids.length > 0) {
              const equalSize = 100 / ids.length;
              groupRef.current.setLayout(Object.fromEntries(ids.map((id) => [id, equalSize])));
            }
          }
        });
      } catch (_error) {
        // allow to fail (it doesn't change functionality)
      }
    },
  }), [allGroupRefs]);

  const panelMap = useMemo(() => {
    const widgetsConfig = ConfigService.getInstance<CaseDbConfig>().config.dashboard.WIDGETS;
    return Object.fromEntries(
      Object.entries(widgetsConfig).map(([widgetName, { component, widgetLabel }]) => [
        widgetName,
        <ErrorBoundary
          fallback={<WidgetUnavailable widgetLabel={widgetLabel} />}
          key={widgetName}
        >
          {createElement(component)}
        </ErrorBoundary>,
      ]),
    );
  }, []);

  if (expandedZone) {
    const widgetName = arrangementWidgetAssignments[expandedZone];
    return (
      <DashboardZoneContext value={expandedZone}>
        {panelMap[widgetName as keyof typeof panelMap] ?? null}
      </DashboardZoneContext>
    );
  }

  if (!arrangement?.cells) {
    return null;
  }

  // counter.value increments with each group visited in DFS pre-order,
  // matching the order produced by DashboardUtil.getArrangementGroupInfos.
  const counter = { value: 0 };

  const renderArrangement = (arr: DashboardArrangement): ReactElement => {
    const index = counter.value++;
    const groupId = groupInfos[index]?.groupId ?? `${storagePrefix}-group-${index}`;
    const orientation = arr.orientation as 'horizontal' | 'vertical';
    const { defaultLayout, onLayoutChanged } = allGroupLayouts[index] ?? {};
    const groupRef = allGroupRefs[index];

    return (
      <Group
        defaultLayout={defaultLayout}
        groupRef={groupRef}
        id={groupId}
        onLayoutChanged={onLayoutChanged}
        orientation={orientation}
        style={{ height: '100%', width: '100%' }}
      >
        {arr.cells.map((cell, cellIndex) => {
          const isLast = cellIndex === arr.cells.length - 1;
          const panelId = `${groupId}-panel-${cellIndex}`;

          return (
            <Fragment key={'name' in cell ? cell.name : StringUtil.createHash(JSON.stringify(cell))}>
              <Panel
                defaultSize={cell.size}
                id={panelId}
                minSize={orientation === 'vertical' ? MIN_PANEL_HEIGHT : MIN_PANEL_WIDTH}
                style={{ overflow: 'hidden' }}
              >
                {'name' in cell
                  ? (
                    <DashboardZoneContext value={cell.name}>
                      {panelMap[arrangementWidgetAssignments[cell.name] as keyof typeof panelMap] ?? <DashboardWidgetPlaceHolder />}
                    </DashboardZoneContext>
                  )
                  : renderArrangement(cell)}
              </Panel>
              {!isLast && orientation === 'horizontal' && <PanelSeparatorVertical disabled={disabled} />}
              {!isLast && orientation === 'vertical' && <PanelSeparatorHorizontal disabled={disabled} />}
            </Fragment>
          );
        })}
      </Group>
    );
  };

  return renderArrangement(arrangement);
};
