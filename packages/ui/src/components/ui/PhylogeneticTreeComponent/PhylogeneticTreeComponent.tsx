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

import { ConfigManager } from '../../../classes/managers/ConfigManager';
import { DevicePixelRatioManager } from '../../../classes/managers/DevicePixelRatioManager';
import { Subject } from '../../../classes/Subject';
import { useDimensions } from '../../../hooks/useDimensions';
import { useScrollbarSize } from '../../../hooks/useScrollbarSize';
import { useSubscribable } from '../../../hooks/useSubscribable';
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
} from '../../../models/tree';
import { EpiTreeUtil } from '../../../utils/EpiTreeUtil';

// NOTE: this component has the Component suffix in order to prevent a name collision with the PhylogeneticTree model in the api package.

export type PhylogeneticTreeComponentViewState = {
  zoomLevel: number;
  horizontalScrollPosition: number;
  verticalScrollPosition: number;
};

export type PhylogeneticTreeComponentPathClickEvent = {
  mouseEvent: MouseEvent;
  pathProperties: TreePathProperties;
};

export interface PhylogeneticTreeComponentRef {
  link: (verticalPosition?: number) => void;
  unlink: (viewState: { positionX: number; positionY: number; zoomLevel: number }) => void;
  syncExternalScrollToVisibleTree: () => void;
}

export type PhylogeneticTreeComponentProps = {
  readonly externalScrollSubject?: Subject<EpiLinkedScrollSubjectValue>;
  readonly externalVisibleRangeSubject?: Subject<EpiLineListRangeSubjectValue>;
  readonly highlightingSubject?: Subject<Highlighting>;
  readonly ref?: Ref<PhylogeneticTreeComponentRef>;
  readonly tree?: TreeNode;
  readonly leafOrder: string[];
  readonly stratification?: Stratification;
  readonly ariaLabel: string;
  readonly itemHeight: number;
  readonly shouldShowDistances: boolean;
  readonly shouldShowSupportLinesWhenUnlinked: boolean;
  readonly initialViewState?: Partial<PhylogeneticTreeComponentViewState>;
  readonly onCanvasChange?: (canvas?: HTMLCanvasElement) => void;
  readonly onLinkStateChange?: (isLinked: boolean) => void;
  readonly onPathClick?: (event: PhylogeneticTreeComponentPathClickEvent) => void;
  readonly onViewStateChange?: (viewState: PhylogeneticTreeComponentViewState) => void;
};

