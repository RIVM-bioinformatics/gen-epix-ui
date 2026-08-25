import { Box } from '@mui/material';
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
import { DevicePixelRatioService } from '@gen-epix/ui-core/classes/services/DevicePixelRatioService';
import { Subject } from '@gen-epix/ui-core/classes/Subject';
import { useScrollbarSize } from '@gen-epix/ui-core/hooks/useScrollbarSize';
import { useDimensions } from '@gen-epix/ui-core/hooks/useDimensions';
import { useSubscribable } from '@gen-epix/ui-core/hooks/useSubscribable';

import type { Highlighting } from '../../../models/caseDb';
import type {
  TreeAssembly,
  TreeNode,
  TreePathProperties,
} from '../../../models/tree';
import { TreeUtil } from '../../../utils/TreeUtil';
import { DASHBOARD_COMPONENT_NAME } from '../../../data/dashboard';

// NOTE: this component has the Component suffix in order to prevent a name collision with the PhylogeneticTree model in the api package.

export type PhylogeneticTreeExternalScrollSubjectValue = {
  origin: HTMLElement;
  position: number;
};

export type PhylogeneticTreeExternalVisibleRangeSubjectValue = {
  endIndex: number;
  startIndex: number;
};

export type PhylogeneticTreePathClickEvent = {
  mouseEvent: MouseEvent;
  pathProperties: TreePathProperties;
};

export type PhylogeneticTreeProps = {
  readonly ancestorDotRadius: number;
  readonly ariaLabel: string;
  readonly backgroundColor: string;
  readonly dimFn: (color: string) => string;
  readonly externalScrollSubject?: Subject<PhylogeneticTreeExternalScrollSubjectValue>;
  readonly externalVisibleRangeSubject?: Subject<PhylogeneticTreeExternalVisibleRangeSubjectValue>;
  readonly fontFamily: string;
  readonly headerHeight: number;
  readonly highlightingSubject?: Subject<Highlighting>;
  readonly initialViewState?: Partial<PhylogeneticTreeViewState>;
  readonly itemHeight: number;
  readonly leafDotRadius: number;
  readonly leafOrder: string[];
  readonly linkedScrollDebounceDelayMs: number;
  readonly maxScaleWidthPx: number;
  readonly maxZoomLevel: number;
  readonly maxZoomSpeed: number;
  readonly minimumDistancePercentageToShowLabel: number;
  readonly minScaleWidthPx: number;
  readonly minZoomLevel: number;
  readonly minZoomSpeed: number;
  readonly nodeNameColors?: { [key: string]: string } | null;
  readonly onCanvasChange?: (canvas?: HTMLCanvasElement) => void;
  readonly onLinkStateChange?: (isLinked: boolean) => void;
  readonly onPathClick?: (event: PhylogeneticTreePathClickEvent) => void;
  readonly onViewStateChange?: (viewState: PhylogeneticTreeViewState) => void;
  readonly panningThreshold: number;
  readonly ref?: Ref<PhylogeneticTreeRef>;
  readonly regularFillColorSupportLine: string;
  readonly scaleColor: string;
  readonly scaleIncrements: number[];
  readonly shouldShowDistances: boolean;
  readonly shouldShowSupportLinesWhenUnlinked: boolean;
  readonly supportLineColorLinked: string;
  readonly supportLineColorUnlinked: string;
  readonly tree?: TreeNode;
  readonly treeColor: string;
  readonly treeFont: string;
  readonly treePadding: number;
};

export interface PhylogeneticTreeRef {
  link: (verticalPosition?: number) => void;
  syncExternalScrollToVisibleTree: () => void;
  unlink: (viewState: { positionX: number; positionY: number; zoomLevel: number }) => void;
}

export type PhylogeneticTreeViewState = {
  horizontalScrollPosition: number;
  verticalScrollPosition: number;
  zoomLevel: number;
};

