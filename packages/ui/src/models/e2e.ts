export type E2ETreeContract = {
  version: 1;
  status: 'loading' | 'ready' | 'unavailable' | 'error';
  renderRevision: number;
  canvas: {
    width: number;
    height: number;
  };
  tree: {
    size: number;
    leafCount: number;
    ancestorCount: number;
    supportLineCount: number;
    configurationLabel: string | null;
    stratificationLabel: string | null;
    legendItemCount: number;
  };
  viewport: {
    zoomLevel: number;
    isLinked: boolean;
    scrollX: number;
    scrollY: number;
  };
  interaction: {
    hasHighlight: boolean;
    highlightCount: number;
  };
};