export const PhylogeneticTreeComponent = ({
  externalScrollSubject,
  externalVisibleRangeSubject,
  highlightingSubject,
  ref,
  tree,
  leafOrder,
  stratification,
  ariaLabel,
  itemHeight,
  shouldShowDistances,
  shouldShowSupportLinesWhenUnlinked,
  initialViewState,
  onCanvasChange,
  onLinkStateChange,
  onPathClick,
  onViewStateChange,
}: PhylogeneticTreeComponentProps) => {
  const theme = useTheme();
  const scrollbarSize = useScrollbarSize();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { dimensions: { width, height } } = useDimensions(containerRef);
  const [treeCanvas, setTreeCanvas] = useState<HTMLCanvasElement>();
  const [treeAssembly, setTreeAssembly] = useState<TreeAssembly>(null);
  const [devicePixelRatio, setDevicePixelRatio] = useState<number>(DevicePixelRatioManager.instance.data);
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

  const headerHeight = ConfigManager.instance.config.epiTree.HEADER_HEIGHT;
  const treeCanvasWidth = width;
  const treeCanvasHeight = Math.max(0, height - headerHeight);
  const combinedCanvasHeight = Math.max(0, height);
  const treeWidthMinusPadding = treeCanvasWidth - (2 * ConfigManager.instance.config.epiTree.TREE_PADDING);
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
        zoomLevel: zoomLevelSubject.data,
        verticalScrollPosition: scrollPositionSubject.data.vertical,
        horizontalScrollPosition: scrollPositionSubject.data.horizontal,
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
      position,
      origin: scrollContainerRef.current,
    });
  }, [externalScrollSubject]);

  const updateExternalScrollSubjectDebounced = useDebouncedCallback((position: number) => {
    if (!externalScrollSubject || !scrollContainerRef.current) {
      return;
    }

    externalScrollSubject.next({
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
      updateExternalScrollSubjectDebounced(newPositionY);
    }
  }, [canvasScrollSubject, devicePixelRatio, isLinked, treeCanvasHeight, treeCanvasWidth, treeHeight, updateExternalScrollSubjectDebounced]);

  const link = useCallback((verticalPosition?: number) => {
    const nextVerticalPosition = verticalPosition ?? externalScrollSubject?.data?.position ?? 0;

    zoomLevelSubject.next(1);
    setIsLinked(true);
    updateScrollPosition({
      positionX: 0,
      positionY: nextVerticalPosition,
      internalZoomLevel: 1,
    });

    if (verticalPosition !== undefined) {
      emitExternalScrollPosition(nextVerticalPosition);
    }
  }, [emitExternalScrollPosition, externalScrollSubject, updateScrollPosition, zoomLevelSubject]);

  const unlink = useCallback((viewState: { positionX: number; positionY: number; zoomLevel: number }) => {
    setIsLinked(false);
    zoomLevelSubject.next(viewState.zoomLevel);
    updateScrollPosition({
      positionX: viewState.positionX,
      positionY: viewState.positionY,
      internalZoomLevel: viewState.zoomLevel,
    });
  }, [updateScrollPosition, zoomLevelSubject]);

  const syncExternalScrollToVisibleTree = useCallback(() => {
    if (!tree?.size) {
      link(0);
      return;
    }

    const newScrollPosition = EpiTreeUtil.getScrollPositionFromTreeVisibility({
      treeHeight,
      treeSize: tree.size,
      treeCanvasHeight,
      verticalScrollPosition: scrollPositionSubject.data.vertical,
      zoomLevel: zoomLevelSubject.data,
      itemHeight,
    });

    link(newScrollPosition);
  }, [itemHeight, link, scrollPositionSubject, tree?.size, treeCanvasHeight, treeHeight, zoomLevelSubject]);

  useImperativeHandle(ref, () => ({
    link,
    unlink,
    syncExternalScrollToVisibleTree,
  }), [link, syncExternalScrollToVisibleTree, unlink]);

  const devicePixelRatioManagerCallback = useCallback((newDevicePixelRatio: number, previousDevicePixelRatio: number) => {
    canvasScrollSubject.next({
      x: (canvasScrollSubject.data.x / previousDevicePixelRatio) * newDevicePixelRatio,
      y: (canvasScrollSubject.data.y / previousDevicePixelRatio) * newDevicePixelRatio,
    });
    setDevicePixelRatio(newDevicePixelRatio);
  }, [canvasScrollSubject]);

  useSubscribable(DevicePixelRatioManager.instance, {
    callback: devicePixelRatioManagerCallback,
  });

  const getTickerMarkScale = useCallback((zoomLevel: number) => {
    return EpiTreeUtil.getTickMarkScale({
      treeWidthMinusPadding,
      geneticTreeWidth: tree?.maxBranchLength,
      minGeneticScaleUnit: EpiTreeUtil.getMinGeneticScaleUnit(tree),
      zoomLevel,
    });
  }, [tree, treeWidthMinusPadding]);

  const getPathPropertiesFromCanvas = useCallback((canvas: HTMLCanvasElement, event: MouseEvent): TreePathProperties => {
    return EpiTreeUtil.getPathPropertiesFromCanvas({
      canvas,
      event,
      treeAssembly,
      devicePixelRatio,
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
      rootNode: tree,
      treeCanvasWidth,
      pixelToGeneticDistanceRatio,
      itemHeight,
      externalLeafSorting: leafOrder,
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
          theme,
          geneticTreeWidth: tree.maxBranchLength,
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
          shouldShowDistances,
          shouldShowSupportLinesWhenUnlinked,
          devicePixelRatio,
          externalScrollPosition,
          externalRange,
          itemHeight,
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
      x: 0,
      y: 0,
      currentX: 0,
      currentY: 0,
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

        const deltaX = event.clientX - pos.x;
        const deltaY = event.clientY - pos.y;
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
        updateScrollPosition({ positionX: newScrollPositionX, positionY: externalScrollSubject?.data?.position ?? 0, internalZoomLevel: 1 });
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
        position: 'relative',
        height: '100%',
        width: '100%',
        overflow: 'clip',
      }}
    >
      <Box
        ref={scrollContainerRef}
        sx={{
          position: 'absolute',
          height: combinedCanvasHeight,
          width: treeCanvasWidth,
          overflowY: 'hidden',
        }}
      >
        {shouldRenderCanvas && (
          <Box
            ref={handleTreeCanvasRef}
            aria-label={ariaLabel}
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
  );
};