export const PhylogeneticTree = ({
  ancestorDotRadius,
  ariaLabel,
  backgroundColor,
  dimFn,
  externalScrollSubject,
  externalVisibleRangeSubject,
  fontFamily,
  headerHeight,
  highlightingSubject,
  initialViewState,
  itemHeight,
  leafDotRadius,
  leafOrder,
  linkedScrollDebounceDelayMs,
  maxScaleWidthPx,
  maxZoomLevel,
  maxZoomSpeed,
  minimumDistancePercentageToShowLabel,
  minScaleWidthPx,
  minZoomLevel,
  minZoomSpeed,
  nodeNameColors,
  onCanvasChange,
  onLinkStateChange,
  onPathClick,
  onViewStateChange,
  panningThreshold,
  ref,
  regularFillColorSupportLine,
  scaleColor,
  scaleIncrements,
  shouldShowDistances,
  shouldShowSupportLinesWhenUnlinked,
  supportLineColorLinked,
  supportLineColorUnlinked,
  tree,
  treeColor,
  treeFont,
  treePadding,
}: PhylogeneticTreeProps) => {
  const scrollbarSize = useScrollbarSize();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { dimensions: { height, width } } = useDimensions(containerRef);
  const [treeCanvas, setTreeCanvas] = useState<HTMLCanvasElement>();
  const [treeAssembly, setTreeAssembly] = useState<TreeAssembly>(null);
  const [devicePixelRatio, setDevicePixelRatio] = useState<number>(DevicePixelRatioService.getInstance().data);
  const [isLinked, setIsLinked] = useState(true);
  const canvasScrollSubject = useMemo(() => new Subject<{ x: number; y: number }>({ x: 0, y: 0 }), []);
  const fallbackHighlightingSubject = useMemo(() => new Subject<Highlighting>({
    caseIds: [],
    origin: null,
  }), []);
  const zoomLevelSubject = useMemo(() => new Subject<number>(!isNaN(initialViewState?.zoomLevel) ? initialViewState.zoomLevel : 1), [initialViewState]);
  const scrollPositionSubject = useMemo(() => new Subject<{ horizontal: number; vertical: number }>({
    horizontal: !isNaN(initialViewState?.horizontalScrollPosition) ? initialViewState.horizontalScrollPosition : 0,
    vertical: !isNaN(initialViewState?.verticalScrollPosition) ? initialViewState.verticalScrollPosition : 0,
  }), [initialViewState]);
  const effectiveHighlightingSubject = highlightingSubject ?? fallbackHighlightingSubject;

  const treeCanvasWidth = width;
  const treeCanvasHeight = Math.max(0, height - headerHeight);
  const combinedCanvasHeight = Math.max(0, height);
  const treeWidthMinusPadding = treeCanvasWidth - (2 * treePadding);
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
  }, linkedScrollDebounceDelayMs, { leading: true, trailing: true });

  const updateScrollPosition = useCallback((params: { internalZoomLevel: number; positionX: number; positionY: number }) => {
    const { internalZoomLevel, positionX, positionY } = params;
    if (internalZoomLevel === 0) {
      throw new Error('internalZoomLevel cannot be 0');
    }

    const { newPositionX, newPositionY } = TreeUtil.getSanitizedScrollPosition({
      devicePixelRatio,
      headerHeight,
      internalZoomLevel,
      isLinked,
      positionX,
      positionY,
      treeCanvasHeight,
      treeCanvasWidth,
      treeHeight,
      treePadding,
    });

    const positionYChanged = newPositionY !== canvasScrollSubject.data.y;

    canvasScrollSubject.next({
      x: newPositionX,
      y: newPositionY,
    });

    if (isLinked && internalZoomLevel === 1 && positionYChanged) {
      updateExternalScrollSubjectDebounced(newPositionY);
    }
  }, [canvasScrollSubject, devicePixelRatio, headerHeight, isLinked, treeCanvasHeight, treeCanvasWidth, treeHeight, treePadding, updateExternalScrollSubjectDebounced]);

  useEffect(() => {
    updateScrollPosition({
      internalZoomLevel: zoomLevelSubject.data,
      positionX: canvasScrollSubject.data.x,
      positionY: canvasScrollSubject.data.y,
    });
  }, [canvasScrollSubject, updateScrollPosition, zoomLevelSubject]);

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

    const newScrollPosition = TreeUtil.getScrollPositionFromTreeVisibility({
      itemHeight,
      treeCanvasHeight,
      treeHeight,
      treeSize: tree.size,
      verticalScrollPosition: scrollPositionSubject.data.vertical,
      zoomLevel: zoomLevelSubject.data,
    });

    link(newScrollPosition);
  }, [itemHeight, link, scrollPositionSubject, tree, treeCanvasHeight, treeHeight, zoomLevelSubject]);

  useImperativeHandle(ref, () => ({
    link,
    syncExternalScrollToVisibleTree,
    unlink,
  }), [link, syncExternalScrollToVisibleTree, unlink]);

  const devicePixelRatioServiceCallback = useCallback((newDevicePixelRatio: number, previousDevicePixelRatio: number) => {
    canvasScrollSubject.next({
      x: (canvasScrollSubject.data.x / previousDevicePixelRatio) * newDevicePixelRatio,
      y: (canvasScrollSubject.data.y / previousDevicePixelRatio) * newDevicePixelRatio,
    });
    setDevicePixelRatio(newDevicePixelRatio);
  }, [canvasScrollSubject]);

  useSubscribable(DevicePixelRatioService.getInstance(), {
    callback: devicePixelRatioServiceCallback,
  });

  const getTickerMarkScale = useCallback((zoomLevel: number) => {
    return TreeUtil.getTickMarkScale({
      geneticTreeWidth: tree?.maxBranchLength,
      maxScaleWidthPx,
      minGeneticScaleUnit: TreeUtil.getMinGeneticScaleUnit(tree),
      minScaleWidthPx,
      scaleIncrements,
      treeWidthMinusPadding,
      zoomLevel,
    });
  }, [maxScaleWidthPx, minScaleWidthPx, scaleIncrements, tree, treeWidthMinusPadding]);

  const getPathPropertiesFromCanvas = useCallback((canvas: HTMLCanvasElement, event: MouseEvent): TreePathProperties => {
    return TreeUtil.getPathPropertiesFromCanvas({
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

    setTreeAssembly(TreeUtil.assembleTree({
      ancestorDotRadius,
      externalLeafSorting: leafOrder,
      itemHeight,
      leafDotRadius,
      minimumDistancePercentageToShowLabel,
      pixelToGeneticDistanceRatio,
      rootNode: tree,
      treeCanvasWidth,
      treePadding,
    }));
  }, [ancestorDotRadius, itemHeight, leafDotRadius, leafOrder, minimumDistancePercentageToShowLabel, pixelToGeneticDistanceRatio, tree, treeCanvasWidth, treePadding]);

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
        TreeUtil.drawTreeCanvas({
          backgroundColor,
          canvas: treeCanvas,
          devicePixelRatio,
          dimFn,
          externalRange,
          externalScrollPosition,
          fontFamily,
          geneticTreeWidth: tree.maxBranchLength,
          headerHeight,
          highlightedNodeNames: highlighting?.caseIds,
          horizontalScrollPosition,
          isLinked,
          itemHeight,
          nodeNameColors,
          pixelToGeneticDistanceRatio,
          regularFillColorSupportLine,
          scaleColor,
          shouldShowDistances,
          shouldShowSupportLinesWhenUnlinked,
          supportLineColorLinked,
          supportLineColorUnlinked,
          tickerMarkScale,
          treeAssembly,
          treeCanvasHeight,
          treeCanvasWidth,
          treeColor,
          treeFont,
          treePadding,
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
    backgroundColor,
    devicePixelRatio,
    dimFn,
    effectiveHighlightingSubject,
    externalScrollSubject,
    externalVisibleRangeSubject,
    fontFamily,
    getTickerMarkScale,
    headerHeight,
    isLinked,
    itemHeight,
    pixelToGeneticDistanceRatio,
    regularFillColorSupportLine,
    scaleColor,
    scrollPositionSubject,
    shouldShowDistances,
    shouldShowSupportLinesWhenUnlinked,
    nodeNameColors,
    supportLineColorLinked,
    supportLineColorUnlinked,
    tree,
    treeAssembly,
    treeCanvas,
    treeCanvasHeight,
    treeCanvasWidth,
    treeColor,
    treeFont,
    treePadding,
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
          origin: DASHBOARD_COMPONENT_NAME.TREE,
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
        if (zoomLevel === 1 && Math.abs(deltaX) < panningThreshold && pos.currentX === 0) {
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
          origin: DASHBOARD_COMPONENT_NAME.TREE,
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

      const zoomSpeed = Math.min(maxZoomSpeed, Math.max(minZoomSpeed, treeHeight / treeCanvasHeight * 0.2));
      const newZoomLevel = Math.min(maxZoomLevel, Math.max(minZoomLevel, zoomLevel + (event.deltaY > 0 ? zoomSpeed : -zoomSpeed)));
      const treeBodyOffsetY = event.offsetY - headerHeight;

      const newScrollPositionY = TreeUtil.getNewScrollPositionForZoomLevel({
        currentZoomLevel: zoomLevel,
        dimensionSize: treeHeight,
        eventOffset: treeBodyOffsetY,
        newZoomLevel,
        scrollPosition: canvasScrollSubject.data.y,
      });
      const newScrollPositionX = TreeUtil.getNewScrollPositionForZoomLevel({
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
    treeCanvas.addEventListener('wheel', onMouseWheel, { passive: false });

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
    maxZoomLevel,
    maxZoomSpeed,
    minZoomLevel,
    minZoomSpeed,
    onPathClick,
    panningThreshold,
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
