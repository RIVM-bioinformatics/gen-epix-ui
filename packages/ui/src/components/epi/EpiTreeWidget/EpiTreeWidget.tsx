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
import type {
  ReactElement,
  Ref,
} from 'react';
import {
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { useDebouncedCallback } from 'use-debounce';

import type { RetrievePhylogeneticTreeRequestBody } from '../../../api';
import { CaseApi } from '../../../api';
import { TreeFilter } from '../../../classes/filters/TreeFilter';
import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { EpiEventBusManager } from '../../../classes/managers/EpiEventBusManager';
import { EpiHighlightingManager } from '../../../classes/managers/EpiHighlightingManager';
import { Subject } from '../../../classes/Subject';
import type {
  EpiLineListRangeSubjectValue,
  EpiLinkedScrollSubjectValue,
  Highlighting,
  TreeConfiguration,
} from '../../../models/epi';
import { EPI_ZONE } from '../../../models/epi';
import type { MenuItemData } from '../../../models/nestedMenu';
import { useQueryMemo } from '../../../hooks/useQueryMemo';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { userProfileStore } from '../../../stores/userProfileStore';
import { SELECTION_FILTER_GROUP } from '../../../utils/CaseTypeUtil';
import { DownloadUtil } from '../../../utils/DownloadUtil';
import { EpiTreeUtil } from '../../../utils/EpiTreeUtil';
import { QueryUtil } from '../../../utils/QueryUtil';
import { Spinner } from '../../ui/Spinner';
import type { EpiContextMenuConfigWithPosition } from '../EpiContextMenu';
import { EpiContextMenu } from '../EpiContextMenu';
import { EpiTreeDescription } from '../EpiTreeDescription';
import { EpiWidget } from '../EpiWidget';
import { EpiWidgetUnavailable } from '../EpiWidgetUnavailable';
import type {
  PhylogeneticTreeComponentPathClickEvent,
  PhylogeneticTreeComponentRef,
  PhylogeneticTreeComponentViewState,
} from '../../ui/PhylogeneticTreeComponent';
import { PhylogeneticTreeComponent } from '../../ui/PhylogeneticTreeComponent';

type ZoomInMenuItemConfig = {
  caseIds?: string[];
  rootId?: string;
};

type EpiTreeWidgetProps = {
  readonly linkedScrollSubject: Subject<EpiLinkedScrollSubjectValue>;
  readonly lineListRangeSubject: Subject<EpiLineListRangeSubjectValue>;
  readonly ref: Ref<EpiTreeWidgetRef>;
  readonly itemHeight: number;
};

export interface EpiTreeWidgetRef {
  link: () => void;
}

export const EpiTreeWidget = ({ linkedScrollSubject, lineListRangeSubject, ref, itemHeight }: EpiTreeWidgetProps) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [treeCanvas, setTreeCanvas] = useState<HTMLCanvasElement>();
  const [isTreeLinked, setIsTreeLinked] = useState(true);
  const treeRef = useRef<PhylogeneticTreeComponentRef>(null);
  const highlightingManager = useMemo(() => EpiHighlightingManager.instance, []);
  const epiDashboardStore = useContext(EpiDashboardStoreContext);
  const setPhylogeneticTreeResponse = useStore(epiDashboardStore, (state) => state.setPhylogeneticTreeResponse);
  const baseData = useStore(epiDashboardStore, (state) => state.baseData);
  const sortedData = useStore(epiDashboardStore, (state) => state.sortedData);
  const filteredCases = useStore(epiDashboardStore, (state) => state.filteredData[SELECTION_FILTER_GROUP]);
  const setSorting = useStore(epiDashboardStore, (state) => state.setSorting);
  const tree = useStore(epiDashboardStore, (state) => state.tree);
  const sortByField = useStore(epiDashboardStore, (state) => state.sortByField);
  const stratification = useStore(epiDashboardStore, (state) => state.stratification);
  const completeCaseType = useStore(epiDashboardStore, (state) => state.completeCaseType);
  const hasActiveTreeFilter = useStore(epiDashboardStore, (state) => !state.filters.find(filter => filter instanceof TreeFilter).isInitialFilterValue());
  const addTreeFilter = useStore(epiDashboardStore, (state) => state.addTreeFilter);
  const treeFilterStepOut = useStore(epiDashboardStore, (state) => state.treeFilterStepOut);
  const updateEpiTreeWidgetData = useStore(epiDashboardStore, (state) => state.updateEpiTreeWidgetData);
  const removeTreeFilter = useStore(epiDashboardStore, (state) => state.removeTreeFilter);
  const isCaseDataLoading = useStore(epiDashboardStore, (state) => state.isDataLoading);
  const newick = useStore(epiDashboardStore, (state) => state.newick);
  const resetTreeAddresses = useStore(epiDashboardStore, (state) => state.resetTreeAddresses);
  const isShowDistancesEnabled = useStore(userProfileStore, (state) => state.epiDashboardTreeSettings.isShowDistancesEnabled);
  const isShowSupportLinesWhenUnlinkedEnabled = useStore(userProfileStore, (state) => state.epiDashboardTreeSettings.isShowSupportLinesWhenUnlinkedEnabled);
  const [epiContextMenuConfig, setEpiContextMenuConfig] = useState<EpiContextMenuConfigWithPosition | null>(null);
  const [zoomInMenuItemConfig, setZoomInMenuItemConfig] = useState<ZoomInMenuItemConfig>(null);
  const [extraLeafInfoId, setExtraLeafInfoId] = useState<string>(null);
  const [treeConfiguration, setTreeConfiguration] = useState<TreeConfiguration>(epiDashboardStore.getState().epiTreeWidgetData.treeConfiguration);
  const treeHighlightingSubject = useMemo(() => new Subject<Highlighting>({
    caseIds: [],
    origin: null,
  }), []);
  const initialTreeViewState = useMemo<PhylogeneticTreeComponentViewState>(() => ({
    zoomLevel: !isNaN(epiDashboardStore.getState().epiTreeWidgetData.zoomLevel) ? epiDashboardStore.getState().epiTreeWidgetData.zoomLevel : 1,
    horizontalScrollPosition: !isNaN(epiDashboardStore.getState().epiTreeWidgetData.horizontalScrollPosition) ? epiDashboardStore.getState().epiTreeWidgetData.horizontalScrollPosition : 0,
    verticalScrollPosition: !isNaN(epiDashboardStore.getState().epiTreeWidgetData.verticalScrollPosition) ? epiDashboardStore.getState().epiTreeWidgetData.verticalScrollPosition : 0,
  }), [epiDashboardStore]);

  const sortedLeafNames = useMemo(() => {
    return sortedData.map(c => c.id);
  }, [sortedData]);

  const treeConfigurations = useMemo(() => EpiTreeUtil.getTreeConfigurations(completeCaseType), [completeCaseType]);

  const treeCanvasAriaLabel = useMemo(() => {
    if (!treeConfiguration) {
      return t('Phylogenetic tree visualization');
    }

    const label = treeConfiguration.col?.label || t('data');
    const geneticDistanceProtocol = treeConfiguration.geneticDistanceProtocol?.name || t('unknown protocol');
    const treeAlgorithm = treeConfiguration.treeAlgorithm?.name || t('unknown algorithm');

    return t('Figure of a phylogenetic tree belonging to {{label}}. Generated using {{geneticDistanceProtocol}} and {{treeAlgorithm}}.', {
      label,
      geneticDistanceProtocol,
      treeAlgorithm,
    });
  }, [treeConfiguration, t]);

  useEffect(() => {
    const unsubscribeHighlightingManager = highlightingManager.subscribe((highlighting) => {
      if (highlighting.origin === EPI_ZONE.TREE) {
        return;
      }
      treeHighlightingSubject.next(highlighting);
    });
    const unsubscribeTreeHighlightingSubject = treeHighlightingSubject.subscribe((highlighting) => {
      if (highlighting.origin !== EPI_ZONE.TREE) {
        return;
      }
      highlightingManager.highlight(highlighting);
    });

    return () => {
      unsubscribeHighlightingManager();
      unsubscribeTreeHighlightingSubject();
    };
  }, [highlightingManager, treeHighlightingSubject]);

  const caseIds = useMemo(() => filteredCases.map(c => c.id).sort(), [filteredCases]);

  useEffect(() => {
    resetTreeAddresses();
  }, [caseIds, resetTreeAddresses]);

  const hasEnoughSequencesToShowTree = useMemo(() => caseIds.length >= 2 && caseIds.every(x => !!x), [caseIds]);
  const hasToManyResultsToShowTree = useMemo(() => caseIds.length > 0 && completeCaseType.props.read_max_tree_size > 0 && caseIds.length > completeCaseType.props.read_max_tree_size, [caseIds, completeCaseType.props.read_max_tree_size]);

  const retrievePhylogeneticTreeRequestBody = useMemo<RetrievePhylogeneticTreeRequestBody>(() => ({
    case_ids: caseIds,
    genetic_distance_col_id: treeConfiguration?.col.id,
    tree_algorithm_code: treeConfiguration?.treeAlgorithm.code,
    case_type_id: completeCaseType.id,
  }), [caseIds, completeCaseType.id, treeConfiguration?.col.id, treeConfiguration?.treeAlgorithm.code]);

  const { isLoading: isTreeLoading, error: treeError, data: treeData } = useQueryMemo({
    queryKey: QueryUtil.getRetrievePhylogeneticTreeKey(retrievePhylogeneticTreeRequestBody),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.instance.retrievePhylogeneticTree(retrievePhylogeneticTreeRequestBody, { signal });
      return response.data;
    },
    enabled: hasEnoughSequencesToShowTree && !!treeConfiguration && !hasToManyResultsToShowTree,
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
      updateEpiTreeWidgetData({
        treeConfiguration: null,
      });
      return;
    }
    const newConfig = epiDashboardStore.getState().epiTreeWidgetData.treeConfiguration || treeConfigurations[0];

    setTreeConfiguration(newConfig);
    updateEpiTreeWidgetData({
      treeConfiguration: newConfig,
    });
  }, [epiDashboardStore, treeConfigurations, updateEpiTreeWidgetData]);

  useEffect(() => {
    if (sortByField && isTreeLinked && shouldShowTree) {
      treeRef.current?.unlink({
        positionX: 0,
        positionY: 0,
        zoomLevel: ConfigManager.instance.config.epiTree.INITIAL_UNLINKED_ZOOM_LEVEL,
      });
    }
  }, [isTreeLinked, shouldShowTree, sortByField]);

  const updateEpiTreeWidgetDataDebounced = useDebouncedCallback((viewState: PhylogeneticTreeComponentViewState) => {
    updateEpiTreeWidgetData({
      zoomLevel: viewState.zoomLevel,
      verticalScrollPosition: viewState.verticalScrollPosition,
      horizontalScrollPosition: viewState.horizontalScrollPosition,
    });
  }, 500);

  const onTreeViewStateChange = useCallback((viewState: PhylogeneticTreeComponentViewState) => {
    updateEpiTreeWidgetDataDebounced(viewState);
  }, [updateEpiTreeWidgetDataDebounced]);

  const onTreeCanvasChange = useCallback((canvas?: HTMLCanvasElement) => {
    setTreeCanvas(canvas);
  }, []);

  const onEpiContextMenuClose = useCallback(() => {
    setEpiContextMenuConfig(null);
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
    EpiEventBusManager.instance.emit('openFiltersMenu');
  }, []);

  const resetZoomLevelAndScrollPosition = useCallback(() => {
    treeRef.current?.link(0);
  }, []);

  const onAddTreeFilterMenuItemClick = useCallback(async (onMenuClose: () => void) => {
    await addTreeFilter(zoomInMenuItemConfig.rootId);
    resetZoomLevelAndScrollPosition();
    onMenuClose();
  }, [addTreeFilter, zoomInMenuItemConfig?.rootId, resetZoomLevelAndScrollPosition]);

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
      setEpiContextMenuConfig({
        position: {
          left: mouseEvent.clientX,
          top: mouseEvent.clientY,
        },
        caseIds: treeNode.subTreeLeaveNames ? treeNode.subTreeLeaveNames : [treeNode.name],
        mouseEvent,
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
      setEpiContextMenuConfig({
        position: {
          left: mouseEvent.clientX,
          top: mouseEvent.clientY,
        },
        caseIds: pathProperties.subTreeLeaveNames,
        mouseEvent,
      });
    }
  }, []);

  const onShowDetailsSelectionMenuItemClick = useCallback((onMenuClose: () => void) => {
    EpiEventBusManager.instance.emit('openCaseInfoDialog', {
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
          // eslint-disable-next-line react/jsx-no-bind
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
          // eslint-disable-next-line react/jsx-no-bind
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
      label: treeConfiguration ? t('Tree: {{algorithm}}', { algorithm: EpiTreeUtil.getTreeConfigurationLabel(treeConfiguration) }) : t`Tree`,
      tooltip: treeConfiguration
        ? (
          <EpiTreeDescription
            treeConfiguration={treeConfiguration}
          />
        )
        : undefined,
      disabled: !treeConfiguration,
      items: treeConfigurations?.map<MenuItemData>(config => ({
        label: EpiTreeUtil.getTreeConfigurationLabel(config),
        callback: () => {
          const perform = async () => {
            await removeTreeFilter();
            updateEpiTreeWidgetData({
              treeConfiguration: config,
            });
            setTreeConfiguration(config);
          };
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          perform();
        },
        active: !!treeConfiguration && treeConfiguration.computedId === config.computedId,
        tooltip: (
          <EpiTreeDescription
            treeConfiguration={config}
          />
        ),
      })) ?? [],
    };

    return menu;
  }, [treeConfigurations, treeConfiguration, t, removeTreeFilter, updateEpiTreeWidgetData]);

  const primaryMenu = useMemo<MenuItemData[]>(() => {
    return [
      {
        disabled: !hasActiveTreeFilter,
        label: t`Change tree filter to nearest ancestor`,
        leftIcon: <ArrowUpwardIcon />,
        callback: onTreeFilterStepOutButtonClick,
      },
      {
        disabled: !hasActiveTreeFilter,
        label: t`Remove tree filter`,
        leftIcon: <ClearIcon />,
        callback: onRemoveTreeFilterButtonClick,
      },
      {
        label: t`Link and snap the Line List to the Tree (resets tree zoom level and Line List sorting)`,
        leftIcon: (
          <LinkIcon
            sx={{
              color: isTreeLinked ? undefined : theme.palette.error.main,
            }}
          />
        ),
        callback: onLinkButtonClick,
      },
    ];
  }, [hasActiveTreeFilter, isTreeLinked, onLinkButtonClick, onRemoveTreeFilterButtonClick, onTreeFilterStepOutButtonClick, t, theme.palette.error.main]);

  useEffect(() => {
    const emitDownloadOptions = () => {
      const baseName = t('Phylogenetic Tree - {{geneticDistanceProtocol}} - {{treeAlgorithm}}',
        {
          treeAlgorithm: treeConfiguration?.treeAlgorithm.name ?? '',
          geneticDistanceProtocol: treeConfiguration?.geneticDistanceProtocol.name ?? '',
        });

      EpiEventBusManager.instance.emit('onDownloadOptionsChanged', {
        zone: EPI_ZONE.TREE,
        disabled: isTreeUnavailable,
        zoneLabel: t`Phylogenetic Tree`,
        items: [
          {
            label: t`Save as Newick`,
            callback: () => DownloadUtil.downloadNewick(baseName, newick, completeCaseType, t),
          },
          {
            label: t`Save as JPEG`,
            callback: () => DownloadUtil.downloadCanvasImage(baseName, treeCanvas, 'jpeg', completeCaseType, t),
          },
          {
            label: t`Save as PNG`,
            callback: () => DownloadUtil.downloadCanvasImage(baseName, treeCanvas, 'png', completeCaseType, t),
          },
        ],
      });
    };


    emitDownloadOptions();
    const remove = EpiEventBusManager.instance.addEventListener('onDownloadOptionsRequested', emitDownloadOptions);

    return () => {
      EpiEventBusManager.instance.emit('onDownloadOptionsChanged', {
        zone: EPI_ZONE.TREE,
        items: null,
        zoneLabel: t`Tree`,
      });
      remove();
    };
  }, [completeCaseType, isTreeLinked, isTreeUnavailable, newick, t, treeCanvas, treeConfiguration?.geneticDistanceProtocol.name, treeConfiguration?.treeAlgorithm.name]);


  const link = useCallback(() => {
    treeRef.current?.link();
  }, []);

  useImperativeHandle(ref, () => ({
    link,
  }));

  return (
    <EpiWidget
      expandDisabled={isTreeUnavailable}
      primaryMenu={primaryMenu}
      title={titleMenu}
      zone={EPI_ZONE.TREE}
    >
      <Box
        sx={{
          position: 'relative',
          height: '100%',
          width: '100%',
          overflow: 'clip',
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
                  <Box marginY={2}>
                    {t('The phylogenetic tree cannot be displayed because the number of cases ({{caseCount}}) exceeds the maximum allowed number of cases ({{maxSize}}) to display a phylogenetic tree. Refine your filters to reduce the number of results.', {
                      caseCount: caseIds.length,
                      maxSize: completeCaseType.props.read_max_tree_size,
                    })}
                  </Box>
                  <Button
                    color={'inherit'}
                    variant={'outlined'}
                    onClick={onOpenFiltersButtonClick}
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
                <EpiWidgetUnavailable
                  epiZone={EPI_ZONE.TREE}
                  widgetName={t`phylogenetic tree`}
                />
              </Box>
            )}
          </>
        )}
        {(isLoading && !isTreeUnavailable) && (
          <Spinner
            label={t`Loading`}
            takingLongerTimeoutMs={ConfigManager.instance.config.epiTree.TAKING_LONGER_TIMEOUT_MS}
          />
        )}
        {!isTreeUnavailable && shouldShowTree && (
          <PhylogeneticTreeComponent
            ref={treeRef}
            ariaLabel={treeCanvasAriaLabel}
            externalScrollSubject={linkedScrollSubject}
            externalVisibleRangeSubject={lineListRangeSubject}
            highlightingSubject={treeHighlightingSubject}
            initialViewState={initialTreeViewState}
            itemHeight={itemHeight}
            leafOrder={sortedLeafNames}
            shouldShowDistances={isShowDistancesEnabled}
            shouldShowSupportLinesWhenUnlinked={isShowSupportLinesWhenUnlinkedEnabled}
            stratification={stratification}
            tree={tree}
            onCanvasChange={onTreeCanvasChange}
            onLinkStateChange={setIsTreeLinked}
            onPathClick={onTreePathClick}
            onViewStateChange={onTreeViewStateChange}
          />
        )}
      </Box>
      <EpiContextMenu
        config={epiContextMenuConfig}
        getExtraItems={getEpiContextMenuExtraItems}
        onMenuClose={onEpiContextMenuClose}
      />
    </EpiWidget>
  );
};
