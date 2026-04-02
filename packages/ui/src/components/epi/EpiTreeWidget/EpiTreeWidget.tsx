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

import type { EpiContextMenuConfigWithPosition } from '../EpiContextMenu';
import { EpiContextMenu } from '../EpiContextMenu';
import { EpiWidgetUnavailable } from '../EpiWidgetUnavailable';
import { EpiTreeDescription } from '../EpiTreeDescription';
import type { RetrievePhylogeneticTreeRequestBody } from '../../../api';
import { CaseApi } from '../../../api';
import { TreeFilter } from '../../../classes/filters/TreeFilter';
import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { DevicePixelRatioManager } from '../../../classes/managers/DevicePixelRatioManager';
import { EpiEventBusManager } from '../../../classes/managers/EpiEventBusManager';
import { EpiHighlightingManager } from '../../../classes/managers/EpiHighlightingManager';
import { Subject } from '../../../classes/Subject';
import { useDimensions } from '../../../hooks/useDimensions';
import { useScrollbarSize } from '../../../hooks/useScrollbarSize';
import { useSubscribable } from '../../../hooks/useSubscribable';
import type {
  EpiLinkedScrollSubjectValue,
  TreeConfiguration,
  Highlighting,
  EpiLineListRangeSubjectValue,
} from '../../../models/epi';
import { EPI_ZONE } from '../../../models/epi';
import type { MenuItemData } from '../../../models/nestedMenu';
import type {
  TreeAssembly,
  TreePathProperties,
} from '../../../models/tree';
import { EpiDashboardStoreContext } from '../../../stores/epiDashboardStore';
import { userProfileStore } from '../../../stores/userProfileStore';
import { SELECTION_FILTER_GROUP } from '../../../utils/CaseTypeUtil';
import { QueryUtil } from '../../../utils/QueryUtil';
import { Spinner } from '../../ui/Spinner';
import { EpiWidget } from '../EpiWidget';
import { DownloadUtil } from '../../../utils/DownloadUtil';
import { useQueryMemo } from '../../../hooks/useQueryMemo';
import { EpiTreeUtil } from '../../../utils/EpiTreeUtil';

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
  const scrollbarSize = useScrollbarSize();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { dimensions: { width, height } } = useDimensions(containerRef);
  const [treeCanvas, setTreeCanvas] = useState<HTMLCanvasElement>();
  const highlightingManager = useMemo(() => EpiHighlightingManager.instance, []);
  const canvasScrollSubject = useMemo<Subject<{ x: number; y: number }>>(() => new Subject({ x: 0, y: 0 }), []);
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
  const [treeAssembly, setTreeAssembly] = useState<TreeAssembly>(null);
  const [devicePixelRatio, setDevicePixelRatio] = useState<number>(DevicePixelRatioManager.instance.data);
  const [isLinked, setIsLinked] = useState(true);
  const internalHighlightingSubject = useMemo(() => new Subject<Highlighting>({
    caseIds: [],
    origin: null,
  }), []);

  const zoomLevelSubject = useMemo(() => new Subject<number>(!isNaN(epiDashboardStore.getState().epiTreeWidgetData.zoomLevel) ? epiDashboardStore.getState().epiTreeWidgetData.zoomLevel : 1), [epiDashboardStore]);
  const scrollPositionSubject = useMemo(() => new Subject<{ horizontal: number; vertical: number }>({
    horizontal: !isNaN(epiDashboardStore.getState().epiTreeWidgetData.horizontalScrollPosition) ? epiDashboardStore.getState().epiTreeWidgetData.horizontalScrollPosition : 0,
    vertical: !isNaN(epiDashboardStore.getState().epiTreeWidgetData.verticalScrollPosition) ? epiDashboardStore.getState().epiTreeWidgetData.verticalScrollPosition : 0,
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
      internalHighlightingSubject.next(highlighting);
    });
    const unsubscribeInternalHighlightingSubject = internalHighlightingSubject.subscribe((highlighting) => {
      if (highlighting.origin !== EPI_ZONE.TREE) {
        return;
      }
      highlightingManager.highlight(highlighting);
    });

    return () => {
      unsubscribeHighlightingManager();
      unsubscribeInternalHighlightingSubject();
    };
  }, [highlightingManager, internalHighlightingSubject]);

  useEffect(() => {
    let zoomLevel = zoomLevelSubject.data;

    const updateIsLinked = () => {
      if (isLinked && zoomLevel !== 1) {
        setIsLinked(false);
      }
    };

    const unsubscribeFromZoomLevelSubject = zoomLevelSubject.subscribe((data) => {
      zoomLevel = data;
      updateIsLinked();
    });
    updateIsLinked();

    return () => {
      unsubscribeFromZoomLevelSubject();
    };
  }, [isLinked, zoomLevelSubject]);

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
  const shouldShowTree = !hasToManyResultsToShowTree && !!treeConfiguration && !isCaseDataLoading && !treeError && !isTreeLoading && width > 0 && tree?.size > 0 && hasEnoughSequencesToShowTree;

  const headerHeight = ConfigManager.instance.config.epiTree.HEADER_HEIGHT;
  const treeCanvasWidth = width;
  const treeCanvasHeight = Math.max(0, height - headerHeight);
  const combinedCanvasHeight = Math.max(0, height);

  const treeWidthMinusPadding = treeCanvasWidth - (2 * ConfigManager.instance.config.epiTree.TREE_PADDING);
  const pixelToGeneticDistanceRatio = tree?.maxBranchLength ? treeWidthMinusPadding / tree.maxBranchLength.toNumber() : null;
  const treeHeight = tree?.size ? (tree.size * itemHeight) + scrollbarSize : itemHeight;

  useEffect(() => {
    if (treeData) {
      setPhylogeneticTreeResponse(treeData);
    }
  }, [treeData, setPhylogeneticTreeResponse]);

  useEffect(() => {
    const unsubscribe = canvasScrollSubject.subscribe((data) => {
      scrollPositionSubject.next({
        horizontal: !isNaN(data.x) ? data.x : scrollPositionSubject.data.horizontal,
        vertical: !isNaN(data.y) ? data.y : scrollPositionSubject.data.vertical,
      });
    });

    return () => {
      unsubscribe();
    };
  }, [canvasScrollSubject, scrollPositionSubject]);

  useEffect(() => {
    if (!treeConfigurations?.length) {
      setTreeConfiguration(null);
    }
    const newConfig = epiDashboardStore.getState().epiTreeWidgetData.treeConfiguration || treeConfigurations[0];

    setTreeConfiguration(newConfig);
    updateEpiTreeWidgetData({
      treeConfiguration: newConfig,
    });
  }, [epiDashboardStore, treeConfigurations, updateEpiTreeWidgetData]);

  const updateLinkedScrollSubjectDebounced = useDebouncedCallback((position: number) => {
    linkedScrollSubject.next({
      position: position / devicePixelRatio,
      origin: scrollContainerRef.current,
    });
  }, ConfigManager.instance.config.epiTree.LINKED_SCROLL_DEBOUNCE_DELAY_MS, { leading: true, trailing: true });

  const updateScrollPosition = useCallback((params: { positionX: number; positionY: number; internalZoomLevel: number }) => {
    const { positionX, positionY, internalZoomLevel } = params;
    if (internalZoomLevel === 0) {
      throw new Error('internalZoomLevel cannot be 0');
    }

    const { newPositionX, newPositionY } = EpiTreeUtil.getSanitizedScrollPosition({
      devicePixelRatio,
      internalZoomLevel,
      isLinked,
      positionX,
      positionY,
      treeCanvasHeight,
      treeCanvasWidth,
      treeHeight,
    });

    canvasScrollSubject.next({
      x: newPositionX,
      y: newPositionY,
    });

    if (isLinked && internalZoomLevel === 1) {
      updateLinkedScrollSubjectDebounced(newPositionY);
    }
  }, [devicePixelRatio, isLinked, treeCanvasWidth, canvasScrollSubject, treeHeight, treeCanvasHeight, updateLinkedScrollSubjectDebounced]);

  useEffect(() => {
    if (sortByField && isLinked) {
      setIsLinked(false);
      zoomLevelSubject.next(ConfigManager.instance.config.epiTree.INITIAL_UNLINKED_ZOOM_LEVEL);
      updateScrollPosition({ positionX: 0, positionY: 0, internalZoomLevel: ConfigManager.instance.config.epiTree.INITIAL_UNLINKED_ZOOM_LEVEL });
    }
  }, [isLinked, sortByField, updateScrollPosition, zoomLevelSubject]);

  const devicePixelRatioManagerCallback = useCallback((newDevicePixelRation: number, previousDevicePixelRatio: number) => {
    canvasScrollSubject.next({
      x: (canvasScrollSubject.data.x / previousDevicePixelRatio) * newDevicePixelRation,
      y: (canvasScrollSubject.data.y / previousDevicePixelRatio) * newDevicePixelRation,
    });
    setDevicePixelRatio(newDevicePixelRation);
  }, [canvasScrollSubject]);

  useSubscribable(DevicePixelRatioManager.instance, {
    callback: devicePixelRatioManagerCallback,
  });

  const updateEpiTreeWidgetDataDebounced = useDebouncedCallback(() => {
    updateEpiTreeWidgetData({
      zoomLevel: zoomLevelSubject.data,
      verticalScrollPosition: scrollPositionSubject.data.vertical,
      horizontalScrollPosition: scrollPositionSubject.data.horizontal,
    });
  }, 500);

  useEffect(() => {
    updateEpiTreeWidgetDataDebounced();
  }, [updateEpiTreeWidgetData, zoomLevelSubject, scrollPositionSubject, updateEpiTreeWidgetDataDebounced]);

  const getTickerMarkScale = useCallback((zoomLevel: number) => {
    return EpiTreeUtil.getTickMarkScale({
      treeWidthMinusPadding,
      geneticTreeWidth: tree?.maxBranchLength,
      minGeneticScaleUnit: Math.min(EpiTreeUtil.getMinGeneticScaleUnit(tree), treeConfiguration?.geneticDistanceProtocol?.min_scale_unit ?? Infinity),
      // minGeneticScaleUnit: treeConfiguration?.geneticDistanceProtocol?.min_scale_unit,
      zoomLevel,
    });
  }, [treeWidthMinusPadding, tree, treeConfiguration?.geneticDistanceProtocol?.min_scale_unit]);

  const onEpiContextMenuClose = useCallback(() => {
    setEpiContextMenuConfig(null);
    setZoomInMenuItemConfig(null);
  }, []);

  const linkLineListToTree = useCallback(() => {
    const perform = async () => {
      const newScrollPosition = EpiTreeUtil.getScrollPositionFromTreeVisibility({
        treeHeight,
        treeSize: tree?.size,
        treeCanvasHeight,
        verticalScrollPosition: scrollPositionSubject.data.vertical,
        zoomLevel: zoomLevelSubject.data,
        itemHeight,
      });

      await setSorting(null, null);
      zoomLevelSubject.next(1);
      setIsLinked(true);
      updateScrollPosition({ positionX: 0, positionY: newScrollPosition, internalZoomLevel: 1 });
      linkedScrollSubject.next({
        position: newScrollPosition,
        origin: scrollContainerRef.current,
      });
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    perform();

  }, [linkedScrollSubject, setSorting, tree?.size, treeCanvasHeight, treeHeight, scrollPositionSubject, updateScrollPosition, zoomLevelSubject, itemHeight]);

  const onLinkButtonClick = useCallback(() => {
    linkLineListToTree();

  }, [linkLineListToTree]);

  const onOpenFiltersButtonClick = useCallback(() => {
    EpiEventBusManager.instance.emit('openFiltersMenu');
  }, []);

  const resetZoomLevelAndScrollPosition = useCallback(() => {
    zoomLevelSubject.next(1);
    setIsLinked(true);
    updateScrollPosition({ positionX: 0, positionY: 0, internalZoomLevel: 1 });
  }, [updateScrollPosition, zoomLevelSubject]);

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

  const getPathPropertiesFromCanvas = useCallback((canvas: HTMLCanvasElement, event: MouseEvent): TreePathProperties => {
    return EpiTreeUtil.getPathPropertiesFromCanvas({
      canvas,
      event,
      treeAssembly,
      devicePixelRatio,
    });
  }, [treeAssembly, devicePixelRatio]);

  useEffect(() => {
    let linkedScrollData: EpiLinkedScrollSubjectValue = linkedScrollSubject.data;
    let zoomLevel = zoomLevelSubject.data;

    const update = () => {
      if (!linkedScrollData || linkedScrollData.origin === scrollContainerRef.current) {
        return;
      }
      if (isLinked && zoomLevel === 1) {
        canvasScrollSubject.next({
          x: canvasScrollSubject.data.x * devicePixelRatio,
          y: linkedScrollData.position * devicePixelRatio,
        });
      }
    };

    const unsubscribeFromLinkedScrollSubject = linkedScrollSubject.subscribe((data) => {
      linkedScrollData = data;
      update();
    });

    const unsubscribeFromZoomLevelSubject = zoomLevelSubject.subscribe((data) => {
      zoomLevel = data;
      update();
    });

    return () => {
      unsubscribeFromLinkedScrollSubject();
      unsubscribeFromZoomLevelSubject();
    };
  }, [linkedScrollSubject, canvasScrollSubject, updateScrollPosition, devicePixelRatio, isLinked, zoomLevelSubject]);

  // Setup canvas
  useEffect(() => {
    setTreeAssembly(EpiTreeUtil.assembleTree({ rootNode: tree, treeCanvasWidth, pixelToGeneticDistanceRatio, itemHeight, externalLeafSorting: sortedLeafNames }));
  }, [pixelToGeneticDistanceRatio, tree, treeCanvasWidth, itemHeight, sortedLeafNames]);

  useEffect(() => {
    if (!treeCanvas || !treeAssembly || !tree) {
      return;
    }

    let animationFrameId: number;
    let zoomLevel: number = zoomLevelSubject.data;
    let tickerMarkScale = getTickerMarkScale(zoomLevel);
    let highlighting: Highlighting = internalHighlightingSubject.data;
    let externalScrollPosition = linkedScrollSubject.data?.position ?? 0;
    let horizontalScrollPosition = scrollPositionSubject.data.horizontal;
    let verticalScrollPosition = scrollPositionSubject.data.vertical;
    let externalRange = lineListRangeSubject.data;

    const render = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        EpiTreeUtil.drawTreeCanvas({
          canvas: treeCanvas,
          theme,
          geneticTreeWidth: tree?.maxBranchLength,
          treeAssembly,
          stratification,
          zoomLevel,
          isLinked,
          horizontalScrollPosition,
          verticalScrollPosition,
          treeCanvasWidth,
          treeCanvasHeight,
          headerHeight,
          pixelToGeneticDistanceRatio,
          tickerMarkScale,
          highlightedNodeNames: highlighting?.caseIds,
          shouldShowDistances: isShowDistancesEnabled,
          shouldShowSupportLinesWhenUnlinked: isShowSupportLinesWhenUnlinkedEnabled,
          devicePixelRatio,
          externalScrollPosition,
          externalRange,
          itemHeight });
      });
    };

    const unsubscribeFromLineListRangeSubject = lineListRangeSubject.subscribe((data) => {
      externalRange = data;
      render();
    });

    const unsubscribeFromLinkedScrollSubject = linkedScrollSubject.subscribe((data) => {
      if (data.origin === scrollContainerRef.current) {
        return;
      }
      externalScrollPosition = data.position;
      render();
    });

    const unsubscribeFromHighlighting = internalHighlightingSubject.subscribe((data) => {
      highlighting = data;
      render();
    });

    const unsubscribeFromScrollPositionSubject = scrollPositionSubject.subscribe((data) => {
      horizontalScrollPosition = data.horizontal;
      verticalScrollPosition = data.vertical;
      render();
    });

    const unsubscribeFromZoomLevelSubject = zoomLevelSubject.subscribe((data) => {
      zoomLevel = data;
      tickerMarkScale = getTickerMarkScale(data);
      render();
    });

    render();

    return () => {
      unsubscribeFromHighlighting();
      unsubscribeFromLinkedScrollSubject();
      unsubscribeFromScrollPositionSubject();
      unsubscribeFromZoomLevelSubject();
      unsubscribeFromLineListRangeSubject();
      cancelAnimationFrame(animationFrameId);
    };
  }, [headerHeight, treeCanvasHeight, treeCanvas, internalHighlightingSubject, pixelToGeneticDistanceRatio, stratification, theme, getTickerMarkScale, treeAssembly, treeCanvasWidth, scrollPositionSubject, width, zoomLevelSubject, isLinked, isShowDistancesEnabled, devicePixelRatio, tree?.maxBranchLength, tree, linkedScrollSubject, lineListRangeSubject, itemHeight, isShowSupportLinesWhenUnlinkedEnabled]);

  // Setup canvas event listeners (note: must be in a separate useEffect to prevent render loop)
  useEffect(() => {
    if (!treeCanvas) {
      return;
    }

    let zoomLevel = zoomLevelSubject.data;

    let pos = {
      x: 0,
      y: 0,
      currentX: 0,
      currentY: 0,
    };
    let followMouse = false;

    const clearHighlighting = () => {
      if (internalHighlightingSubject.data?.caseIds?.length) {
        internalHighlightingSubject.next({
          caseIds: [],
          origin: EPI_ZONE.TREE,
        });
      }
    };

    const isEventInHeader = (event: MouseEvent | WheelEvent) => event.offsetY < headerHeight;

    const onMouseDown = (event: MouseEvent) => {
      if (isEventInHeader(event)) {
        treeCanvas.style.cursor = 'default';
        return;
      }

      // store the current mouse position (to be used on mouse move for scrolling)
      pos = {
        x: event.clientX,
        y: event.clientY,
        currentX: canvasScrollSubject.data.x,
        currentY: canvasScrollSubject.data.y,
      };
      followMouse = true;
    };

    const onMouseMove = (event: MouseEvent) => {
      if (isEventInHeader(event)) {
        followMouse = false;
        treeCanvas.style.cursor = 'default';
        clearHighlighting();
        return;
      }

      if (followMouse) {
        treeCanvas.style.cursor = 'move';

        // update the scroll position based on how far the mouse has moved
        // how far the mouse has moved:
        const deltaX = event.clientX - pos.x;
        const deltaY = event.clientY - pos.y;
        // the new scroll position:
        const scrollPositionX = pos.currentX - deltaX;
        const scrollPositionY = pos.currentY - deltaY;

        let sanitizedScrollPositionX = scrollPositionX;
        if (zoomLevel === 1 && Math.abs(deltaX) < ConfigManager.instance.config.epiTree.PANNING_THRESHOLD && pos.currentX === 0) {
          sanitizedScrollPositionX = 0;
        }
        updateScrollPosition({ positionX: sanitizedScrollPositionX, positionY: scrollPositionY, internalZoomLevel: zoomLevel });
        return;
      }

      const pathProperties = getPathPropertiesFromCanvas(treeCanvas, event);
      if (pathProperties) {
        treeCanvas.style.cursor = 'pointer';
        internalHighlightingSubject.next({
          caseIds: pathProperties.subTreeLeaveNames,
          origin: EPI_ZONE.TREE,
        });
      } else {
        treeCanvas.style.cursor = 'default';
        clearHighlighting();
      }
    };

    const onMouseUp = (event: MouseEvent) => {
      // stop following the mouse for scrolling
      followMouse = false;

      if (isEventInHeader(event)) {
        return;
      }

      // Handle the click when the user clicked a path in the canvas
      const pathProperties = getPathPropertiesFromCanvas(treeCanvas, event);
      if (pathProperties?.treeNode) {
        const { treeNode } = pathProperties;
        setEpiContextMenuConfig({
          position: {
            left: event.clientX,
            top: event.clientY,
          },
          caseIds: treeNode.subTreeLeaveNames ? treeNode.subTreeLeaveNames : [treeNode.name],
          mouseEvent: event,
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
      } else if (pathProperties?.subTreeLeaveNames?.length) {
        setEpiContextMenuConfig({
          position: {
            left: event.clientX,
            top: event.clientY,
          },
          caseIds: pathProperties.subTreeLeaveNames,
          mouseEvent: event,
        });
      }
    };

    const onMouseWheel = (event: WheelEvent) => {
      event.preventDefault();

      if (isEventInHeader(event)) {
        return;
      }

      if (event.shiftKey) {
        updateScrollPosition({ positionX: canvasScrollSubject.data.x + (event.deltaX || event.deltaY), positionY: canvasScrollSubject.data.y, internalZoomLevel: zoomLevel });
        return;
      }
      if (event.metaKey || event.ctrlKey) {
        updateScrollPosition({ positionX: canvasScrollSubject.data.x, positionY: canvasScrollSubject.data.y + (event.deltaX || event.deltaY), internalZoomLevel: zoomLevel });
        return;
      }

      const { MAX_ZOOM_SPEED, MIN_ZOOM_SPEED, MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL } = ConfigManager.instance.config.epiTree;

      const zoomSpeed = Math.min(MAX_ZOOM_SPEED, Math.max(MIN_ZOOM_SPEED, treeHeight / treeCanvasHeight * 0.2));
      const newZoomLevel = Math.min(MAX_ZOOM_LEVEL, Math.max(MIN_ZOOM_LEVEL, zoomLevel + (event.deltaY > 0 ? zoomSpeed : -zoomSpeed)));
      const treeBodyOffsetY = event.offsetY - headerHeight;

      const newScrollPositionY = EpiTreeUtil.getNewScrollPositionForZoomLevel({
        eventOffset: treeBodyOffsetY,
        scrollPosition: canvasScrollSubject.data.y,
        dimensionSize: treeHeight,
        currentZoomLevel: zoomLevel,
        newZoomLevel,
      });
      const newScrollPositionX = EpiTreeUtil.getNewScrollPositionForZoomLevel({
        eventOffset: event.offsetX,
        scrollPosition: canvasScrollSubject.data.x,
        dimensionSize: treeCanvasWidth,
        currentZoomLevel: zoomLevel,
        newZoomLevel,
      });
      zoomLevelSubject.next(newZoomLevel);
      if (newZoomLevel !== 1) {
        updateScrollPosition({ positionX: newScrollPositionX, positionY: newScrollPositionY, internalZoomLevel: newZoomLevel });
      } else {
        updateScrollPosition({ positionX: newScrollPositionX, positionY: linkedScrollSubject.data?.position ?? 0, internalZoomLevel: 1 });
      }
    };

    const onMouseOut = () => {
      followMouse = false;

      // reset highlighting (because mouse move event may not have triggered it correctly)
      clearHighlighting();
    };

    const unsubscribeFromZoomLevelSubject = zoomLevelSubject.subscribe((data) => {
      zoomLevel = data;
    });

    treeCanvas.addEventListener('mousemove', onMouseMove);
    treeCanvas.addEventListener('mousedown', onMouseDown);
    treeCanvas.addEventListener('mouseup', onMouseUp);
    treeCanvas.addEventListener('mouseout', onMouseOut);
    treeCanvas.addEventListener('wheel', onMouseWheel);

    return () => {
      treeCanvas.removeEventListener('mousemove', onMouseMove);
      treeCanvas.removeEventListener('mousedown', onMouseDown);
      treeCanvas.removeEventListener('mouseup', onMouseUp);
      treeCanvas.removeEventListener('mouseout', onMouseOut);
      treeCanvas.removeEventListener('wheel', onMouseWheel);
      unsubscribeFromZoomLevelSubject();
    };
  }, [headerHeight, treeCanvasHeight, treeCanvas, getPathPropertiesFromCanvas, internalHighlightingSubject, updateScrollPosition, scrollContainerRef, treeHeight, zoomLevelSubject, canvasScrollSubject, treeCanvasWidth, linkedScrollSubject]);

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
              color: isLinked ? undefined : theme.palette.error.main,
            }}
          />
        ),
        callback: onLinkButtonClick,
      },
    ];
  }, [hasActiveTreeFilter, t, onTreeFilterStepOutButtonClick, onRemoveTreeFilterButtonClick, isLinked, theme.palette.error.main, onLinkButtonClick]);

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
  }, [completeCaseType, isLinked, isTreeUnavailable, newick, t, treeCanvas, treeConfiguration?.geneticDistanceProtocol.name, treeConfiguration?.treeAlgorithm.name]);


  const link = useCallback(() => {
    // Link the tree to the current scroll position of the Line List
    setIsLinked(true);
    zoomLevelSubject.next(1);
    updateScrollPosition({
      positionX: 0,
      positionY: linkedScrollSubject.data?.position ?? 0,
      internalZoomLevel: 1,
    });
  }, [linkedScrollSubject.data?.position, updateScrollPosition, zoomLevelSubject]);

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
        ref={containerRef}
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
        <Box
          ref={scrollContainerRef}
          sx={{
            position: 'absolute',
            height: combinedCanvasHeight,
            width,
            overflowY: 'hidden',
          }}
        >
          {!isTreeUnavailable && shouldShowTree && (
            <Box
              ref={setTreeCanvas}
              aria-label={treeCanvasAriaLabel}
              component={'canvas'}
              role={'figure'}
              sx={{
                width: treeCanvasWidth,
                height: combinedCanvasHeight,
              }}
            />
          )}
        </Box>
      </Box>
      <EpiContextMenu
        config={epiContextMenuConfig}
        getExtraItems={getEpiContextMenuExtraItems}
        onMenuClose={onEpiContextMenuClose}
      />
    </EpiWidget>
  );
};
