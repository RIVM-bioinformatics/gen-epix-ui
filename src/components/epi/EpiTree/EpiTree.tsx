import {
  Box,
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
import { useQuery } from '@tanstack/react-query';
import { useDebouncedCallback } from 'use-debounce';

import type { EpiContextMenuConfigWithPosition } from '../EpiContextMenu';
import { EpiContextMenu } from '../EpiContextMenu';
import { EpiWidgetUnavailable } from '../EpiWidgetUnavailable';
import { EpiTreeDescription } from '../EpiTreeDescription';
import type {
  RetrievePhylogeneticTreeRequestBody,
  GeneticDistanceProtocol,
  TreeAlgorithm,
} from '../../../api';
import { CaseApi } from '../../../api';
import { TreeFilter } from '../../../classes/filters/TreeFilter';
import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { DevicePixelRatioManager } from '../../../classes/managers/DevicePixelRatioManager';
import { EpiEventBusManager } from '../../../classes/managers/EpiEventBusManager';
import { HighlightingManager } from '../../../classes/managers/HighlightingManager';
import { Subject } from '../../../classes/Subject';
import { useDimensions } from '../../../hooks/useDimensions';
import { useScrollbarSize } from '../../../hooks/useScrollbarSize';
import { useSubscribable } from '../../../hooks/useSubscribable';
import type {
  EpiLinkedScrollSubjectValue,
  TreeConfiguration,
  Highlighting,
} from '../../../models/epi';
import { EPI_ZONE } from '../../../models/epi';
import type { MenuItemData } from '../../../models/nestedMenu';
import type { TreePathProperties } from '../../../models/tree';
import { EpiStoreContext } from '../../../stores/epiStore';
import { userProfileStore } from '../../../stores/userProfileStore';
import { SELECTION_FILTER_GROUP } from '../../../utils/EpiCaseTypeUtil';
import {
  EpiTreeUtil,
  type TreeAssembly,
} from '../../../utils/EpiTreeUtil';
import { QueryUtil } from '../../../utils/QueryUtil';
import { Spinner } from '../../ui/Spinner';
import { EpiWidget } from '../EpiWidget';
import { EpiDownloadUtil } from '../../../utils/EpiDownloadUtil';

type ZoomInMenuItemConfig = {
  caseIds?: string[];
  rootId?: string;
};

type EpiTreeProps = {
  readonly linkedScrollSubject: Subject<EpiLinkedScrollSubjectValue>;
  readonly ref: Ref<EpiTreeRef>;
};

export interface EpiTreeRef {
  link: () => void;
}

export const EpiTree = ({ linkedScrollSubject, ref }: EpiTreeProps) => {
  const theme = useTheme();
  const [t] = useTranslation();
  const scrollbarSize = useScrollbarSize();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { dimensions: { width, height } } = useDimensions(containerRef);
  const [treeCanvas, setTreeCanvas] = useState<HTMLCanvasElement>();
  const [headerCanvas, setHeaderCanvas] = useState<HTMLCanvasElement>();
  const highlightingManager = useMemo(() => HighlightingManager.instance, []);
  const canvasScrollSubject = useMemo<Subject<{ x: number; y: number }>>(() => new Subject({ x: 0, y: 0 }), []);
  const epiStore = useContext(EpiStoreContext);
  const setPhylogeneticTreeResponse = useStore(epiStore, (state) => state.setPhylogeneticTreeResponse);
  const baseData = useStore(epiStore, (state) => state.baseData);
  const filteredCases = useStore(epiStore, (state) => state.filteredData[SELECTION_FILTER_GROUP]);
  const setSorting = useStore(epiStore, (state) => state.setSorting);
  const tree = useStore(epiStore, (state) => state.tree);
  const sortByField = useStore(epiStore, (state) => state.sortByField);
  const stratification = useStore(epiStore, (state) => state.stratification);
  const completeCaseType = useStore(epiStore, (state) => state.completeCaseType);
  const hasActiveTreeFilter = useStore(epiStore, (state) => !state.filters.find(filter => filter instanceof TreeFilter).isInitialFilterValue());
  const addTreeFilter = useStore(epiStore, (state) => state.addTreeFilter);
  const treeFilterStepOut = useStore(epiStore, (state) => state.treeFilterStepOut);
  const updateEpiTreeWidgetData = useStore(epiStore, (state) => state.updateEpiTreeWidgetData);
  const removeTreeFilter = useStore(epiStore, (state) => state.removeTreeFilter);
  const isCaseDataLoading = useStore(epiStore, (state) => state.isDataLoading);
  const newick = useStore(epiStore, (state) => state.newick);
  const resetTreeAddresses = useStore(epiStore, (state) => state.resetTreeAddresses);
  const isShowDistancesEnabled = useStore(userProfileStore, (state) => state.epiDashboardTreeSettings.isShowDistancesEnabled);
  const [epiContextMenuConfig, setEpiContextMenuConfig] = useState<EpiContextMenuConfigWithPosition | null>(null);
  const [zoomInMenuItemConfig, setZoomInMenuItemConfig] = useState<ZoomInMenuItemConfig>(null);
  const [extraLeafInfoId, setExtraLeafInfoId] = useState<string>(null);
  const [treeConfiguration, setTreeConfiguration] = useState<TreeConfiguration>(epiStore.getState().epiTreeWidgetData.treeConfiguration);
  const [treeAssembly, setTreeAssembly] = useState<TreeAssembly>(null);
  const [verticalScrollPosition, setVerticalScrollPosition] = useState<number>(epiStore.getState().epiTreeWidgetData.verticalScrollPosition);
  const [horizontalScrollPosition, setHorizontalScrollPosition] = useState<number>(epiStore.getState().epiTreeWidgetData.horizontalScrollPosition);
  const [zoomLevel, setZoomLevel] = useState<number>(epiStore.getState().epiTreeWidgetData.zoomLevel);
  const [devicePixelRatio, setDevicePixelRatio] = useState<number>(DevicePixelRatioManager.instance.data);
  const [isLinked, setIsLinked] = useState(true);
  const internalHighlightingSubject = useMemo(() => new Subject<Highlighting>({
    caseIds: [],
    origin: null,
  }), []);

  const treeConfigurations = useMemo(() => EpiTreeUtil.getTreeConfigurations(completeCaseType), [completeCaseType]);

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
    if (isLinked && zoomLevel !== 1) {
      setIsLinked(false);
    }
  }, [isLinked, zoomLevel]);

  const caseIds = useMemo(() => filteredCases.map(c => c.id).sort(), [filteredCases]);

  useEffect(() => {
    resetTreeAddresses();
  }, [caseIds, resetTreeAddresses]);

  const hasEnoughSequencesToShowTree = useMemo(() => caseIds.length >= 2 && caseIds.every(x => !!x), [caseIds]);

  const retrievePhylogeneticTreeRequestBody = useMemo<RetrievePhylogeneticTreeRequestBody>(() => ({
    case_ids: caseIds,
    genetic_distance_case_type_col_id: treeConfiguration?.caseTypeCol.id,
    tree_algorithm_code: treeConfiguration?.treeAlgorithm.code,
  }), [caseIds, treeConfiguration?.caseTypeCol.id, treeConfiguration?.treeAlgorithm.code]);

  const { isLoading: isTreeLoading, error: treeError, data: treeData } = useQuery({
    queryKey: QueryUtil.getRetrievePhylogeneticTreeKey(retrievePhylogeneticTreeRequestBody),
    queryFn: async ({ signal }) => {
      const response = await CaseApi.getInstance().retrievePhylogeneticTree(retrievePhylogeneticTreeRequestBody, { signal });
      return response.data;
    },
    enabled: hasEnoughSequencesToShowTree && !!treeConfiguration,
    retry: false,
    staleTime: Infinity,
  });

  const isLoading = !!treeConfiguration && (isCaseDataLoading || (hasEnoughSequencesToShowTree && isTreeLoading));
  const isTreeUnavailable = !isCaseDataLoading && ((!isLoading && !!treeError) || !hasEnoughSequencesToShowTree || tree?.maxBranchLength?.toNumber() === 0 || tree?.size === 0 || !treeConfiguration);
  const shouldShowTree = !!treeConfiguration && !isCaseDataLoading && !treeError && !isTreeLoading && width > 0 && tree?.size > 0 && hasEnoughSequencesToShowTree;

  const treeCanvasWidth = width;
  const treeCanvasHeight = height - ConfigManager.instance.config.epiTree.HEADER_HEIGHT;

  const treeWidthMinusPadding = treeCanvasWidth - (2 * ConfigManager.instance.config.epiTree.TREE_PADDING);
  const pixelToGeneticDistanceRatio = tree?.maxBranchLength ? treeWidthMinusPadding / tree.maxBranchLength.toNumber() : null;
  // Note: There is some magic here, because of the position: sticky for the table header
  const treeHeight = tree?.size ? (tree.size * ConfigManager.instance.config.epiList.TABLE_ROW_HEIGHT) + scrollbarSize : ConfigManager.instance.config.epiList.TABLE_ROW_HEIGHT;

  useEffect(() => {
    if (treeData) {
      setPhylogeneticTreeResponse(treeData);
    }
  }, [treeData, setPhylogeneticTreeResponse]);

  useEffect(() => {
    const unsubscribe = canvasScrollSubject.subscribe((data) => {
      setHorizontalScrollPosition(data.x);
      setVerticalScrollPosition(data.y);
    });

    return () => {
      unsubscribe();
    };
  }, [canvasScrollSubject]);

  useEffect(() => {
    if (!treeConfigurations?.length) {
      setTreeConfiguration(null);
    }
    const newConfig = epiStore.getState().epiTreeWidgetData.treeConfiguration || treeConfigurations[0];

    setTreeConfiguration(newConfig);
    updateEpiTreeWidgetData({
      treeConfiguration: newConfig,
    });
  }, [epiStore, treeConfigurations, updateEpiTreeWidgetData]);

  const updateLinkedScrollSubjectDebounced = useDebouncedCallback((position: number) => {
    linkedScrollSubject.next({
      position: position / devicePixelRatio,
      origin: scrollContainerRef.current,
    });
  }, ConfigManager.instance.config.epiTree.LINKED_SCROLL_DEBOUNCE_DELAY_MS);

  const updateScrollPosition = useCallback((positionX: number, positionY: number, internalZoomLevel: number) => {
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
      setZoomLevel(ConfigManager.instance.config.epiTree.INITIAL_UNLINKED_ZOOM_LEVEL);
      updateScrollPosition(0, 0, 0);
    }
  }, [isLinked, sortByField, updateScrollPosition]);

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
      zoomLevel,
      verticalScrollPosition,
      horizontalScrollPosition,
    });
  }, 500);

  useEffect(() => {
    updateEpiTreeWidgetDataDebounced();
  }, [updateEpiTreeWidgetData, zoomLevel, verticalScrollPosition, horizontalScrollPosition, updateEpiTreeWidgetDataDebounced]);

  const tickerMarkScale = useMemo(() => {
    return EpiTreeUtil.getTickMarkScale({
      treeWidthMinusPadding,
      geneticTreeWidth: tree?.maxBranchLength,
      minGeneticScaleUnit: Math.min(EpiTreeUtil.getMinGeneticScaleUnit(tree), treeConfiguration?.geneticDistanceProtocol?.min_scale_unit ?? Infinity),
      // minGeneticScaleUnit: treeConfiguration?.geneticDistanceProtocol?.min_scale_unit,
      zoomLevel,
    });
  }, [treeWidthMinusPadding, tree, treeConfiguration?.geneticDistanceProtocol?.min_scale_unit, zoomLevel]);

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
        verticalScrollPosition,
        zoomLevel,
      });

      await setSorting(null, null);
      setZoomLevel(1);
      setIsLinked(true);
      updateScrollPosition(0, newScrollPosition, 1);
      linkedScrollSubject.next({
        position: newScrollPosition,
        origin: scrollContainerRef.current,
      });
    };

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    perform();

  }, [linkedScrollSubject, setSorting, tree?.size, treeCanvasHeight, treeHeight, verticalScrollPosition, updateScrollPosition, zoomLevel]);

  const onLinkButtonClick = useCallback(() => {
    linkLineListToTree();

  }, [linkLineListToTree]);

  const resetZoomLevelAndScrollPosition = useCallback(() => {
    setZoomLevel(1);
    setIsLinked(true);
    updateScrollPosition(0, 0, 1);
  }, [updateScrollPosition]);

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
    const unsubscribe = linkedScrollSubject.subscribe((data) => {
      if (data.origin === scrollContainerRef.current) {
        return;
      }
      if (isLinked && zoomLevel === 1) {
        canvasScrollSubject.next({
          x: canvasScrollSubject.data.x * devicePixelRatio,
          y: data.position * devicePixelRatio,
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [linkedScrollSubject, canvasScrollSubject, updateScrollPosition, devicePixelRatio, isLinked, zoomLevel]);

  // Setup canvas
  useEffect(() => {
    setTreeAssembly(EpiTreeUtil.assembleTree(tree, treeCanvasWidth, pixelToGeneticDistanceRatio));
  }, [pixelToGeneticDistanceRatio, tree, treeCanvasWidth]);

  useEffect(() => {
    if (!treeCanvas || !treeAssembly || !tree) {
      return;
    }

    EpiTreeUtil.drawTreeCanvas({ canvas: treeCanvas, theme, geneticTreeWidth: tree?.maxBranchLength, treeAssembly, stratification, zoomLevel, isLinked, horizontalScrollPosition, verticalScrollPosition, treeCanvasWidth, treeCanvasHeight, pixelToGeneticDistanceRatio, tickerMarkScale, shouldShowDistances: isShowDistancesEnabled, devicePixelRatio });
    let animationFrameId: number;
    const unsubscribe = internalHighlightingSubject.subscribe((highlighting) => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        EpiTreeUtil.drawTreeCanvas({ canvas: treeCanvas, theme, geneticTreeWidth: tree?.maxBranchLength, treeAssembly, stratification, zoomLevel, isLinked, horizontalScrollPosition, verticalScrollPosition, treeCanvasWidth, treeCanvasHeight, pixelToGeneticDistanceRatio, tickerMarkScale, highlightedNodeNames: highlighting.caseIds, shouldShowDistances: isShowDistancesEnabled, devicePixelRatio });
      });
    });
    return () => {
      unsubscribe();
      cancelAnimationFrame(animationFrameId);
    };
  }, [treeCanvasHeight, treeCanvas, internalHighlightingSubject, pixelToGeneticDistanceRatio, stratification, theme, tickerMarkScale, treeAssembly, treeCanvasWidth, horizontalScrollPosition, verticalScrollPosition, width, zoomLevel, isLinked, isShowDistancesEnabled, devicePixelRatio, tree?.maxBranchLength, tree]);

  // Setup canvas event listeners (note: must be in a separate useEffect to prevent render loop)
  useEffect(() => {
    if (!treeCanvas) {
      return;
    }

    let pos = {
      x: 0,
      y: 0,
      currentX: 0,
      currentY: 0,
    };
    let followMouse = false;

    const onMouseDown = (event: MouseEvent) => {
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

        updateScrollPosition(sanitizedScrollPositionX, scrollPositionY, zoomLevel);
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
        // remove highlighting (only there is highlighting to prevent a render loop)
        if (internalHighlightingSubject.data?.caseIds?.length) {
          internalHighlightingSubject.next({
            caseIds: [],
            origin: EPI_ZONE.TREE,
          });
        }
      }
    };

    const onMouseUp = (event: MouseEvent) => {
      // stop following the mouse for scrolling
      followMouse = false;

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

      if (event.shiftKey) {
        updateScrollPosition(canvasScrollSubject.data.x + (event.deltaX || event.deltaY), canvasScrollSubject.data.y, zoomLevel);
        return;
      }
      if (event.metaKey || event.ctrlKey) {
        updateScrollPosition(canvasScrollSubject.data.x, canvasScrollSubject.data.y + (event.deltaX || event.deltaY), zoomLevel);
        return;
      }

      const { MAX_ZOOM_SPEED, MIN_ZOOM_SPEED, MAX_ZOOM_LEVEL, MIN_ZOOM_LEVEL } = ConfigManager.instance.config.epiTree;

      const zoomSpeed = Math.min(MAX_ZOOM_SPEED, Math.max(MIN_ZOOM_SPEED, treeHeight / treeCanvasHeight * 0.2));
      const newZoomLevel = Math.min(MAX_ZOOM_LEVEL, Math.max(MIN_ZOOM_LEVEL, zoomLevel + (event.deltaY > 0 ? zoomSpeed : -zoomSpeed)));

      const newScrollPositionY = EpiTreeUtil.getNewScrollPositionForZoomLevel({
        eventOffset: event.offsetY,
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

      setZoomLevel(newZoomLevel);
      if (newZoomLevel !== 1) {
        updateScrollPosition(newScrollPositionX, newScrollPositionY, newZoomLevel);
      } else {
        updateScrollPosition(newScrollPositionX, linkedScrollSubject.data?.position ?? 0, 1);
      }

      if (newZoomLevel > MIN_ZOOM_LEVEL && newZoomLevel < MAX_ZOOM_LEVEL) {
        // Disconnect the event listener and allow a render cycle to complete
        // But only when zoomLevel is not at it's boundaries, otherwise the event listener will not be reconnected
        treeCanvas.removeEventListener('wheel', onMouseWheel);
      }
    };

    const onMouseOut = () => {
      followMouse = false;

      // reset highlighting (because mouse move event may not have triggered it correctly)
      internalHighlightingSubject.next({
        caseIds: [],
        origin: EPI_ZONE.TREE,
      });
    };

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
    };
  // note: we don't want to re-run this effect when the treeSubject.data changes; it would disconnect the event handles and prevent the user from interacting with the tree
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeCanvasHeight, treeCanvas, getPathPropertiesFromCanvas, internalHighlightingSubject, updateScrollPosition, scrollContainerRef, treeHeight, zoomLevel]);

  // Setup header canvas
  useEffect(() => {
    if (!headerCanvas || !tree) {
      return;
    }
    const canvas = headerCanvas;
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.clientWidth * devicePixelRatio;
    canvas.height = canvas.clientHeight * devicePixelRatio;

    EpiTreeUtil.drawGuides({ canvas, geneticTreeWidth: tree?.maxBranchLength, tickerMarkScale, pixelToGeneticDistanceRatio, horizontalScrollPosition, paddingTop: ConfigManager.instance.config.epiTree.HEADER_HEIGHT * 0.7, paddingBottom: 0, zoomLevel, devicePixelRatio });
    EpiTreeUtil.drawGuides({ canvas, geneticTreeWidth: tree?.maxBranchLength, tickerMarkScale, pixelToGeneticDistanceRatio, horizontalScrollPosition, paddingTop: 0, paddingBottom: ConfigManager.instance.config.epiTree.HEADER_HEIGHT * 0.7, zoomLevel, devicePixelRatio });
    EpiTreeUtil.drawScale({ canvas, theme, tickerMarkScale, geneticTreeWidth: tree?.maxBranchLength, pixelToGeneticDistanceRatio, zoomLevel, devicePixelRatio, horizontalScrollPosition });

    // Draw horizontal top divider
    EpiTreeUtil.drawDivider({ canvas, y: 0, devicePixelRatio });
    // Draw horizontal bottom divider
    EpiTreeUtil.drawDivider({ canvas, y: ConfigManager.instance.config.epiTree.HEADER_HEIGHT - 1, devicePixelRatio });

    ctx.translate(-0.5, -0.5);
  }, [headerCanvas, pixelToGeneticDistanceRatio, theme, tickerMarkScale, zoomLevel, devicePixelRatio, horizontalScrollPosition, tree?.maxBranchLength, tree]);

  const onShowDetailsSelectionMenuItemClick = useCallback((onMenuClose: () => void) => {
    EpiEventBusManager.instance.emit('openCaseInfoDialog', {
      caseId: baseData.find(c => c.id === extraLeafInfoId).id,
    });
    onMenuClose();
  }, [extraLeafInfoId, baseData]);

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

  const getTitleMenuLabel = useCallback((geneticDistanceProtocol: GeneticDistanceProtocol, treeAlgorithm: TreeAlgorithm) => {
    return `${geneticDistanceProtocol.name} - ${treeAlgorithm.name}`;
  }, []);

  const titleMenu = useMemo<MenuItemData | string>(() => {
    if (!treeConfigurations?.length) {
      return t`Tree`;
    }

    const menu: MenuItemData = {
      label: treeConfiguration ? t('Tree: {{algorithm}}', { algorithm: getTitleMenuLabel(treeConfiguration.geneticDistanceProtocol, treeConfiguration.treeAlgorithm) }) : t`Tree`,
      tooltip: treeConfiguration
        ? (
          <EpiTreeDescription
            treeConfiguration={treeConfiguration}
          />
        )
        : undefined,
      disabled: !treeConfiguration,
      items: treeConfigurations?.map<MenuItemData>(config => ({
        label: getTitleMenuLabel(config.geneticDistanceProtocol, config.treeAlgorithm),
        callback: () => {
          console.log('Switching tree configuration to', config);
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
  }, [treeConfigurations, treeConfiguration, t, getTitleMenuLabel, removeTreeFilter, updateEpiTreeWidgetData]);

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
            callback: () => EpiDownloadUtil.downloadNewick(baseName, newick, completeCaseType, t),
          },
          {
            label: t`Save as JPEG`,
            callback: () => EpiDownloadUtil.downloadCanvasImage(baseName, treeCanvas, 'jpeg', completeCaseType, t),
            disabled: !isLinked,
          },
          {
            label: t`Save as PNG`,
            callback: () => EpiDownloadUtil.downloadCanvasImage(baseName, treeCanvas, 'png', completeCaseType, t),
            disabled: !isLinked,
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
    setZoomLevel(1);
    updateScrollPosition(0, linkedScrollSubject.data?.position ?? 0, 1);
  }, [linkedScrollSubject.data?.position, updateScrollPosition]);

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
        {(isLoading && !isTreeUnavailable) && (
          <Spinner
            label={t`Loading`}
            takingLongerTimeoutMs={ConfigManager.instance.config.epiTree.TAKING_LONGER_TIMEOUT_MS}
          />
        )}
        {!isTreeUnavailable && shouldShowTree && (
          <Box
            sx={{
              height: ConfigManager.instance.config.epiTree.HEADER_HEIGHT,
              position: 'absolute',
              background: theme.palette.background.paper,
              width: treeCanvasWidth,
              top: 0,
              zIndex: 1,
            }}
          >
            <Box
              ref={setHeaderCanvas}
              aria-label={t`Figure of a phylogenetic tree scale`.toString()}
              component={'canvas'}
              role={'figure'}
              sx={{
                width: treeCanvasWidth,
                height: ConfigManager.instance.config.epiTree.HEADER_HEIGHT,
              }}
            />
          </Box>
        )}
        <Box
          ref={scrollContainerRef}
          sx={{
            paddingTop: `${ConfigManager.instance.config.epiTree.HEADER_HEIGHT}px`,
            position: 'absolute',
            height,
            width,
            overflowY: 'hidden',
          }}
        >
          {!isTreeUnavailable && shouldShowTree && (
            <Box
              ref={setTreeCanvas}
              aria-label={t`Figure of a phylogenetic tree`.toString()}
              component={'canvas'}
              role={'figure'}
              sx={{
                width: treeCanvasWidth,
                height: treeCanvasHeight,
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
