import {
  Alert,
  AlertTitle,
  Box,
  Button,
  ListItemIcon,
  ListItemText,
  MenuItem,
  useTheme,
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LinkIcon from '@mui/icons-material/Link';
import type { ReactElement } from 'react';
import {
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { useDebouncedCallback } from 'use-debounce';
import type { CaseDbRetrievePhylogeneticTreeRequestBody } from '@gen-epix/api-casedb';
import { CaseDbCaseApi } from '@gen-epix/api-casedb';
import type { MenuItemData } from '@gen-epix/ui';
import {
  ConfigService,
  Spinner,
  Subject,
  useQueryMemo,
} from '@gen-epix/ui';

import { EventBusService } from '../../../classes/services/EventBusService';
import type {
  DashboardTreeSettings,
  TreeConfiguration,
  TreeWidgetData,
  TreeWidgetDataPersistable,
} from '../../../models/dashboard';
import type { Highlighting } from '../../../models/caseDb';
import { DashboardStoreContext } from '../../../stores/dashboardStore';
import { SELECTION_FILTER_GROUP } from '../../../utils/CaseTypeUtil';
import { CaseDbDownloadUtil } from '../../../utils/CaseDbDownloadUtil';
import { TreeUtil } from '../../../utils/TreeUtil';
import type { ContextMenuConfigWithPosition } from '../ContextMenu';
import { ContextMenu } from '../ContextMenu';
import { TreeDescription } from '../TreeDescription';
import { WidgetUnavailable } from '../WidgetUnavailable';
import { PhylogeneticTreeComponent } from '../PhylogeneticTreeComponent';
import type {
  PhylogeneticTreeComponentPathClickEvent,
  PhylogeneticTreeComponentRef,
  PhylogeneticTreeComponentViewState,
} from '../PhylogeneticTreeComponent';
import { CASEDB_QUERY_KEY } from '../../../data/query';
import type { CaseDbConfig } from '../../../models/config';
import { TreeFilter } from '../../../classes/filters/TreeFilter';
import { DashboardWidget } from '../Dashboard';
import { DASHBOARD_WIDGET_NAME } from '../../../data/dashboard';
import { DashboardContext } from '../Dashboard/context/DashboardContext';
import { UserProfileStoreContext } from '../../../stores/userProfileStore/userProfileStoreContext';

type ZoomInMenuItemConfig = {
  caseIds?: string[];
  rootId?: string;
};

export const TreeWidget = () => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [treeCanvas, setTreeCanvas] = useState<HTMLCanvasElement>();
  const [isTreeLinked, setIsTreeLinked] = useState(true);
  const treeRef = useRef<PhylogeneticTreeComponentRef>(null);
  const dashboardStore = use(DashboardStoreContext);
  const dashboardContext = use(DashboardContext);
  const userProfileStore = use(UserProfileStoreContext);
  const setPhylogeneticTreeResponse = useStore(dashboardStore, (state) => state.setPhylogeneticTreeResponse);
  const baseData = useStore(dashboardStore, (state) => state.baseData);
  const sortedData = useStore(dashboardStore, (state) => state.sortedData);
  const filteredCases = useStore(dashboardStore, (state) => state.filteredData[SELECTION_FILTER_GROUP]);
  const setSorting = useStore(dashboardStore, (state) => state.setSorting);
  const tree = useStore(dashboardStore, (state) => state.tree);
  const sortByField = useStore(dashboardStore, (state) => state.sortByField);
  const stratification = useStore(dashboardStore, (state) => state.stratification);
  const completeCaseType = useStore(dashboardStore, (state) => state.completeCaseType);
  const hasActiveTreeFilter = useStore(dashboardStore, (state) => !state.filters.find(filter => filter instanceof TreeFilter).isInitialFilterValue());
  const addTreeFilter = useStore(dashboardStore, (state) => state.addTreeFilter);
  const treeFilterStepOut = useStore(dashboardStore, (state) => state.treeFilterStepOut);
  const updateWidgetData = useStore(dashboardStore, (state) => state.updateWidgetData);
  const updateWidgetDataPersistable = useStore(dashboardStore, (state) => state.updateWidgetDataPersistable);
  const removeTreeFilter = useStore(dashboardStore, (state) => state.removeTreeFilter);
  const isCaseDataLoading = useStore(dashboardStore, (state) => state.isDataLoading);
  const newick = useStore(dashboardStore, (state) => state.newick);
  const resetTreeAddresses = useStore(dashboardStore, (state) => state.resetTreeAddresses);
  const isShowDistancesEnabled = useStore(userProfileStore, (state) => (state.dashboardWidgetSettings[DASHBOARD_WIDGET_NAME.TREE] as DashboardTreeSettings).isShowDistancesEnabled);
  const isShowSupportLinesWhenUnlinkedEnabled = useStore(userProfileStore, (state) => (state.dashboardWidgetSettings[DASHBOARD_WIDGET_NAME.TREE] as DashboardTreeSettings).isShowSupportLinesWhenUnlinkedEnabled);
  const [contextMenuConfig, setContextMenuConfig] = useState<ContextMenuConfigWithPosition | null>(null);
  const [zoomInMenuItemConfig, setZoomInMenuItemConfig] = useState<ZoomInMenuItemConfig>(null);
  const [extraLeafInfoId, setExtraLeafInfoId] = useState<string>(null);
  const [treeConfiguration, setTreeConfiguration] = useState<TreeConfiguration>(dashboardStore.getState().getWidgetDataPersistable<TreeWidgetDataPersistable>(DASHBOARD_WIDGET_NAME.TREE).treeConfiguration);
  const treeHighlightingSubject = useMemo(() => new Subject<Highlighting>({
    caseIds: [],
    origin: null,
  }), []);
  const initialTreeViewState = useMemo<PhylogeneticTreeComponentViewState>(() => {
    const widgetData = dashboardStore.getState().getWidgetData<TreeWidgetData>(DASHBOARD_WIDGET_NAME.TREE);
    return {
      horizontalScrollPosition: !isNaN(widgetData?.horizontalScrollPosition) ? widgetData.horizontalScrollPosition : 0,
      verticalScrollPosition: !isNaN(widgetData?.verticalScrollPosition) ? widgetData.verticalScrollPosition : 0,
      zoomLevel: !isNaN(widgetData?.zoomLevel) ? widgetData.zoomLevel : 1,
    };
  }, [dashboardStore]);

  const sortedLeafNames = useMemo(() => {
    return sortedData.map(c => c.id);
  }, [sortedData]);

  const treeConfigurations = useMemo(() => TreeUtil.getTreeConfigurations(completeCaseType), [completeCaseType]);

  const treeCanvasAriaLabel = useMemo(() => {
    if (!treeConfiguration) {
      return t('Phylogenetic tree visualization');
    }

    const label = treeConfiguration.col?.label || t('data');
    const geneticDistanceProtocol = treeConfiguration.geneticDistanceProtocol?.name || t('unknown protocol');
    const treeAlgorithm = treeConfiguration.treeAlgorithm?.name || t('unknown algorithm');

    return t('Figure of a phylogenetic tree belonging to {{label}}. Generated using {{geneticDistanceProtocol}} and {{treeAlgorithm}}.', {
      geneticDistanceProtocol,
      label,
      treeAlgorithm,
    });
  }, [treeConfiguration, t]);

  useEffect(() => {
    const unsubscribeHighlightingManager = dashboardContext.highlightSubject.subscribe((highlighting) => {
      if (highlighting.origin === DASHBOARD_WIDGET_NAME.TREE) {
        return;
      }
      treeHighlightingSubject.next(highlighting);
    });
    const unsubscribeTreeHighlightingSubject = treeHighlightingSubject.subscribe((highlighting) => {
      if (highlighting.origin !== DASHBOARD_WIDGET_NAME.TREE) {
        return;
      }
      dashboardContext.highlight(highlighting);
    });

    return () => {
      unsubscribeHighlightingManager();
      unsubscribeTreeHighlightingSubject();
    };
  }, [dashboardContext, treeHighlightingSubject]);

  const caseIds = useMemo(() => filteredCases.map(c => c.id).sort(), [filteredCases]);

  useEffect(() => {
    resetTreeAddresses();
  }, [caseIds, resetTreeAddresses]);

  const hasEnoughSequencesToShowTree = useMemo(() => caseIds.length >= 2 && caseIds.every(x => !!x), [caseIds]);
  const hasToManyResultsToShowTree = useMemo(() => caseIds.length > 0 && completeCaseType.props.read_max_tree_size > 0 && caseIds.length > completeCaseType.props.read_max_tree_size, [caseIds, completeCaseType.props.read_max_tree_size]);

  const retrievePhylogeneticTreeRequestBody = useMemo<CaseDbRetrievePhylogeneticTreeRequestBody>(() => ({
    case_ids: caseIds,
    case_type_id: completeCaseType.id,
    genetic_distance_col_id: treeConfiguration?.col.id,
    tree_algorithm_code: treeConfiguration?.treeAlgorithm.code,
  }), [caseIds, completeCaseType.id, treeConfiguration]);

  const { data: treeData, error: treeError, isLoading: isTreeLoading } = useQueryMemo({
    enabled: hasEnoughSequencesToShowTree && !!treeConfiguration && !hasToManyResultsToShowTree,
    queryFn: async ({ signal }) => {
      const response = await CaseDbCaseApi.getInstance().retrievePhylogeneticTree(retrievePhylogeneticTreeRequestBody, { signal });
      return response.data;
    },
    queryKey: [CASEDB_QUERY_KEY.PHYLOGENETIC_TREE, JSON.stringify(retrievePhylogeneticTreeRequestBody)],
    retry: false,
    staleTime: Infinity,
  });

  const isLoading = !!treeConfiguration && (isCaseDataLoading || (hasEnoughSequencesToShowTree && isTreeLoading));
  const isTreeUnavailable = hasToManyResultsToShowTree || !isCaseDataLoading && ((!isLoading && !!treeError) || !hasEnoughSequencesToShowTree || tree?.maxBranchLength?.toNumber() === 0 || tree?.size === 0 || !treeConfiguration || (!isLoading && tree === null));
  const shouldShowTree = !hasToManyResultsToShowTree && !!treeConfiguration && !isCaseDataLoading && !treeError && !isTreeLoading && tree?.size > 0 && hasEnoughSequencesToShowTree;

  useEffect(() => {
    if (treeData) {
      setPhylogeneticTreeResponse(treeData);
    }
  }, [treeData, setPhylogeneticTreeResponse]);

  useEffect(() => {
    if (!treeConfigurations?.length) {
      setTreeConfiguration(null);
      updateWidgetDataPersistable<TreeWidgetDataPersistable>(DASHBOARD_WIDGET_NAME.TREE, {
        treeConfiguration: null,
      });
      return;
    }
    const newConfig = dashboardStore.getState().getWidgetDataPersistable<TreeWidgetDataPersistable>(DASHBOARD_WIDGET_NAME.TREE)?.treeConfiguration || treeConfigurations[0];

    setTreeConfiguration(newConfig);
    updateWidgetDataPersistable<TreeWidgetDataPersistable>(DASHBOARD_WIDGET_NAME.TREE, {
      treeConfiguration: newConfig,
    });
  }, [dashboardStore, treeConfigurations, updateWidgetDataPersistable]);

  useEffect(() => {
    if (sortByField && isTreeLinked && shouldShowTree) {
      treeRef.current?.unlink({
        positionX: 0,
        positionY: 0,
        zoomLevel: ConfigService.getInstance<CaseDbConfig>().config.tree.INITIAL_UNLINKED_ZOOM_LEVEL,
      });
    }
  }, [isTreeLinked, shouldShowTree, sortByField]);

  const updateEpiTreeWidgetDataDebounced = useDebouncedCallback((viewState: PhylogeneticTreeComponentViewState) => {
    updateWidgetData<TreeWidgetData>(DASHBOARD_WIDGET_NAME.TREE, {
      horizontalScrollPosition: viewState.horizontalScrollPosition,
      verticalScrollPosition: viewState.verticalScrollPosition,
      zoomLevel: viewState.zoomLevel,
    });
  }, 500);

  const onTreeViewStateChange = useCallback((viewState: PhylogeneticTreeComponentViewState) => {
    updateEpiTreeWidgetDataDebounced(viewState);
  }, [updateEpiTreeWidgetDataDebounced]);

  const onTreeCanvasChange = useCallback((canvas?: HTMLCanvasElement) => {
    setTreeCanvas(canvas);
  }, []);

  const onEpiContextMenuClose = useCallback(() => {
    setContextMenuConfig(null);
    setZoomInMenuItemConfig(null);
  }, []);

  const linkLineListToTree = useCallback(() => {
    const perform = async () => {
      await setSorting(null, null);
      treeRef.current?.syncExternalScrollToVisibleTree();
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    perform();

  }, [setSorting]);

  const onLinkButtonClick = useCallback(() => {
    linkLineListToTree();

  }, [linkLineListToTree]);

  const onOpenFiltersButtonClick = useCallback(() => {
    EventBusService.getInstance().emit('openFiltersMenu');
  }, []);

  const resetZoomLevelAndScrollPosition = useCallback(() => {
    treeRef.current?.link(0);
  }, []);

  const onAddTreeFilterMenuItemClick = useCallback(async (onMenuClose: () => void) => {
    await addTreeFilter(zoomInMenuItemConfig.rootId);
    resetZoomLevelAndScrollPosition();
    onMenuClose();
  }, [addTreeFilter, zoomInMenuItemConfig, resetZoomLevelAndScrollPosition]);

  const onRemoveTreeFilterButtonClick = useCallback(async () => {
    await removeTreeFilter();
    resetZoomLevelAndScrollPosition();
  }, [removeTreeFilter, resetZoomLevelAndScrollPosition]);

  const onTreeFilterStepOutButtonClick = useCallback(async () => {
    await treeFilterStepOut();
    resetZoomLevelAndScrollPosition();
  }, [resetZoomLevelAndScrollPosition, treeFilterStepOut]);

  const onTreePathClick = useCallback(({ mouseEvent, pathProperties }: PhylogeneticTreeComponentPathClickEvent) => {
    setZoomInMenuItemConfig(null);
    setExtraLeafInfoId(null);

    if (pathProperties?.treeNode) {
      const { treeNode } = pathProperties;
      setContextMenuConfig({
        caseIds: treeNode.subTreeLeaveNames ? treeNode.subTreeLeaveNames : [treeNode.name],
        mouseEvent,
        position: {
          left: mouseEvent.clientX,
          top: mouseEvent.clientY,
        },
      });
      if (treeNode.subTreeNames.length && treeNode.name && treeNode.maxBranchLength.toNumber()) {
        setZoomInMenuItemConfig({
          caseIds: treeNode.subTreeLeaveNames,
          rootId: treeNode.name,
        });
      }
      if (treeNode.name && !treeNode.subTreeNames.length) {
        setExtraLeafInfoId(treeNode.name);
      }
      return;
    }

    if (pathProperties?.subTreeLeaveNames?.length) {
      setContextMenuConfig({
        caseIds: pathProperties.subTreeLeaveNames,
        mouseEvent,
        position: {
          left: mouseEvent.clientX,
          top: mouseEvent.clientY,
        },
      });
    }
  }, []);

  const onShowDetailsSelectionMenuItemClick = useCallback((onMenuClose: () => void) => {
    EventBusService.getInstance().emit('openCaseInfoDialog', {
      caseId: baseData.find(c => c.id === extraLeafInfoId).id,
      caseTypeId: completeCaseType.id,
    });
    onMenuClose();
  }, [extraLeafInfoId, baseData, completeCaseType.id]);

  const getEpiContextMenuExtraItems = useCallback((onMenuClose: () => void): ReactElement => {
    if (zoomInMenuItemConfig) {
      return (
        <MenuItem
          divider
          // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
          onClick={async () => onAddTreeFilterMenuItemClick(onMenuClose)}
        >
          <ListItemIcon>
            <FilterAltIcon fontSize={'small'} />
          </ListItemIcon>
          <ListItemText>
            {t`Filter (show only this subtree)`}
          </ListItemText>
        </MenuItem>
      );
    }
    if (extraLeafInfoId) {
      return (
        <MenuItem
          divider
          // eslint-disable-next-line @eslint-react/kit/jsx-no-bind
          onClick={() => onShowDetailsSelectionMenuItemClick(onMenuClose)}
        >
          <ListItemIcon>
            <InfoOutlinedIcon fontSize={'small'} />
          </ListItemIcon>
          <ListItemText>
            {t`Show details`}
          </ListItemText>
        </MenuItem>
      );
    }
  }, [extraLeafInfoId, onShowDetailsSelectionMenuItemClick, onAddTreeFilterMenuItemClick, t, zoomInMenuItemConfig]);

  const titleMenu = useMemo<MenuItemData | string>(() => {
    if (!treeConfigurations?.length) {
      return t`Tree`;
    }

    const menu: MenuItemData = {
      disabled: !treeConfiguration,
      items: treeConfigurations?.map<MenuItemData>(config => ({
        active: !!treeConfiguration && treeConfiguration.computedId === config.computedId,
        callback: () => {
          const perform = async () => {
            await removeTreeFilter();
            updateWidgetDataPersistable<TreeWidgetDataPersistable>(DASHBOARD_WIDGET_NAME.TREE, {
              treeConfiguration: config,
            });
            setTreeConfiguration(config);
          };
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          perform();
        },
        label: TreeUtil.getTreeConfigurationLabel(config),
        tooltip: (
          <TreeDescription
            treeConfiguration={config}
          />
        ),
      })) ?? [],
      label: treeConfiguration ? t('Tree: {{algorithm}}', { algorithm: TreeUtil.getTreeConfigurationLabel(treeConfiguration) }) : t`Tree`,
      tooltip: treeConfiguration
        ? (
          <TreeDescription
            treeConfiguration={treeConfiguration}
          />
        )
        : undefined,
    };

    return menu;
  }, [treeConfigurations, treeConfiguration, t, removeTreeFilter, updateWidgetDataPersistable]);

  const primaryMenu = useMemo<MenuItemData[]>(() => {
    return [
      {
        callback: onTreeFilterStepOutButtonClick,
        disabled: !hasActiveTreeFilter,
        label: t`Change tree filter to nearest ancestor`,
        leftIcon: <ArrowUpwardIcon />,
      },
      {
        callback: onRemoveTreeFilterButtonClick,
        disabled: !hasActiveTreeFilter,
        label: t`Remove tree filter`,
        leftIcon: <ClearIcon />,
      },
      {
        callback: onLinkButtonClick,
        label: t`Link and snap the Line List to the Tree (resets tree zoom level and Line List sorting)`,
        leftIcon: (
          <LinkIcon
            sx={{
              color: isTreeLinked ? undefined : theme.palette.error.main,
            }}
          />
        ),
      },
    ];
  }, [hasActiveTreeFilter, isTreeLinked, onLinkButtonClick, onRemoveTreeFilterButtonClick, onTreeFilterStepOutButtonClick, t, theme.palette.error.main]);

  useEffect(() => {
    const emitDownloadOptions = () => {
      const baseName = t('Phylogenetic Tree - {{geneticDistanceProtocol}} - {{treeAlgorithm}}',
        {
          geneticDistanceProtocol: treeConfiguration?.geneticDistanceProtocol.name ?? '',
          treeAlgorithm: treeConfiguration?.treeAlgorithm.name ?? '',
        });

      EventBusService.getInstance().emit('onDownloadOptionsChanged', {
        disabled: isTreeUnavailable,
        items: [
          {
            callback: () => CaseDbDownloadUtil.downloadNewick(baseName, newick, completeCaseType, t),
            label: t`Save as Newick`,
          },
          {
            callback: () => CaseDbDownloadUtil.downloadCanvasImage(baseName, treeCanvas, 'jpeg', completeCaseType, t),
            label: t`Save as JPEG`,
          },
          {
            callback: () => CaseDbDownloadUtil.downloadCanvasImage(baseName, treeCanvas, 'png', completeCaseType, t),
            label: t`Save as PNG`,
          },
        ],
        zone: DASHBOARD_WIDGET_NAME.TREE,
        zoneLabel: t`Phylogenetic Tree`,
      });
    };


    emitDownloadOptions();
    const eventBusService = EventBusService.getInstance();
    eventBusService.addEventListener('onDownloadOptionsRequested', emitDownloadOptions);

    return () => {
      eventBusService.emit('onDownloadOptionsChanged', {
        items: null,
        zone: DASHBOARD_WIDGET_NAME.TREE,
        zoneLabel: t`Tree`,
      });
      eventBusService.removeEventListener('onDownloadOptionsRequested', emitDownloadOptions);
    };
  }, [completeCaseType, isTreeLinked, isTreeUnavailable, newick, t, treeCanvas, treeConfiguration?.geneticDistanceProtocol.name, treeConfiguration?.treeAlgorithm.name]);


  useEffect(() => {
    // eslint-disable-next-line @eslint-react/web-api-no-leaked-event-listener
    const removeEventListener = EventBusService.getInstance().addEventListener('onLinkLineListAndTree', () => treeRef.current?.link());
    return () => {
      removeEventListener();
    };
  }, []);


  const onLinkStateChange = useCallback((linked: boolean) => {
    setIsTreeLinked(linked);
  }, [setIsTreeLinked]);

  return (
    <DashboardWidget
      expandDisabled={isTreeUnavailable}
      primaryMenu={primaryMenu}
      title={titleMenu}
      widgetName={DASHBOARD_WIDGET_NAME.TREE}
    >
      <Box
        sx={{
          height: '100%',
          overflow: 'clip',
          position: 'relative',
          width: '100%',
        }}
      >
        {isTreeUnavailable && (
          <>
            {hasToManyResultsToShowTree && (
              <Box>
                <Alert severity={'warning'}>
                  <AlertTitle>
                    {t`Too many cases to display the phylogenetic tree`}
                  </AlertTitle>
                  <Box
                    sx={{
                      marginY: 2,
                    }}
                  >
                    {t('The phylogenetic tree cannot be displayed because the number of cases ({{caseCount}}) exceeds the maximum allowed number of cases ({{maxSize}}) to display a phylogenetic tree. Refine your filters to reduce the number of results.', {
                      caseCount: caseIds.length,
                      maxSize: completeCaseType.props.read_max_tree_size,
                    })}
                  </Box>
                  <Button
                    color={'inherit'}
                    onClick={onOpenFiltersButtonClick}
                    variant={'outlined'}
                  >
                    {t`Refine filters`}
                  </Button>
                </Alert>
              </Box>
            )}
            {!hasToManyResultsToShowTree && (
              <Box
                sx={{
                  position: 'absolute',
                  zIndex: 1,
                }}
              >
                <WidgetUnavailable
                  widgetLabel={t`Phylogenetic Tree`}
                />
              </Box>
            )}
          </>
        )}
        {(isLoading && !isTreeUnavailable) && (
          <Spinner
            label={t`Loading`}
            takingLongerTimeoutMs={ConfigService.getInstance<CaseDbConfig>().config.tree.TAKING_LONGER_TIMEOUT_MS}
          />
        )}
        {!isTreeUnavailable && shouldShowTree && (
          <PhylogeneticTreeComponent
            ariaLabel={treeCanvasAriaLabel}
            externalScrollSubject={dashboardContext.linkedScrollSubject}
            externalVisibleRangeSubject={dashboardContext.lineListRangeSubject}
            highlightingSubject={dashboardContext.highlightSubject}
            initialViewState={initialTreeViewState}
            itemHeight={ConfigService.getInstance<CaseDbConfig>().config.lineList.TABLE_ROW_HEIGHT}
            leafOrder={sortedLeafNames}
            onCanvasChange={onTreeCanvasChange}
            onLinkStateChange={onLinkStateChange}
            onPathClick={onTreePathClick}
            onViewStateChange={onTreeViewStateChange}
            ref={treeRef}
            shouldShowDistances={isShowDistancesEnabled}
            shouldShowSupportLinesWhenUnlinked={isShowSupportLinesWhenUnlinkedEnabled}
            stratification={stratification}
            tree={tree}
          />
        )}
      </Box>
      <ContextMenu
        config={contextMenuConfig}
        getExtraItems={getEpiContextMenuExtraItems}
        onMenuClose={onEpiContextMenuClose}
      />
    </DashboardWidget>
  );
};
