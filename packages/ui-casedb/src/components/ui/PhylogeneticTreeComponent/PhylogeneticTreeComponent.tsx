import {
  Box,
  useTheme,
} from '@mui/material';
import type { Ref } from 'react';
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useDebouncedCallback } from 'use-debounce';

import { ConfigManager } from '../../../../../ui/src/classes/managers/ConfigManager';
import { DevicePixelRatioManager } from '../../../../../ui/src/classes/managers/DevicePixelRatioManager';
import { Subject } from '../../../../../ui/src/classes/Subject';
import { useDimensions } from '../../../../../ui/src/hooks/useDimensions';
import { useScrollbarSize } from '../../../../../ui/src/hooks/useScrollbarSize';
import { useSubscribable } from '../../../../../ui/src/hooks/useSubscribable';
import type {
  EpiLineListRangeSubjectValue,
  EpiLinkedScrollSubjectValue,
  Highlighting,
  Stratification,
} from '../../../models/epi';
import { EPI_ZONE } from '../../../models/epi';
import type {
  TreeAssembly,
  TreeNode,
  TreePathProperties,
} from '../../../../../ui/src/models/tree';
import { EpiTreeUtil } from '../../../utils/EpiTreeUtil';

// NOTE: this component has the Component suffix in order to prevent a name collision with the PhylogeneticTree model in the api package.

export type PhylogeneticTreeComponentPathClickEvent = {
  mouseEvent: MouseEvent;
  pathProperties: TreePathProperties;
};

export type PhylogeneticTreeComponentProps = {
  readonly ariaLabel: string;
  readonly externalScrollSubject?: Subject<EpiLinkedScrollSubjectValue>;
  readonly externalVisibleRangeSubject?: Subject<EpiLineListRangeSubjectValue>;
  readonly highlightingSubject?: Subject<Highlighting>;
  readonly initialViewState?: Partial<PhylogeneticTreeComponentViewState>;
  readonly itemHeight: number;
  readonly leafOrder: string[];
  readonly onCanvasChange?: (canvas?: HTMLCanvasElement) => void;
  readonly onLinkStateChange?: (isLinked: boolean) => void;
  readonly onPathClick?: (event: PhylogeneticTreeComponentPathClickEvent) => void;
  readonly onViewStateChange?: (viewState: PhylogeneticTreeComponentViewState) => void;
  readonly ref?: Ref<PhylogeneticTreeComponentRef>;
  readonly shouldShowDistances: boolean;
  readonly shouldShowSupportLinesWhenUnlinked: boolean;
  readonly stratification?: Stratification;
  readonly tree?: TreeNode;
};

export interface PhylogeneticTreeComponentRef {
  link: (verticalPosition?: number) => void;
  syncExternalScrollToVisibleTree: () => void;
  unlink: (viewState: { positionX: number; positionY: number; zoomLevel: number }) => void;
}

export type PhylogeneticTreeComponentViewState = {
  horizontalScrollPosition: number;
  verticalScrollPosition: number;
  zoomLevel: number;
};

export const PhylogeneticTreeComponent = ({
  ariaLabel,
  externalScrollSubject,
  externalVisibleRangeSubject,
  highlightingSubject,
  initialViewState,
  itemHeight,
  leafOrder,
  onCanvasChange,
  onLinkStateChange,
  onPathClick,
  onViewStateChange,
  ref,
  shouldShowDistances,
  shouldShowSupportLinesWhenUnlinked,
  stratification,
  tree,
}: PhylogeneticTreeComponentProps) => {
  const theme = useTheme();
  const scrollbarSize = useScrollbarSize();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { dimensions: { height, width } } = useDimensions(containerRef);
  const [treeCanvas, setTreeCanvas] = useState<HTMLCanvasElement>();
  const [treeAssembly, setTreeAssembly] = useState<TreeAssembly>(null);
  const [devicePixelRatio, setDevicePixelRatio] = useState<number>(DevicePixelRatioManager.getInstance().data);
  const [isLinked, setIsLinked] = useState(true);
  const canvasScrollSubject = useMemo(() => new Subject<{ x: number; y: number }>({ x: 0, y: 0 }), []);
  const fallbackHighlightingSubject = useMemo(() => new Subject<Highlighting>({
    caseIds: [],
    origin: null,
  }), []);
  const zoomLevelSubject = useMemo(() => new Subject<number>(!isNaN(initialViewState?.zoomLevel) ? initialViewState.zoomLevel : 1), [initialViewState?.zoomLevel]);
  const scrollPositionSubject = useMemo(() => new Subject<{ horizontal: number; vertical: number }>({
    horizontal: !isNaN(initialViewState?.horizontalScrollPosition) ? initialViewState.horizontalScrollPosition : 0,
    vertical: !isNaN(initialViewState?.verticalScrollPosition) ? initialViewState.verticalScrollPosition : 0,
  }), [initialViewState?.horizontalScrollPosition, initialViewState?.verticalScrollPosition]);
  const effectiveHighlightingSubject = highlightingSubject ?? fallbackHighlightingSubject;

  const headerHeight = ConfigManager.getInstance().config.epiTree.HEADER_HEIGHT;
  const treeCanvasWidth = width;
  const treeCanvasHeight = Math.max(0, height - headerHeight);
  const combinedCanvasHeight = Math.max(0, height);
  const treeWidthMinusPadding = treeCanvasWidth - (2 * ConfigManager.getInstance().config.epiTree.TREE_PADDING);
  const pixelToGeneticDistanceRatio = tree?.maxBranchLength ? treeWidthMinusPadding / tree.maxBranchLength.toNumber() : null;
  const treeHeight = tree?.size ? (tree.size * itemHeight) + scrollbarSize : itemHeight;

  const handleTreeCanvasRef = useCallback((canvas: HTMLCanvasElement | null) => {
    setTreeCanvas(canvas ?? undefined);
  }, []);

  useEffect(() => {
    onLinkStateChange?.(isLinked);
  }, [isLinked, onLinkStateChange]);

  useEffect(() => {
    if (!onCanvasChange) {
      return;
    }
    onCanvasChange(treeCanvas);

    return () => {
      if (treeCanvas) {
        onCanvasChange(undefined);
      }
    };
  }, [treeCanvas, onCanvasChange]);

  useEffect(() => {
    if (!onViewStateChange) {
      return;
    }

    const emitViewState = () => {
      onViewStateChange({
        horizontalScrollPosition: scrollPositionSubject.data.horizontal,
        verticalScrollPosition: scrollPositionSubject.data.vertical,
        zoomLevel: zoomLevelSubject.data,
      });
    };

    const unsubscribeFromZoomLevelSubject = zoomLevelSubject.subscribe(() => {
      emitViewState();
    });
    const unsubscribeFromScrollPositionSubject = scrollPositionSubject.subscribe(() => {
      emitViewState();
    });

    emitViewState();

    return () => {
      unsubscribeFromZoomLevelSubject();
      unsubscribeFromScrollPositionSubject();
    };
  }, [onViewStateChange, scrollPositionSubject, zoomLevelSubject]);

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

  const emitExternalScrollPosition = useCallback((position: number) => {
    if (!externalScrollSubject || !scrollContainerRef.current) {
      return;
    }

    externalScrollSubject.next({
      origin: scrollContainerRef.current,
      position,
    });
  }, [externalScrollSubject]);

  const updateExternalScrollSubjectDebounced = useDebouncedCallback((position: number) => {
    if (!externalScrollSubject || !scrollContainerRef.current) {
      return;
    }

    externalScrollSubject.next({
      origin: scrollContainerRef.current,
      position: position / devicePixelRatio,
    });
  }, ConfigManager.getInstance().config.epiTree.LINKED_SCROLL_DEBOUNCE_DELAY_MS, { leading: true, trailing: true });

  const updateScrollPosition = useCallback((params: { internalZoomLevel: number; positionX: number; positionY: number }) => {
    const { internalZoomLevel, positionX, positionY } = params;
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
      updateExternalScrollSubjectDebounced(newPositionY);
    }
  }, [canvasScrollSubject, devicePixelRatio, isLinked, treeCanvasHeight, treeCanvasWidth, treeHeight, updateExternalScrollSubjectDebounced]);

  const link = useCallback((verticalPosition?: number) => {
    const nextVerticalPosition = verticalPosition ?? externalScrollSubject?.data?.position ?? 0;

    zoomLevelSubject.next(1);
    setIsLinked(true);
    updateScrollPosition({
      internalZoomLevel: 1,
      positionX: 0,
      positionY: nextVerticalPosition,
    });

    if (verticalPosition !== undefined) {
      emitExternalScrollPosition(nextVerticalPosition);
    }
  }, [emitExternalScrollPosition, externalScrollSubject, updateScrollPosition, zoomLevelSubject]);

  const unlink = useCallback((viewState: { positionX: number; positionY: number; zoomLevel: number }) => {
    setIsLinked(false);
    zoomLevelSubject.next(viewState.zoomLevel);
    updateScrollPosition({
      internalZoomLevel: viewState.zoomLevel,
      positionX: viewState.positionX,
      positionY: viewState.positionY,
    });
  }, [updateScrollPosition, zoomLevelSubject]);

  const syncExternalScrollToVisibleTree = useCallback(() => {
    if (!tree?.size) {
      link(0);
      return;
    }

    const newScrollPosition = EpiTreeUtil.getScrollPositionFromTreeVisibility({
      itemHeight,
      treeCanvasHeight,
      treeHeight,
      treeSize: tree.size,
      verticalScrollPosition: scrollPositionSubject.data.vertical,
      zoomLevel: zoomLevelSubject.data,
    });

    link(newScrollPosition);
  }, [itemHeight, link, scrollPositionSubject, tree?.size, treeCanvasHeight, treeHeight, zoomLevelSubject]);

  useImperativeHandle(ref, () => ({
    link,
    syncExternalScrollToVisibleTree,
    unlink,
  }), [link, syncExternalScrollToVisibleTree, unlink]);

  const devicePixelRatioManagerCallback = useCallback((newDevicePixelRatio: number, previousDevicePixelRatio: number) => {
    canvasScrollSubject.next({
      x: (canvasScrollSubject.data.x / previousDevicePixelRatio) * newDevicePixelRatio,
      y: (canvasScrollSubject.data.y / previousDevicePixelRatio) * newDevicePixelRatio,
    });
    setDevicePixelRatio(newDevicePixelRatio);
  }, [canvasScrollSubject]);

  useSubscribable(DevicePixelRatioManager.getInstance(), {
    callback: devicePixelRatioManagerCallback,
  });

  const getTickerMarkScale = useCallback((zoomLevel: number) => {
    return EpiTreeUtil.getTickMarkScale({
      geneticTreeWidth: tree?.maxBranchLength,
      minGeneticScaleUnit: EpiTreeUtil.getMinGeneticScaleUnit(tree),
      treeWidthMinusPadding,
      zoomLevel,
    });
  }, [tree, treeWidthMinusPadding]);

  const getPathPropertiesFromCanvas = useCallback((canvas: HTMLCanvasElement, event: MouseEvent): TreePathProperties => {
    return EpiTreeUtil.getPathPropertiesFromCanvas({
      canvas,
      devicePixelRatio,
      event,
      treeAssembly,
    });
  }, [devicePixelRatio, treeAssembly]);

  useEffect(() => {
    if (!externalScrollSubject) {
      return;
    }

    let externalScrollData = externalScrollSubject.data;
    let zoomLevel = zoomLevelSubject.data;

    const update = () => {
      if (!externalScrollData || externalScrollData.origin === scrollContainerRef.current) {
        return;
      }
      if (isLinked && zoomLevel === 1) {
        canvasScrollSubject.next({
          x: canvasScrollSubject.data.x * devicePixelRatio,
          y: externalScrollData.position * devicePixelRatio,
        });
      }
    };

    const unsubscribeFromExternalScrollSubject = externalScrollSubject.subscribe((data) => {
      externalScrollData = data;
      update();
    });

    const unsubscribeFromZoomLevelSubject = zoomLevelSubject.subscribe((data) => {
      zoomLevel = data;
      update();
    });

    return () => {
      unsubscribeFromExternalScrollSubject();
      unsubscribeFromZoomLevelSubject();
    };
  }, [canvasScrollSubject, devicePixelRatio, externalScrollSubject, isLinked, zoomLevelSubject]);

  useEffect(() => {
    if (!tree || !pixelToGeneticDistanceRatio) {
      setTreeAssembly(null);
      return;
    }

    setTreeAssembly(EpiTreeUtil.assembleTree({
      externalLeafSorting: leafOrder,
      itemHeight,
      pixelToGeneticDistanceRatio,
      rootNode: tree,
      treeCanvasWidth,
    }));
  }, [itemHeight, leafOrder, pixelToGeneticDistanceRatio, tree, treeCanvasWidth]);

  useEffect(() => {
    if (!treeCanvas || !treeAssembly || !tree) {
      return;
    }

    let animationFrameId: number;
    let zoomLevel: number = zoomLevelSubject.data;
    let tickerMarkScale = getTickerMarkScale(zoomLevel);
    let highlighting: Highlighting = effectiveHighlightingSubject.data;
    let externalScrollPosition = externalScrollSubject?.data?.position ?? 0;
    let horizontalScrollPosition = scrollPositionSubject.data.horizontal;
    let verticalScrollPosition = scrollPositionSubject.data.vertical;
    let externalRange = externalVisibleRangeSubject?.data;

    const render = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        EpiTreeUtil.drawTreeCanvas({
          canvas: treeCanvas,
          devicePixelRatio,
          externalRange,
          externalScrollPosition,
          geneticTreeWidth: tree.maxBranchLength,
          headerHeight,
          highlightedNodeNames: highlighting?.caseIds,
          horizontalScrollPosition,
          isLinked,
          itemHeight,
          pixelToGeneticDistanceRatio,
          shouldShowDistances,
          shouldShowSupportLinesWhenUnlinked,
          stratification,
          theme,
          tickerMarkScale,
          treeAssembly,
          treeCanvasHeight,
          treeCanvasWidth,
          verticalScrollPosition,
          zoomLevel,
        });
      });
    };

    const unsubscribeFromHighlighting = effectiveHighlightingSubject.subscribe((data) => {
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

    const unsubscribeFromExternalScrollSubject = externalScrollSubject?.subscribe((data) => {
      if (data.origin === scrollContainerRef.current) {
        return;
      }
      externalScrollPosition = data.position;
      render();
    });

    const unsubscribeFromExternalVisibleRangeSubject = externalVisibleRangeSubject?.subscribe((data) => {
      externalRange = data;
      render();
    });

    render();

    return () => {
      unsubscribeFromHighlighting();
      unsubscribeFromExternalScrollSubject?.();
      unsubscribeFromScrollPositionSubject();
      unsubscribeFromZoomLevelSubject();
      unsubscribeFromExternalVisibleRangeSubject?.();
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    devicePixelRatio,
    effectiveHighlightingSubject,
    externalScrollSubject,
    externalVisibleRangeSubject,
    getTickerMarkScale,
    headerHeight,
    isLinked,
    itemHeight,
    pixelToGeneticDistanceRatio,
    scrollPositionSubject,
    shouldShowDistances,
    shouldShowSupportLinesWhenUnlinked,
    stratification,
    theme,
    tree,
    treeAssembly,
    treeCanvas,
    treeCanvasHeight,
    treeCanvasWidth,
    zoomLevelSubject,
  ]);

  useEffect(() => {
    if (!treeCanvas) {
      return;
    }

    let zoomLevel = zoomLevelSubject.data;

    let pos = {
      currentX: 0,
      currentY: 0,
      x: 0,
      y: 0,
    };
    let followMouse = false;

    const clearHighlighting = () => {
      if (effectiveHighlightingSubject.data?.caseIds?.length) {
        effectiveHighlightingSubject.next({
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

      pos = {
        currentX: canvasScrollSubject.data.x,
        currentY: canvasScrollSubject.data.y,
        x: event.clientX,
        y: event.clientY,
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

        const deltaX = event.clientX - pos.x;
        const deltaY = event.clientY - pos.y;
        const scrollPositionX = pos.currentX - deltaX;
        const scrollPositionY = pos.currentY - deltaY;

        let sanitizedScrollPositionX = scrollPositionX;
        if (zoomLevel === 1 && Math.abs(deltaX) < ConfigManager.getInstance().config.epiTree.PANNING_THRESHOLD && pos.currentX === 0) {
          sanitizedScrollPositionX = 0;
        }
        updateScrollPosition({ internalZoomLevel: zoomLevel, positionX: sanitizedScrollPositionX, positionY: scrollPositionY });
        return;
      }

      const pathProperties = getPathPropertiesFromCanvas(treeCanvas, event);
      if (pathProperties) {
        treeCanvas.style.cursor = 'pointer';
        effectiveHighlightingSubject.next({
          caseIds: pathProperties.subTreeLeaveNames,
          origin: EPI_ZONE.TREE,
        });
      } else {
        treeCanvas.style.cursor = 'default';
        clearHighlighting();
      }
    };

    const onMouseUp = (event: MouseEvent) => {
      followMouse = false;

      if (isEventInHeader(event)) {
        return;
      }

      const pathProperties = getPathPropertiesFromCanvas(treeCanvas, event);
      if (pathProperties) {
        onPathClick?.({
          mouseEvent: event,
          pathProperties,
        });
      }
    };

    const onMouseWheel = (event: WheelEvent) => {
      event.preventDefault();

      if (isEventInHeader(event)) {
        return;
      }

      if (event.shiftKey) {
        updateScrollPosition({ internalZoomLevel: zoomLevel, positionX: canvasScrollSubject.data.x + (event.deltaX || event.deltaY), positionY: canvasScrollSubject.data.y });
        return;
      }
      if (event.metaKey || event.ctrlKey) {
        updateScrollPosition({ internalZoomLevel: zoomLevel, positionX: canvasScrollSubject.data.x, positionY: canvasScrollSubject.data.y + (event.deltaX || event.deltaY) });
        return;
      }

      const { MAX_ZOOM_LEVEL, MAX_ZOOM_SPEED, MIN_ZOOM_LEVEL, MIN_ZOOM_SPEED } = ConfigManager.getInstance().config.epiTree;

      const zoomSpeed = Math.min(MAX_ZOOM_SPEED, Math.max(MIN_ZOOM_SPEED, treeHeight / treeCanvasHeight * 0.2));
      const newZoomLevel = Math.min(MAX_ZOOM_LEVEL, Math.max(MIN_ZOOM_LEVEL, zoomLevel + (event.deltaY > 0 ? zoomSpeed : -zoomSpeed)));
      const treeBodyOffsetY = event.offsetY - headerHeight;

      const newScrollPositionY = EpiTreeUtil.getNewScrollPositionForZoomLevel({
        currentZoomLevel: zoomLevel,
        dimensionSize: treeHeight,
        eventOffset: treeBodyOffsetY,
        newZoomLevel,
        scrollPosition: canvasScrollSubject.data.y,
      });
      const newScrollPositionX = EpiTreeUtil.getNewScrollPositionForZoomLevel({
        currentZoomLevel: zoomLevel,
        dimensionSize: treeCanvasWidth,
        eventOffset: event.offsetX,
        newZoomLevel,
        scrollPosition: canvasScrollSubject.data.x,
      });
      zoomLevelSubject.next(newZoomLevel);
      if (newZoomLevel !== 1) {
        updateScrollPosition({ internalZoomLevel: newZoomLevel, positionX: newScrollPositionX, positionY: newScrollPositionY });
      } else {
        updateScrollPosition({ internalZoomLevel: 1, positionX: newScrollPositionX, positionY: externalScrollSubject?.data?.position ?? 0 });
      }
    };

    const onMouseOut = () => {
      followMouse = false;
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
  }, [
    canvasScrollSubject,
    effectiveHighlightingSubject,
    externalScrollSubject,
    getPathPropertiesFromCanvas,
    headerHeight,
    onPathClick,
    treeCanvas,
    treeCanvasHeight,
    treeCanvasWidth,
    treeHeight,
    updateScrollPosition,
    zoomLevelSubject,
  ]);

  const shouldRenderCanvas = !!tree && treeCanvasWidth > 0 && tree.size > 0;

  return (
    <Box
      ref={containerRef}
      sx={{
        height: '100%',
        overflow: 'clip',
        position: 'relative',
        width: '100%',
      }}
    >
      <Box
        ref={scrollContainerRef}
        sx={{
          height: combinedCanvasHeight,
          overflowY: 'hidden',
          position: 'absolute',
          width: treeCanvasWidth,
        }}
      >
        {shouldRenderCanvas && (
          <Box
            aria-label={ariaLabel}
            component={'canvas'}
            ref={handleTreeCanvasRef}
            role={'figure'}
            sx={{
              height: combinedCanvasHeight,
              width: treeCanvasWidth,
            }}
          />
        )}
      </Box>
    </Box>
  );
};
